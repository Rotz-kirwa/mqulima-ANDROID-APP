"""Async MongoDB connection pool and startup index lifecycle."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

client = AsyncIOMotorClient(
    settings.MONGO_URL,
    maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
    minPoolSize=settings.MONGO_MIN_POOL_SIZE,
    serverSelectionTimeoutMS=settings.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS=settings.MONGO_CONNECT_TIMEOUT_MS,
    socketTimeoutMS=settings.MONGO_SOCKET_TIMEOUT_MS,
    retryWrites=True,
)
db = client[settings.DB_NAME]

NO_ID = {"_id": 0}


async def ensure_indexes() -> None:
    """Create production compound and TTL indexes idempotently during startup."""
    try:
        await db.users.create_index([("id", ASCENDING)], unique=True, background=True)
        await db.users.create_index([("email", ASCENDING)], unique=True, background=True)
        await db.orders.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], background=True)
        await db.orders.create_index(
            [("idempotency_key", ASCENDING)],
            unique=True,
            partialFilterExpression={"idempotency_key": {"$type": "string"}},
            background=True,
        )

        await db.products.create_index([("id", ASCENDING)], unique=True, background=True)
        await db.products.create_index([("category", ASCENDING), ("status", ASCENDING)], background=True)
        await db.products.create_index([("status", ASCENDING), ("category", ASCENDING)], background=True)
        await db.products.create_index([("status", ASCENDING), ("featured", DESCENDING)], background=True)

        await db.articles.create_index([("id", ASCENDING)], unique=True, background=True)
        await db.articles.create_index([("group", ASCENDING)], background=True)
        await db.articles.create_index([("category", ASCENDING)], background=True)
        await db.articles.create_index([("created_at", DESCENDING)], background=True)
        await db.articles.create_index([("status", ASCENDING), ("featured", DESCENDING), ("created_at", DESCENDING)], background=True)
        await db.articles.create_index([("group", ASCENDING), ("status", ASCENDING), ("featured", DESCENDING), ("created_at", DESCENDING)], background=True)
        await db.articles.create_index([("category", ASCENDING), ("status", ASCENDING), ("featured", DESCENDING), ("created_at", DESCENDING)], background=True)

        await db.threads.create_index([("id", ASCENDING)], unique=True, background=True)
        await db.threads.create_index([("hidden", ASCENDING)], background=True)
        await db.threads.create_index([("tag", ASCENDING)], background=True)
        await db.threads.create_index([("created_at", DESCENDING)], background=True)
        await db.threads.create_index([("saved_by", ASCENDING)], background=True)
        await db.threads.create_index([("created_at", DESCENDING), ("tag", ASCENDING)], background=True)
        await db.threads.create_index([("hidden", ASCENDING), ("created_at", DESCENDING)], background=True)
        await db.threads.create_index([("tag", ASCENDING), ("hidden", ASCENDING), ("created_at", DESCENDING)], background=True)
        await db.threads.create_index([("saved_by", ASCENDING), ("hidden", ASCENDING), ("created_at", DESCENDING)], background=True)

        await db.media.create_index([("id", ASCENDING)], unique=True, background=True)

        await db.ai_messages.create_index([("session_id", ASCENDING), ("created_at", DESCENDING)], background=True)
        await db.login_limits.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0, background=True)
        logger.info("MongoDB production indexes verified.")
    except Exception as exc:
        logger.warning("Skipping MongoDB index creation (database unavailable during boot): %s", exc)
