import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from auth import OptionalUser, now_iso
from db import NO_ID, db
from sms import send_sms
from tasks import create_background_task

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
    subcounty: str = Field(default="", max_length=80)
    location: str = Field(min_length=1, max_length=120)
    paymentMethod: Optional[str] = None


@router.post("", status_code=201)
async def create_order(body: OrderIn, user: OptionalUser):
    ids = list({i.productId for i in body.items})
    products = {p["id"]: p for p in await db.products.find({"id": {"$in": ids}, "status": {"$nin": ["draft", "archived"]}}, NO_ID).to_list(len(ids))}
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

    # Determine user_id
    user_id = user["id"] if user else None
    if not user_id:
        existing_user = await db.users.find_one({"$or": [{"phone": body.phone.strip()}, {"email": body.phone.strip()}]})
        if existing_user:
            user_id = existing_user["id"]

    order = {
        "id": f"MQ-{uuid.uuid4().hex[:10].upper()}",
        "user_id": user_id,
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
        "payment": body.paymentMethod or "M-Pesa on confirmation",
        "payment_status": "Pending",
        "stock_reserved": True,
    }
    quantities = {pid: sum(item["qty"] for item in items if item["productId"] == pid) for pid in ids}
    reserved = []
    try:
        for pid, quantity in quantities.items():
            result = await db.products.update_one({"id": pid, "stock": {"$gte": quantity}, "status": {"$nin": ["draft", "archived"]}}, {"$inc": {"stock": -quantity}})
            if not result.modified_count:
                raise HTTPException(409, f"Not enough stock for {products[pid]['name']}. Update your cart.")
            reserved.append((pid, quantity))
        await db.orders.insert_one(order)
    except Exception:
        for pid, quantity in reserved:
            await db.products.update_one({"id": pid}, {"$inc": {"stock": quantity}})
        raise

    # Trigger background order confirmation SMS
    try:
        sms_msg = f"Habari {body.name}, order {order['id']} of KSh {order['total']:,} has been received and is being processed. Mqulima Team."
        create_background_task(
            send_sms(recipient=body.phone.strip(), message=sms_msg, trigger_type="order_placed"),
            name=f"order_sms:{order['id']}",
        )
    except Exception:
        pass

    order.pop("_id", None)
    return {"success": True, "order": order, **order}


@router.get("")
async def my_orders(user: OptionalUser, phone: Optional[str] = None):
    q: dict = {}
    if user:
        q = {"$or": [{"user_id": user["id"]}, {"phone": user.get("phone", "")}]}
    elif phone:
        q = {"phone": phone.strip()}
    else:
        return []
    return await db.orders.find(q, {"_id": 0, "notes": 0}).sort("date", -1).to_list(200)

