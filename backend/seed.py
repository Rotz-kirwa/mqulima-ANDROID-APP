import json
import logging
from pathlib import Path

from db import db

logger = logging.getLogger(__name__)
SEED_FILE = Path(__file__).parent / "seed.json"


async def seed_if_empty() -> None:
    """Load the catalog/articles/threads into Mongo on first boot (idempotent)."""
    data = json.loads(SEED_FILE.read_text())
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many(data["products"])
        logger.info("seeded %d products", len(data["products"]))
    if await db.articles.count_documents({}) == 0:
        await db.articles.insert_many(data["articles"])
        logger.info("seeded %d articles", len(data["articles"]))
    if await db.threads.count_documents({}) == 0:
        for t in data["threads"]:
            t.setdefault("liked_by", [])
            t.setdefault("user_id", None)
            t["created_at"] = f"{t['date']}T08:00:00+00:00"
        await db.threads.insert_many(data["threads"])
        logger.info("seeded %d threads", len(data["threads"]))

    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index([("category", 1), ("name", 1)])
    await db.articles.create_index("id", unique=True)
    await db.threads.create_index("id", unique=True)
    await db.threads.create_index([("created_at", -1)])
    await db.orders.create_index([("user_id", 1), ("date", -1)])
    operations_file = Path(__file__).parent / "operations_seed.json"
    if operations_file.exists():
        operations_data = json.loads(operations_file.read_text())
        for collection, documents in operations_data.items():
            if await db[collection].count_documents({}) == 0:
                await db[collection].insert_many(documents)
            await db[collection].create_index("id", unique=True)
    await db.login_limits.create_index("key", unique=True)
    await db.login_limits.create_index("expires_at", expireAfterSeconds=0)
    await db.audit.create_index([("created_at", -1)])
    await db.waitlist.create_index("email", unique=True)
    await db.service_requests.create_index([("status", 1), ("created_at", -1)])
    await db.inbox.create_index([("status", 1), ("created_at", -1)])
