import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
from dotenv import load_dotenv

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from db import db

load_dotenv()

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "30"))

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)
users = db["users"]


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_user(doc: dict) -> dict:
    return {"id": doc["id"], "name": doc["name"], "email": doc["email"], "phone": doc.get("phone", ""), "county": doc.get("county", ""), "role": doc.get("role", "customer"), "status": doc.get("status", "active"), "must_change_password": doc.get("must_change_password", False)}


def make_token(user_id: str, version: int = 0, admin: bool = False) -> str:
    now = datetime.now(timezone.utc)
    lifetime = timedelta(hours=12) if admin else timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "iat": now, "exp": now + lifetime, "ver": version}, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def _decode(credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[dict]:
    if not credentials or credentials.scheme.lower() != "bearer":
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"require": ["sub", "exp"]})
        user = await users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user or user.get("status", "active") != "active" or int(payload.get("ver", 0)) != int(user.get("token_version", 0)):
            return None
        return user
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        return None


async def current_user(credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer)]) -> dict:
    user = await _decode(credentials)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in to continue", headers={"WWW-Authenticate": "Bearer"})
    return user


async def optional_user(credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer)]) -> Optional[dict]:
    return await _decode(credentials)


CurrentUser = Annotated[dict, Depends(current_user)]
OptionalUser = Annotated[Optional[dict], Depends(optional_user)]


async def require_admin(user: CurrentUser):
    if user.get("role") != "admin":
        raise HTTPException(403, "Administrator access required")
    if user.get("must_change_password"):
        raise HTTPException(403, "Change your initial password to open the admin workspace")
    return user


AdminUser = Annotated[dict, Depends(require_admin)]
