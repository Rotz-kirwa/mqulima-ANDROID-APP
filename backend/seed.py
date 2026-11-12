import json
import logging
from pathlib import Path

from db import db

logger = logging.getLogger(__name__)
SEED_FILE = Path(__file__).parent / "seed.json"


async def sync_products_328() -> int:
    """Sync full 328-item certified agricultural products catalog into MongoDB."""
    try:
        from catalog_data import PRODUCTS_328
        for p in PRODUCTS_328:
            await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
        logger.info("Synchronized %d catalog products into MongoDB", len(PRODUCTS_328))

        # Keep seed.json synchronized with 328 items
        try:
            if SEED_FILE.exists():
                sdata = json.loads(SEED_FILE.read_text())
                sdata["products"] = PRODUCTS_328
                SEED_FILE.write_text(json.dumps(sdata, indent=2))
                logger.info("seed.json updated with %d products", len(PRODUCTS_328))
        except Exception as se:
            logger.warning("Could not sync seed.json: %s", se)

        # Keep frontend static catalog synchronized with 328 items
        try:
            frontend_json = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "products_328.json"
            frontend_json.write_text(json.dumps(PRODUCTS_328, indent=2))
            logger.info("frontend products_328.json updated with %d products", len(PRODUCTS_328))
        except Exception as fe:
            logger.warning("Could not sync frontend products_328.json: %s", fe)

        return len(PRODUCTS_328)
    except Exception as e:
        logger.error("Error syncing PRODUCTS_328: %s", e)
        return 0


async def seed_if_empty() -> None:
    """Load the catalog/articles/threads into Mongo on first boot (idempotent)."""
    data = json.loads(SEED_FILE.read_text())
    if await db.products.count_documents({}) < 300:
        await sync_products_328()
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

    from auth import now_iso, password_hash
    if not await db.users.find_one({"email": "admin@mqulima.com"}):
        await db.users.insert_one({
            "id": "admin_mqulima_master",
            "name": "Mqulima Administrator",
            "email": "admin@mqulima.com",
            "phone": "+254700000000",
            "county": "Nairobi",
            "password_hash": password_hash.hash("Admin@2026!"),
            "role": "admin",
            "status": "active",
            "token_version": 0,
            "must_change_password": False,
            "created_at": now_iso(),
        })
        logger.info("seeded default administrator account (admin@mqulima.com)")
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
    if await db.commodities.count_documents({}) == 0:
        commodities = [
            {"id": "c-maize-eld", "name": "Dry Maize", "emoji": "🌽", "unit": "90kg bag", "market": "Eldoret (NCPB)", "price": 3800, "change": -3.1, "type": "Cash", "category": "Cereals & Grains"},
            {"id": "c-maize-nbi", "name": "Dry Maize", "emoji": "🌽", "unit": "90kg bag", "market": "Nairobi (Wakulima)", "price": 4100, "change": 1.5, "type": "Cash", "category": "Cereals & Grains"},
            {"id": "c-beans-nak", "name": "Beans (Rosecoco)", "emoji": "🫘", "unit": "90kg bag", "market": "Nakuru (Top Market)", "price": 8600, "change": 2.4, "type": "Cash", "category": "Pulses & Legumes"},
            {"id": "c-beans-nbi", "name": "Beans (Rosecoco)", "emoji": "🫘", "unit": "kg", "market": "Nairobi (Marikiti)", "price": 145, "change": 3.1, "type": "Cash", "category": "Pulses & Legumes"},
            {"id": "c-potatoes-nyan", "name": "Shangi Potatoes", "emoji": "🥔", "unit": "50kg bag", "market": "Nyandarua (Ol Kalou)", "price": 2450, "change": -1.8, "type": "Horticulture", "category": "Horticulture & Tubers"},
            {"id": "c-potatoes-nbi", "name": "Shangi Potatoes", "emoji": "🥔", "unit": "50kg bag", "market": "Nairobi (Wakulima)", "price": 2850, "change": 2.2, "type": "Horticulture", "category": "Horticulture & Tubers"},
            {"id": "c-tomatoes-nbi", "name": "Tomatoes", "emoji": "🍅", "unit": "kg", "market": "Nairobi (Marikiti)", "price": 85, "change": 3.2, "type": "Horticulture", "category": "Horticulture & Tubers"},
            {"id": "c-cabbage-nyan", "name": "Cabbage", "emoji": "🥬", "unit": "medium head", "market": "Nyandarua", "price": 45, "change": -2.6, "type": "Horticulture", "category": "Horticulture & Tubers"},
            {"id": "c-cabbage-nbi", "name": "Cabbage", "emoji": "🥬", "unit": "medium head", "market": "Nairobi", "price": 65, "change": 2.0, "type": "Horticulture", "category": "Horticulture & Tubers"},
            {"id": "c-onions-ksm", "name": "Onions (Red)", "emoji": "🧅", "unit": "kg", "market": "Kisumu (Jubilee)", "price": 120, "change": 1.1, "type": "Horticulture", "category": "Horticulture & Tubers"},
            {"id": "c-mangoes-msa", "name": "Apple Mangoes", "emoji": "🥭", "unit": "kg", "market": "Mombasa (Kongowea)", "price": 100, "change": 4.0, "type": "Fruits", "category": "Fruits & Horticulture"},
            {"id": "c-avocado-nbi", "name": "Avocados (Fuerte/Hass)", "emoji": "🥑", "unit": "kg", "market": "Nairobi (Wakulima)", "price": 110, "change": 4.1, "type": "Fruits", "category": "Fruits & Horticulture"},
            {"id": "c-bananas-ks", "name": "Bananas (Cooking)", "emoji": "🍌", "unit": "bunch", "market": "Kisii (Daraja Mbili)", "price": 680, "change": 0.8, "type": "Fruits", "category": "Fruits & Horticulture"},
            {"id": "c-coffee-nyeri", "name": "Coffee (Cherry)", "emoji": "☕", "unit": "kg", "market": "Nyeri (Millers)", "price": 95, "change": 5.0, "type": "Cash", "category": "Cash Crops & Inputs"},
            {"id": "c-tea-ker", "name": "Tea (Green leaf)", "emoji": "🍵", "unit": "kg", "market": "Kericho (KTDA)", "price": 25, "change": 0.4, "type": "Cash", "category": "Cash Crops & Inputs"},
            {"id": "c-milk-eld", "name": "Fresh Raw Milk", "emoji": "🥛", "unit": "1L", "market": "Eldoret (Dairies)", "price": 52, "change": 1.2, "type": "Horticulture", "category": "Livestock & Dairy"},
        ]
        await db.commodities.insert_many(commodities)
        logger.info("seeded %d market commodities", len(commodities))
    await db.commodities.create_index("id", unique=True)
    await db.commodities.create_index("type")

