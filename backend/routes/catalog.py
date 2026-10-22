import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from db import NO_ID, db

router = APIRouter(tags=["catalog"])
PAGE_SIZE = 24


def _rx(q: str):
    return {"$regex": re.escape(q.strip()), "$options": "i"}


@router.get("/products")
async def list_products(category: str = "All", q: str = "", page: int = Query(1, ge=1)):
    f: dict = {}
    if category != "All":
        f["category"] = category
    if q.strip():
        f["name"] = _rx(q)
    total = await db.products.count_documents(f)
    items = await db.products.find(f, NO_ID).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).to_list(PAGE_SIZE)
    return {"items": items, "total": total, "page": page, "pages": max(1, -(-total // PAGE_SIZE))}


@router.get("/products/featured")
async def featured_products():
    return await db.products.find({"featured": True}, NO_ID).to_list(50)


@router.get("/products/by-ids")
async def products_by_ids(ids: str = ""):
    wanted = [i for i in ids.split(",") if i]
    if not wanted:
        return []
    docs = await db.products.find({"id": {"$in": wanted}}, NO_ID).to_list(len(wanted))
    order = {pid: i for i, pid in enumerate(wanted)}
    return sorted(docs, key=lambda d: order[d["id"]])


@router.get("/products/{pid}")
async def get_product(pid: str):
    doc = await db.products.find_one({"id": pid}, NO_ID)
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


@router.get("/articles")
async def list_articles(group: str = "All"):
    f = {} if group == "All" else {"group": group}
    return await db.articles.find(f, NO_ID).to_list(200)


@router.get("/articles/{aid}")
async def get_article(aid: str):
    doc = await db.articles.find_one_and_update({"id": aid}, {"$inc": {"reads": 1}}, projection=NO_ID, return_document=True)
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    return doc


@router.get("/search")
async def search(q: str = ""):
    t = q.strip()
    if not t:
        return {"products": [], "articles": []}
    rx = _rx(t)
    products = await db.products.find({"$or": [{"name": rx}, {"category": rx}]}, NO_ID).limit(40).to_list(40)
    articles = await db.articles.find({"title": rx}, NO_ID).limit(20).to_list(20)
    return {"products": products, "articles": articles}
