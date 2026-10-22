"""Operator-only, idempotent initial admin creation; never resets existing accounts."""
import argparse
import asyncio
import secrets
from auth import new_id, now_iso, password_hash
from db import client, db


async def seed(email: str):
    await db.users.create_index("email", unique=True)
    await db.users.create_index("is_initial_admin", unique=True, partialFilterExpression={"is_initial_admin": True})
    existing = await db.users.find_one({"$or": [{"email": email}, {"is_initial_admin": True}]}, {"_id": 0, "email": 1, "role": 1})
    if existing:
        print(f"Account already exists: {existing['email']}. No credentials or permissions changed.")
        return
    password = secrets.token_urlsafe(22)
    await db.users.insert_one({"id": new_id(), "name": "Mqulima Administrator", "email": email, "phone": "", "county": "", "password_hash": password_hash.hash(password), "role": "admin", "status": "active", "token_version": 0, "is_initial_admin": True, "must_change_password": True, "created_at": now_iso()})
    print(f"Created admin: {email}\nInitial password: {password}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    args = parser.parse_args()
    try:
        asyncio.run(seed(args.email.strip().lower()))
    finally:
        client.close()