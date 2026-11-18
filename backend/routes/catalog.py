import asyncio
import json
import logging
import re
import time
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pymongo import UpdateOne

from db import NO_ID, db
from tasks import create_background_task

logger = logging.getLogger(__name__)
router = APIRouter(tags=["catalog"])
PAGE_SIZE = 24
PUBLIC = {"status": {"$nin": ["draft", "archived"]}}

_COUNT_TTL_SECONDS = 15.0
_COUNT_CACHE: dict[str, tuple[float, int]] = {}
_article_read_buffer: dict[str, int] = defaultdict(int)
_flush_task: Optional[asyncio.Task] = None


async def _get_cached_product_count(flt: dict) -> int:
    key = json.dumps(flt, sort_keys=True, default=str)
    now = time.monotonic()
    cached = _COUNT_CACHE.get(key)
    if cached and cached[0] > now:
        return cached[1]
    total = await db.products.count_documents(flt)
    if len(_COUNT_CACHE) > 256:
        _COUNT_CACHE.clear()
    _COUNT_CACHE[key] = (now + _COUNT_TTL_SECONDS, total)
    return total


async def _flush_article_reads() -> None:
    global _flush_task
    try:
        await asyncio.sleep(0.25)
        if not _article_read_buffer:
            return
        pending = dict(_article_read_buffer)
        _article_read_buffer.clear()
        ops = [UpdateOne({"id": aid}, {"$inc": {"reads": count}}) for aid, count in pending.items() if count > 0]
        if ops:
            await db.articles.bulk_write(ops, ordered=False)
    except Exception as exc:
        logger.warning("Failed to flush batched article reads: %s", exc)
    finally:
        _flush_task = None


def _queue_article_read(aid: str) -> None:
    global _flush_task
    _article_read_buffer[aid] += 1
    if _flush_task is None or _flush_task.done():
        _flush_task = create_background_task(_flush_article_reads(), name="flush_article_reads")


def _rx(q: str):
    return {"$regex": re.escape(q.strip()), "$options": "i"}


SUBCAT_KEYWORDS: dict[str, list[str]] = {
    "maize": ["maize", "h614d", "dk 8031", "pannar"],
    "vegetables": ["sukuma", "cabbage", "tomato", "onion", "carrot", "watermelon", "capsicum", "french bean", "spinach", "kale"],
    "legumes": ["bean", "sorghum", "legume", "rosecoco"],
    "pasture": ["napier", "grass", "fodder", "pasture"],
    "planting": ["dap", "npk 23", "planting", "npk 17", "18:46:0"],
    "topdress": ["can", "urea", "top dress", "26%n", "46%n"],
    "foliar": ["easygro", "polyfeed", "booster", "foliar", "biosol", "cytomone", "unigrow", "soluble"],
    "soil": ["lime", "compost", "magnesium", "algreen", "vermi", "organic"],
    "insecticides": ["duduthrin", "rocket", "belt", "escort", "alien", "confidor", "sherpa", "thunder", "actara"],
    "fungicides": ["ridomil", "tridex", "copper", "mancozeb", "topsin", "dithane", "sulphur", "zetanil"],
    "herbicides": ["glyphosate", "katerina", "weedal"],
    "protection": ["aquawet", "nimbecidine", "milestone", "hispeid"],
    "dairy": ["dairy", "calf", "molasses"],
    "poultry": ["chick", "grower", "kienyeji", "broiler", "layer"],
    "pigs_rabbits": ["pig", "rabbit"],
    "minerals": ["macclick", "mineral", "maziwa"],
    "dewormers": ["ivermectin", "albendazole", "tickgard", "dabendozole", "kupe"],
    "antibiotics": ["oxytetracycline"],
    "vaccines": ["newcastle", "gumboro", "aminovit", "vitamin"],
    "hygiene": ["teat", "milking", "salve", "cooper"],
    "sprayers": ["sprayer", "knapsack"],
    "irrigation": ["drip", "irrigation", "shade net"],
    "tools": ["wheelbarrow", "jembe", "shears", "tool"],
    "equipment": ["drinker", "feeder", "milk can", "thermometer", "ph meter", "incubator", "chaff cutter"],
}


