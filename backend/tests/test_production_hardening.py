"""Standalone production hardening tests (rate limiting, CORS, headers, payload cap, AI fallback & account deletion)."""
import asyncio
import base64
import copy
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient

import auth
import hardening
import operations
import routes.ai as ai_routes
import routes.auth as auth_routes
import server
from config import Settings


class _FakeInsertResult:
    def __init__(self, inserted_id="1"):
        self.inserted_id = inserted_id


class _FakeUpdateResult:
    def __init__(self, modified_count: int):
        self.modified_count = modified_count


class _FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    def sort(self, *_args, **_kwargs):
        return self

    async def to_list(self, limit: int):
        return self._docs[:limit]


class _FakeCollection:
    def __init__(self):
        self.docs = {}

    async def find_one(self, query, _projection=None):
        for doc in self.docs.values():
            if "id" in query and doc.get("id") == query["id"]:
                return copy.deepcopy(doc)
            if "email" in query and doc.get("email") == query["email"]:
                return copy.deepcopy(doc)
        return None

    async def insert_one(self, doc):
        self.docs[doc["id"]] = copy.deepcopy(doc)
        return _FakeInsertResult(doc["id"])

    async def update_one(self, query, update, **_kwargs):
        doc = await self.find_one(query)
        if not doc:
            return _FakeUpdateResult(0)
        for k, v in update.get("$set", {}).items():
            doc[k] = v
        for k, v in update.get("$inc", {}).items():
            doc[k] = int(doc.get(k, 0)) + v
        self.docs[doc["id"]] = doc
        return _FakeUpdateResult(1)

    def find(self, *_args, **_kwargs):
        return _FakeCursor([])


@pytest.fixture(autouse=True)
def _reset_limiter_and_db(monkeypatch):
    asyncio.run(hardening.rate_limiter.reset())
    fake_users = _FakeCollection()
    fake_ai = _FakeCollection()
    fake_limits = _FakeCollection()
    monkeypatch.setattr(auth, "users", fake_users)
    monkeypatch.setattr(auth_routes, "users", fake_users)
    monkeypatch.setattr(ai_routes, "db", SimpleNamespace(ai_messages=fake_ai))
    monkeypatch.setattr(operations, "db", SimpleNamespace(login_limits=fake_limits, audit=_FakeCollection()))
    return fake_users


@pytest.fixture()
def client():
    return TestClient(server.app)


def test_health_and_security_headers(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert r.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert r.headers.get("X-Request-ID")


def test_cors_allowlist_blocks_untrusted_origin(client):
    allowed = client.options(
        "/api/v1/",
        headers={"Origin": "https://www.mqulima.com", "Access-Control-Request-Method": "GET"},
    )
    assert allowed.headers.get("access-control-allow-origin") == "https://www.mqulima.com"

    blocked = client.options(
        "/api/v1/",
        headers={"Origin": "https://evil.example.com", "Access-Control-Request-Method": "GET"},
    )
    assert blocked.headers.get("access-control-allow-origin") is None


def test_production_settings_rejects_short_jwt_or_wildcard_cors():
    with pytest.raises(ValueError):
        Settings(
            APP_ENV="production",
            MONGO_URL="mongodb://example.com:27017",
            JWT_SECRET="short-dev-secret",
            ALLOWED_ORIGINS="https://www.mqulima.com",
        )
    with pytest.raises(ValueError):
        Settings(
            APP_ENV="production",
            MONGO_URL="mongodb://example.com:27017",
            JWT_SECRET="a" * 40,
            ALLOWED_ORIGINS="*",
        )


def test_payload_limit_returns_413(client):
    oversized = "x" * (hardening.get_settings().MAX_REQUEST_BYTES + 1024)
    r = client.post(
        "/api/v1/ai/crop-doctor",
        content=oversized,
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 413


def test_auth_rate_limit_enforces_429(client):
    limit = hardening.get_settings().RATE_LIMIT_AUTH_PER_MIN
    for _ in range(limit):
        resp = client.post("/api/v1/auth/login", json={"email": "nobody@mqulima.com", "password": "invalid"})
        assert resp.status_code != 429

    blocked = client.post("/api/v1/auth/login", json={"email": "nobody@mqulima.com", "password": "invalid"})
    assert blocked.status_code == 429
    assert blocked.headers.get("Retry-After")
    assert blocked.headers.get("X-RateLimit-Remaining") == "0"


def test_crop_doctor_validates_image_and_returns_fallback(client, monkeypatch):
    monkeypatch.setenv("EMERGENT_LLM_KEY", "")
    # Refresh cached settings cleanly
    from config import get_settings
    get_settings.cache_clear()

    bad = client.post(
        "/api/v1/ai/crop-doctor",
        json={"crop": "Maize", "imageBase64": "!!!not_base64!!!"},
    )
    assert bad.status_code == 422

    too_big_b64 = base64.b64encode(b"0" * 1_600_000).decode("ascii")
    large = client.post(
        "/api/v1/ai/crop-doctor",
        json={"crop": "Maize", "imageBase64": too_big_b64},
    )
    assert large.status_code == 413

    ok = client.post(
        "/api/v1/ai/crop-doctor",
        json={"crop": "Maize", "county": "Uasin Gishu", "symptoms": {"pests_holes": True}},
    )
    assert ok.status_code == 200
    diag = ok.json()["diagnosis"]
    assert diag["source"] == "offline_agronomy_fallback"
    assert diag["immediateActions"]


def test_self_service_account_deletion_revokes_token(client, _reset_limiter_and_db):
    uid = "user-del-1"
    asyncio.run(
        _reset_limiter_and_db.insert_one(
            {
                "id": uid,
                "name": "Jane Wanjiku",
                "email": "jane@mqulima.com",
                "phone": "0711000222",
                "county": "Nyeri",
                "role": "customer",
                "status": "active",
                "token_version": 0,
                "password_hash": "h",
            }
        )
    )
    token = auth.make_token(uid, version=0)
    headers = {"Authorization": f"Bearer {token}"}

    me_before = client.get("/api/v1/auth/me", headers=headers)
    assert me_before.status_code == 200

    deleted = client.delete("/api/v1/account", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True

    me_after = client.get("/api/v1/auth/me", headers=headers)
    assert me_after.status_code == 401
