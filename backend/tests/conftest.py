import os
import time
import pytest
import requests
from pathlib import Path

# Load EXPO_PUBLIC_BACKEND_URL from frontend/.env (public URL used by the client)
_env_path = Path("/app/frontend/.env")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL and _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
            break
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not configured"

API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api():
    return API


@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def new_user(http):
    """Register a brand-new user for this session."""
    ts = int(time.time() * 1000)
    email = f"TEST_tester+{ts}@gmail.com"
    payload = {
        "name": "TEST Tester",
        "email": email,
        "phone": "0712345678",
        "county": "Nairobi",
        "password": "secret123",
    }
    r = http.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 201, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"email": email, "password": payload["password"], "token": data["access_token"], "user": data["user"]}


@pytest.fixture(scope="session")
def auth_headers(new_user):
    return {"Authorization": f"Bearer {new_user['token']}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def existing_user_token(http):
    r = http.post(f"{API}/auth/login", json={"email": "farmer@mqulima.com", "password": "farmer123"})
    assert r.status_code == 200, f"existing user login failed: {r.text}"
    return r.json()["access_token"]