def _search_query_filter(q: str) -> Optional[dict]:
    clean = q.strip()
    if not clean:
        return None
    tokens = [re.escape(t.strip()) for t in clean.split() if t.strip()]
    if not tokens:
        return None
    and_clauses = []
    for t in tokens:
        token_rx = f"({t}|{t}s)" if not t.endswith("s") else f"({t}|{t[:-1]})"
        rx = {"$regex": token_rx, "$options": "i"}
        and_clauses.append({
            "$or": [
                {"name": rx},
                {"description": rx},
                {"brand": rx},
                {"category": rx},
                {"variants.label": rx},
            ]
        })
    if len(and_clauses) == 1:
        return and_clauses[0]
    return {"$and": and_clauses}


@router.get("/products")
async def list_products(
    category: str = "All",
    sub_category: Optional[str] = None,
    q: str = "",
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=500),
    id: Optional[str] = None,
):
    if id:
        doc = await db.products.find_one({"id": id, **PUBLIC}, NO_ID)
        if not doc:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"success": True, "product": doc, **doc}

    f: dict = dict(PUBLIC)
    if category != "All":
        f["category"] = category

    q_filter = _search_query_filter(q)

    if sub_category and sub_category in SUBCAT_KEYWORDS:
        kw = SUBCAT_KEYWORDS[sub_category]
        sub_rx = "|".join(re.escape(k) for k in kw)
        sub_filter = {"name": {"$regex": sub_rx, "$options": "i"}}
        if q_filter:
            f["$and"] = [sub_filter, q_filter]
        else:
            f.update(sub_filter)
    elif q_filter:
        if "$and" in q_filter:
            f["$and"] = q_filter["$and"]
        else:
            f.update(q_filter)

    items = await db.products.find(f, NO_ID).skip((page - 1) * limit).limit(limit).to_list(limit)
    if page == 1 and len(items) < limit:
        total = len(items)
    else:
        total = await _get_cached_product_count(f)
    return {
        "success": True,
        "items": items,
        "products": items,
        "total": total,
        "page": page,
        "pages": max(1, -(-total // limit)),
    }


@router.get("/products/featured")
async def featured_products():
    return await db.products.find({"featured": True, **PUBLIC}, NO_ID).to_list(50)


@router.get("/products/by-ids")
async def products_by_ids(ids: str = ""):
    wanted = [i for i in ids.split(",") if i]
    if not wanted:
        return []
    docs = await db.products.find({"id": {"$in": wanted}, **PUBLIC}, NO_ID).to_list(len(wanted))
    order = {pid: i for i, pid in enumerate(wanted)}
    return sorted(docs, key=lambda d: order[d["id"]])


@router.get("/products/{pid}")
async def get_product(pid: str):
    doc = await db.products.find_one({"id": pid, **PUBLIC}, NO_ID)
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


@router.get("/articles")
@router.get("/news")
async def list_articles(group: str = "All", category: Optional[str] = None):
    target = category or group
    f = dict(PUBLIC) if (not target or target == "All") else {"$or": [{"group": target}, {"category": target}], **PUBLIC}
    items = await db.articles.find(f, NO_ID).sort([("featured", -1), ("created_at", -1)]).to_list(200)
    return items


@router.get("/articles/{aid}")
@router.get("/news/{aid}")
async def get_article(aid: str):
    doc = await db.articles.find_one({"id": aid, **PUBLIC}, NO_ID)
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    _queue_article_read(aid)
    return {**doc, "reads": int(doc.get("reads", 0)) + _article_read_buffer.get(aid, 0)}



@router.get("/search")
async def search(q: str = ""):
    t = q.strip()
    if not t:
        return {"products": [], "articles": []}
    rx = _rx(t)
    products = await db.products.find({"$or": [{"name": rx}, {"category": rx}], **PUBLIC}, NO_ID).limit(40).to_list(40)
    articles = await db.articles.find({"title": rx, **PUBLIC}, NO_ID).limit(20).to_list(20)
    return {"products": products, "articles": articles}
