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
