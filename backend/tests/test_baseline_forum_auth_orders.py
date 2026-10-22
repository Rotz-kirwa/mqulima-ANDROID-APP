"""Baseline verification for auth, catalog, forum, and orders critical flows."""

import os
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient


def _frontend_base_url() -> str:
    base = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").strip().rstrip("/")
    if base:
        return base
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        envs = dotenv_values(env_path)
        base = (envs.get("EXPO_PUBLIC_BACKEND_URL") or "").strip().rstrip("/")
    assert base, "EXPO_PUBLIC_BACKEND_URL not configured"
    return base


@pytest.fixture(scope="session")
def api_url() -> str:
    return f"{_frontend_base_url()}/api"


@pytest.fixture(scope="session")
def http() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def baseline_user(http: requests.Session, api_url: str):
    # Auth module: register a fresh test user used for protected-route and forum/order tests.
    ts = int(time.time() * 1000)
    email = f"TEST_baseline_{ts}@mqulima.com"
    payload = {
        "name": "TEST Baseline Farmer",
        "email": email,
        "phone": "0712345678",
        "county": "Nairobi",
        "password": "secret123",
    }
    reg = http.post(f"{api_url}/auth/register", json=payload)
    assert reg.status_code == 201, f"register failed: {reg.status_code} {reg.text}"
    token = reg.json()["access_token"]
    return {
        "email": email,
        "password": payload["password"],
        "token": token,
        "headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    }


@pytest.fixture(scope="session")
def forum_cleanup_ids():
    created_ids = []
    yield created_ids

    # Forum module: cleanup test-created threads directly from DB (no delete endpoint exposed).
    env = dotenv_values("/app/backend/.env")
    mongo_url = env.get("MONGO_URL") or os.environ.get("MONGO_URL")
    db_name = env.get("DB_NAME") or os.environ.get("DB_NAME")
    if not (mongo_url and db_name and created_ids):
        return

    client = MongoClient(mongo_url)
    try:
        client[db_name]["threads"].delete_many({"id": {"$in": created_ids}})
    finally:
        client.close()


def test_seed_login_success(http: requests.Session, api_url: str):
    r = http.post(f"{api_url}/auth/login", json={"email": "farmer@mqulima.com", "password": "farmer123"})
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["email"] == "farmer@mqulima.com"


def test_register_duplicate_409(http: requests.Session, api_url: str, baseline_user):
    r = http.post(
        f"{api_url}/auth/register",
        json={
            "name": "TEST Baseline Farmer",
            "email": baseline_user["email"],
            "phone": "0712345678",
            "county": "Nairobi",
            "password": "secret123",
        },
    )
    assert r.status_code == 409


def test_invalid_credentials_401(http: requests.Session, api_url: str):
    r = http.post(f"{api_url}/auth/login", json={"email": "farmer@mqulima.com", "password": "wrong12345"})
    assert r.status_code == 401


def test_auth_me_protected_and_valid(http: requests.Session, api_url: str, baseline_user):
    blocked = http.get(f"{api_url}/auth/me")
    assert blocked.status_code == 401

    ok = http.get(f"{api_url}/auth/me", headers=baseline_user["headers"])
    assert ok.status_code == 200
    assert ok.json()["email"] == baseline_user["email"].lower()


def test_catalog_total_189(http: requests.Session, api_url: str):
    # Catalog module: verify seeded product count baseline remains 189.
    r = http.get(f"{api_url}/products", params={"category": "All", "q": "", "page": 1})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 189
    assert len(data["items"]) > 0


def test_forum_create_reply_like_persistence(http: requests.Session, api_url: str, baseline_user, forum_cleanup_ids):
    # Forum module: list/detail/create/reply/like persistence for authenticated user.
    create = http.post(
        f"{api_url}/threads",
        json={"text": "TEST BASELINE forum thread persistence check", "tag": "Crops", "county": "Nairobi"},
        headers=baseline_user["headers"],
    )
    assert create.status_code == 201
    thread = create.json()
    tid = thread["id"]
    forum_cleanup_ids.append(tid)

    detail1 = http.get(f"{api_url}/threads/{tid}", headers=baseline_user["headers"])
    assert detail1.status_code == 200
    assert detail1.json()["text"] == "TEST BASELINE forum thread persistence check"

    comment = http.post(
        f"{api_url}/threads/{tid}/comments",
        json={"text": "TEST baseline comment"},
        headers=baseline_user["headers"],
    )
    assert comment.status_code == 201

    detail2 = http.get(f"{api_url}/threads/{tid}", headers=baseline_user["headers"])
    assert detail2.status_code == 200
    assert any(c["text"] == "TEST baseline comment" for c in detail2.json().get("comments", []))

    like = http.post(f"{api_url}/threads/{tid}/like", headers=baseline_user["headers"])
    assert like.status_code == 200
    assert like.json()["liked"] is True


def test_orders_checkout_and_history_persistence(http: requests.Session, api_url: str, baseline_user):
    # Orders module: create order then verify same order appears in history.
    products = http.get(f"{api_url}/products", params={"page": 1})
    assert products.status_code == 200
    first = products.json()["items"][0]

    create = http.post(
        f"{api_url}/orders",
        json={
            "items": [{"productId": first["id"], "qty": 1}],
            "name": "TEST Baseline Farmer",
            "phone": "0712345678",
            "county": "Nairobi",
            "subcounty": "Westlands",
            "location": "TEST baseline location",
        },
        headers=baseline_user["headers"],
    )
    assert create.status_code == 201
    order = create.json()

    history = http.get(f"{api_url}/orders", headers=baseline_user["headers"])
    assert history.status_code == 200
    assert any(o["id"] == order["id"] for o in history.json())
