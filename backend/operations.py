import hashlib
import time
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from db import db
from auth import new_id, now_iso


async def audit(actor: dict, action: str, resource: str, target_id: str, label: str, fields: list[str] | None = None):
    await db.audit.insert_one({"id": new_id(), "actor_id": actor["id"], "actor": actor["email"], "action": action, "resource": resource, "target_id": target_id, "label": label[:160], "fields": fields or [], "created_at": now_iso()})


def limit_key(scope: str, value: str, seconds: int = 900):
    return hashlib.sha256(f"{scope}:{value}:{int(time.time()) // seconds}".encode()).hexdigest()


async def check_limit(scope: str, value: str, maximum: int = 10):
    key = limit_key(scope, value)
    doc = await db.login_limits.find_one({"key": key}, {"_id": 0, "count": 1})
    if doc and doc["count"] >= maximum:
        raise HTTPException(429, "Too many attempts. Please try again in 15 minutes.")
    return key


async def record_attempt(key: str):
    await db.login_limits.update_one({"key": key}, {"$inc": {"count": 1}, "$setOnInsert": {"expires_at": datetime.now(timezone.utc) + timedelta(minutes=16)}}, upsert=True)