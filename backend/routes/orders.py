import random
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from auth import CurrentUser, now_iso
from db import NO_ID, db

router = APIRouter(prefix="/orders", tags=["orders"])
FREE_DELIVERY_FROM = 5000
DELIVERY_FEE = 300


class OrderItemIn(BaseModel):
    productId: str
    variant: Optional[str] = None
    qty: int = Field(ge=1, le=500)


class OrderIn(BaseModel):
    items: List[OrderItemIn] = Field(min_length=1)
    name: str = Field(min_length=3, max_length=80)
    phone: str = Field(min_length=10, max_length=20)
    county: str = Field(min_length=2, max_length=60)
    subcounty: str = Field(min_length=1, max_length=80)
    location: str = Field(min_length=1, max_length=120)


@router.post("", status_code=201)
async def create_order(body: OrderIn, user: CurrentUser):
    ids = list({i.productId for i in body.items})
    products = {p["id"]: p for p in await db.products.find({"id": {"$in": ids}}, NO_ID).to_list(len(ids))}
    items = []
    for i in body.items:
        p = products.get(i.productId)
        if not p:
            raise HTTPException(status_code=400, detail=f"Product {i.productId} is no longer available")
        price = p["price"]
        if i.variant:
            v = next((v for v in p.get("variants") or [] if v["label"] == i.variant), None)
            if not v:
                raise HTTPException(status_code=400, detail=f"Variant {i.variant} not available for {p['name']}")
            price = v["price"]
        items.append({"key": f"{p['id']}::{i.variant or ''}", "productId": p["id"], "name": p["name"], "image": p["image"], "variant": i.variant, "price": price, "qty": i.qty})
    subtotal = sum(x["price"] * x["qty"] for x in items)
    delivery = 0 if subtotal >= FREE_DELIVERY_FROM else DELIVERY_FEE
    order = {
        "id": f"MQ-{random.randint(100000, 999999)}",
        "user_id": user["id"],
        "date": now_iso(),
        "items": items,
        "subtotal": subtotal,
        "delivery": delivery,
        "total": subtotal + delivery,
        "name": body.name.strip(),
        "phone": body.phone.strip(),
        "county": body.county,
        "subcounty": body.subcounty.strip(),
        "location": body.location.strip(),
        "status": "Processing",
        "payment": "M-Pesa on confirmation",
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    return order


@router.get("")
async def my_orders(user: CurrentUser):
    return await db.orders.find({"user_id": user["id"]}, NO_ID).sort("date", -1).to_list(200)
