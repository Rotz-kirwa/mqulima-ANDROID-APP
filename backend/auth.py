import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from db import db

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
    return {"id": doc["id"], "name": doc["name"], "email": doc["email"], "phone": doc.get("phone", ""), "county": doc.get("county", "")}


def make_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": user_id, "iat": now, "exp": now + timedelta(days=JWT_EXPIRE_DAYS)}, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def _decode(credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[dict]:
    if not credentials or credentials.scheme.lower() != "bearer":
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return await users.find_one({"id": payload["sub"]}, {"_id": 0})
    except (InvalidTokenError, KeyError, TypeError):
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
