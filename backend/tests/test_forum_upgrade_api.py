"""Forum upgrade API regression tests: feed filters/sort/scope, bookmarks, replies, and resolve permissions."""

import os
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient


def _base_url() -> str:
    base = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").strip().rstrip("/")
    if base:
        return base
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        base = (dotenv_values(env_path).get("EXPO_PUBLIC_BACKEND_URL") or "").strip().rstrip("/")
    assert base, "EXPO_PUBLIC_BACKEND_URL not configured"
    return base


@pytest.fixture(scope="session")
def api_url() -> str:
    return f"{_base_url()}/api"


@pytest.fixture(scope="session")
def http() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login_or_skip(http: requests.Session, api_url: str, email: str, password: str) -> dict:
    r = http.post(f"{api_url}/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        pytest.skip(f"auth failed for {email}: {r.status_code} {r.text}")
    body = r.json()
    return {
        "token": body["access_token"],
        "user": body["user"],
        "headers": {"Authorization": f"Bearer {body['access_token']}", "Content-Type": "application/json"},
    }


@pytest.fixture(scope="session")
def farmer_user(http: requests.Session, api_url: str):
    # Auth module: stable seeded user for owner-only and feed scope checks.
    return _login_or_skip(http, api_url, "farmer@mqulima.com", "farmer123")


@pytest.fixture(scope="session")
def secondary_user(http: requests.Session, api_url: str):
    # Auth module: second user for unauthorized/forbidden checks.
    return _login_or_skip(http, api_url, "test_baseline_1792664970572@mqulima.com", "secret123")


@pytest.fixture(scope="session")
def forum_cleanup_ids():
    created_ids: list[str] = []
    yield created_ids

    env = dotenv_values("/app/backend/.env")
    mongo_url = env.get("MONGO_URL") or os.environ.get("MONGO_URL")
    db_name = env.get("DB_NAME") or os.environ.get("DB_NAME")
    if not (mongo_url and db_name):
        return

    exact_artifact_ids = [
        "1831cabb-c100-46f7-b725-705f5d35a7a2",
        "d3f78b3a-06ff-4075-b56a-d51a739db563",
        "6d5edebd-4c5d-43e2-af18-cfd6081cd965",
    ]
    target_ids = list({*created_ids, *exact_artifact_ids})
    client = MongoClient(mongo_url)
    try:
        client[db_name]["threads"].delete_many({"id": {"$in": target_ids}})
    finally:
        client.close()


def _create_thread(http: requests.Session, api_url: str, headers: dict, title: str, text: str, tag: str = "Question", county: str = "Nairobi"):
    r = http.post(
        f"{api_url}/threads",
        json={"title": title, "text": text, "tag": tag, "county": county},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_feed_private_scope_requires_auth(http: requests.Session, api_url: str):
    for scope in ("mine", "saved"):
        r = http.get(f"{api_url}/threads/feed", params={"scope": scope})
        assert r.status_code == 401


def test_feed_search_literal_escaped(http: requests.Session, api_url: str, farmer_user, forum_cleanup_ids):
    marker = f"TEST_LITERAL_{int(time.time()*1000)}"
    literal = "[abc]+(test).*?"
    t = _create_thread(
        http,
        api_url,
        farmer_user["headers"],
        title=f"{marker} {literal}",
        text=f"Body with literal token {literal}",
        tag="Question",
    )
    forum_cleanup_ids.append(t["id"])

    found = http.get(f"{api_url}/threads/feed", params={"q": literal, "scope": "all", "sort": "latest", "page": 1, "limit": 20})
    assert found.status_code == 200
    ids = [x["id"] for x in found.json()["items"]]
    assert t["id"] in ids


def test_feed_tag_filter_and_pagination_next_page(http: requests.Session, api_url: str):
    page1 = http.get(f"{api_url}/threads/feed", params={"tag": "Question", "page": 1, "limit": 1})
    assert page1.status_code == 200
    payload = page1.json()
    assert "items" in payload and isinstance(payload["items"], list)
    assert payload["total"] >= 1
    assert payload["next_page"] == 2


def test_feed_popular_sort_prioritizes_liked_threads(http: requests.Session, api_url: str, farmer_user, secondary_user, forum_cleanup_ids):
    marker = f"TEST_POPULAR_{int(time.time()*1000)}"
    low = _create_thread(http, api_url, farmer_user["headers"], f"{marker}_low", "popular low", "Question")
    high = _create_thread(http, api_url, farmer_user["headers"], f"{marker}_high", "popular high", "Question")
    forum_cleanup_ids.extend([low["id"], high["id"]])

    like = http.post(f"{api_url}/threads/{high['id']}/like", headers=secondary_user["headers"])
    assert like.status_code == 200
    assert like.json()["liked"] is True

    feed = http.get(f"{api_url}/threads/feed", params={"q": marker, "sort": "popular", "scope": "all", "page": 1, "limit": 20})
    assert feed.status_code == 200
    items = feed.json()["items"]
    ids = [x["id"] for x in items]
    assert high["id"] in ids and low["id"] in ids
    assert ids.index(high["id"]) < ids.index(low["id"])


def test_bookmark_persists_and_saved_scope_reflects(http: requests.Session, api_url: str, farmer_user, secondary_user, forum_cleanup_ids):
    marker = f"TEST_BOOKMARK_{int(time.time()*1000)}"
    t = _create_thread(http, api_url, farmer_user["headers"], marker, "bookmark target", "Farming Tips")
    forum_cleanup_ids.append(t["id"])

    save = http.put(f"{api_url}/threads/{t['id']}/bookmark", json={"saved": True}, headers=secondary_user["headers"])
    assert save.status_code == 200
    assert save.json()["saved"] is True

    saved_feed = http.get(f"{api_url}/threads/feed", params={"scope": "saved", "q": marker, "page": 1, "limit": 20}, headers=secondary_user["headers"])
    assert saved_feed.status_code == 200
    assert any(x["id"] == t["id"] for x in saved_feed.json()["items"])

    unsave = http.put(f"{api_url}/threads/{t['id']}/bookmark", json={"saved": False}, headers=secondary_user["headers"])
    assert unsave.status_code == 200
    assert unsave.json()["saved"] is False

    saved_feed2 = http.get(f"{api_url}/threads/feed", params={"scope": "saved", "q": marker, "page": 1, "limit": 20}, headers=secondary_user["headers"])
    assert saved_feed2.status_code == 200
    assert all(x["id"] != t["id"] for x in saved_feed2.json()["items"])


def test_mine_scope_is_current_user_only(http: requests.Session, api_url: str, farmer_user, secondary_user, forum_cleanup_ids):
    marker = f"TEST_MINE_{int(time.time()*1000)}"
    t = _create_thread(http, api_url, farmer_user["headers"], marker, "mine scope body", "Farm Progress")
    forum_cleanup_ids.append(t["id"])

    mine_farmer = http.get(f"{api_url}/threads/feed", params={"scope": "mine", "q": marker, "page": 1, "limit": 20}, headers=farmer_user["headers"])
    assert mine_farmer.status_code == 200
    assert any(x["id"] == t["id"] for x in mine_farmer.json()["items"])

    mine_secondary = http.get(f"{api_url}/threads/feed", params={"scope": "mine", "q": marker, "page": 1, "limit": 20}, headers=secondary_user["headers"])
    assert mine_secondary.status_code == 200
    assert all(x["id"] != t["id"] for x in mine_secondary.json()["items"])


def test_parent_validation_rejects_parent_from_other_thread(http: requests.Session, api_url: str, farmer_user, secondary_user, forum_cleanup_ids):
    marker = f"TEST_PARENT_{int(time.time()*1000)}"
    t1 = _create_thread(http, api_url, farmer_user["headers"], f"{marker}_A", "parent thread A", "Question")
    t2 = _create_thread(http, api_url, farmer_user["headers"], f"{marker}_B", "parent thread B", "Question")
    forum_cleanup_ids.extend([t1["id"], t2["id"]])

    c = http.post(f"{api_url}/threads/{t1['id']}/comments", json={"text": "root comment"}, headers=farmer_user["headers"])
    assert c.status_code == 201
    parent_id = c.json()["id"]

    bad = http.post(
        f"{api_url}/threads/{t2['id']}/comments",
        json={"text": "cross-thread reply", "parent_id": parent_id},
        headers=secondary_user["headers"],
    )
    assert bad.status_code == 400
    assert "Reply not found" in bad.text


def test_nested_reply_and_thread_like_persistence(http: requests.Session, api_url: str, farmer_user, secondary_user, forum_cleanup_ids):
    marker = f"TEST_NESTED_{int(time.time()*1000)}"
    t = _create_thread(http, api_url, farmer_user["headers"], marker, "nested reply and like", "Question")
    forum_cleanup_ids.append(t["id"])

    root = http.post(f"{api_url}/threads/{t['id']}/comments", json={"text": "root"}, headers=farmer_user["headers"])
    assert root.status_code == 201
    root_id = root.json()["id"]

    nested = http.post(f"{api_url}/threads/{t['id']}/comments", json={"text": "nested", "parent_id": root_id}, headers=secondary_user["headers"])
    assert nested.status_code == 201
    assert nested.json()["parent_id"] == root_id

    like = http.post(f"{api_url}/threads/{t['id']}/like", headers=secondary_user["headers"])
    assert like.status_code == 200
    assert like.json()["liked"] is True

    detail = http.get(f"{api_url}/threads/{t['id']}", headers=secondary_user["headers"])
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["likes"] >= 1
    assert payload["liked"] is True
    assert any(c.get("parent_id") == root_id for c in payload["comments"])


def test_only_owner_can_resolve_and_unanswered_excludes_resolved(http: requests.Session, api_url: str, farmer_user, secondary_user, forum_cleanup_ids):
    marker = f"TEST_RESOLVE_{int(time.time()*1000)}"
    t = _create_thread(http, api_url, farmer_user["headers"], marker, "resolve ownership", "Question")
    forum_cleanup_ids.append(t["id"])

    unauthorized = http.put(f"{api_url}/threads/{t['id']}/resolved", json={"resolved": True}, headers=secondary_user["headers"])
    assert unauthorized.status_code == 403

    owner_ok = http.put(f"{api_url}/threads/{t['id']}/resolved", json={"resolved": True}, headers=farmer_user["headers"])
    assert owner_ok.status_code == 200
    assert owner_ok.json()["resolved"] is True

    detail = http.get(f"{api_url}/threads/{t['id']}", headers=farmer_user["headers"])
    assert detail.status_code == 200
    assert detail.json()["resolved"] is True

    unanswered = http.get(f"{api_url}/threads/feed", params={"q": marker, "sort": "unanswered", "scope": "all", "page": 1, "limit": 20})
    assert unanswered.status_code == 200
    assert all(x["id"] != t["id"] for x in unanswered.json()["items"])
