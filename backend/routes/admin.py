import asyncio
import re
from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError
from pymongo import ReturnDocument

from auth import AdminUser, new_id, now_iso, public_user
from db import NO_ID, db
from operations import audit
from admin_models import AdminList, AdminRecord, ArticleIn, CourseIn, ModerationIn, ProductIn, ServiceCategoryIn, ServiceIn, StatusIn

router = APIRouter(prefix="/admin", tags=["admin"])
RESOURCES = {
    "products": ("products", ["name", "category"], ProductIn),
    "orders": ("orders", ["id", "name", "phone", "county"], None),
    "forum": ("threads", ["title", "text", "author", "county"], None),
    "users": ("users", ["name", "email", "phone", "county"], None),
    "articles": ("articles", ["title", "category"], ArticleIn),
    "service-categories": ("service_categories", ["title"], ServiceCategoryIn),
    "services": ("services", ["title", "category_id"], ServiceIn),
    "requests": ("service_requests", ["name", "service", "county", "assigned_to"], None),
    "courses": ("courses", ["title", "level"], CourseIn),
    "waitlist": ("waitlist", ["email"], None),
    "inbox": ("inbox", ["name", "contact", "subject", "message"], None),
    "audit": ("audit", ["label", "actor", "action", "resource"], None),
}


def config(resource: str):
    if resource not in RESOURCES:
        raise HTTPException(404, "Management module not found")
    return RESOURCES[resource]


def clean(resource: str, item: dict):
    doc = {k: v for k, v in item.items() if k not in ("_id", "password_hash", "token_version", "liked_by", "saved_by", "is_initial_admin")}
    if resource == "users":
        return {**public_user(doc), "created_at": doc.get("created_at", "")}
    if RESOURCES[resource][2]:
        doc.setdefault("status", "published")
    elif resource == "forum":
        doc["status"] = "hidden" if doc.get("hidden") else "visible"
    if resource == "orders":
        doc.setdefault("payment_status", "Pending")
    return doc


async def existing(resource: str, identifier: str):
    collection, _, _ = config(resource)
    doc = await db[collection].find_one({"id": identifier}, NO_ID)
    if not doc:
        raise HTTPException(404, "Record not found")
    return doc


@router.get("/overview")
async def overview(admin: AdminUser):
    counts = await asyncio.gather(
        db.orders.count_documents({"status": {"$in": ["Processing", "Confirmed", "Dispatched"]}}),
        db.products.count_documents({"status": {"$nin": ["draft", "archived"]}}),
        db.users.count_documents({"role": {"$ne": "admin"}}),
        db.service_requests.count_documents({"status": {"$in": ["New", "Assigned", "In progress"]}}),
        db.inbox.count_documents({"status": {"$ne": "Resolved"}}),
        db.waitlist.count_documents({}),
        db.products.count_documents({"stock": {"$lte": 5}, "status": {"$nin": ["draft", "archived"]}}),
        db.threads.count_documents({"hidden": True}),
    )
    values = await db.orders.aggregate([{"$match": {"status": {"$ne": "Cancelled"}}}, {"$group": {"_id": None, "value": {"$sum": "$total"}}}, {"$project": {"_id": 0, "value": 1}}]).to_list(1)
    recent = await db.audit.find({}, NO_ID).sort("created_at", -1).limit(5).to_list(5)
    orders = await db.orders.find({"status": {"$in": ["Processing", "Confirmed", "Dispatched"]}}, NO_ID).sort("date", -1).limit(3).to_list(3)
    return {**dict(zip(["open_orders", "published_products", "customers", "open_requests", "open_messages", "waitlist", "low_stock", "hidden_threads"], counts)), "order_value": values[0]["value"] if values else 0, "recent_activity": recent, "recent_orders": [clean("orders", o) for o in orders], "updated_at": now_iso()}


@router.get("/{resource}", response_model=AdminList)
async def list_records(resource: str, admin: AdminUser, q: str = Query("", max_length=150), status: str = "all", page: int = Query(1, ge=1)):
    collection, fields, model = config(resource)
    filters = {}
    if q.strip():
        regex = {"$regex": re.escape(q.strip()), "$options": "i"}
        filters["$or"] = [{field: regex} for field in fields]
    if status != "all":
        if resource == "forum":
            filters["hidden"] = True if status == "hidden" else {"$ne": True}
        elif status == "published" and model:
            filters["status"] = {"$nin": ["draft", "archived"]}
        elif resource == "users" and status == "active":
            filters["status"] = {"$ne": "suspended"}
        elif resource == "products" and status == "low-stock":
            filters["stock"] = {"$lte": 5}
        else:
            filters["status"] = status
    total = await db[collection].count_documents(filters)
    order_by = "date" if resource == "orders" else "created_at"
    docs = await db[collection].find(filters, NO_ID).sort([(order_by, -1), ("id", 1)]).skip((page - 1) * 20).limit(20).to_list(20)
    return {"items": [clean(resource, d) for d in docs], "total": total, "page": page, "pages": max(1, (total + 19) // 20)}


@router.get("/{resource}/{identifier}", response_model=AdminRecord)
async def get_record(resource: str, identifier: str, admin: AdminUser):
    return {"item": clean(resource, await existing(resource, identifier))}


async def validate_content(resource: str, body: dict, old: dict | None = None):
    model = config(resource)[2]
    if not model:
        raise HTTPException(405, "Use this module’s workflow actions")
    try:
        values = model.model_validate(body).model_dump()
    except ValidationError as exc:
        error = exc.errors()[0]
        raise HTTPException(422, f"{'.'.join(map(str, error['loc']))}: {error['msg']}")
    image = values.get("image", "")
    if image and image != (old or {}).get("image"):
        if not image.startswith("/api/media/") or not await db.media.find_one({"id": image.split("/")[-1], "audience": "public_content"}, {"_id": 0, "id": 1}):
            raise HTTPException(422, "Upload the image using the image picker")
    if resource == "services" and not await db.service_categories.find_one({"id": values["category_id"]}, {"_id": 0, "id": 1}):
        raise HTTPException(422, "Select an existing service category")
    return values


@router.post("/{resource}", status_code=201, response_model=AdminRecord)
async def create_record(resource: str, body: dict, admin: AdminUser):
    values = await validate_content(resource, body)
    doc = {**values, "id": new_id(), "created_at": now_iso(), "updated_at": now_iso()}
    if resource == "products":
        doc["rating"] = 0
    if resource == "articles":
        doc["reads"] = 0
        doc["date"] = doc["date"] or now_iso()[:10]
    await db[config(resource)[0]].insert_one(doc)
    await audit(admin, "created", resource, doc["id"], doc.get("name") or doc.get("title", doc["id"]))
    return {"item": clean(resource, doc)}


@router.put("/{resource}/{identifier}", response_model=AdminRecord)
async def update_record(resource: str, identifier: str, body: dict, admin: AdminUser):
    old = await existing(resource, identifier)
    values = await validate_content(resource, body, old)
    values["updated_at"] = now_iso()
    doc = await db[config(resource)[0]].find_one_and_update({"id": identifier}, {"$set": values}, projection=NO_ID, return_document=ReturnDocument.AFTER)
    await audit(admin, "updated", resource, identifier, doc.get("name") or doc.get("title", identifier), [key for key in values if values[key] != old.get(key) and key != "updated_at"])
    return {"item": clean(resource, doc)}


@router.patch("/{resource}/{identifier}/state", response_model=AdminRecord)
async def change_state(resource: str, identifier: str, body: StatusIn, admin: AdminUser):
    doc = await existing(resource, identifier)
    values = {"status": body.status, "updated_at": now_iso()}
    query = {"id": identifier}
    if resource == "users":
        if doc.get("role") == "admin" or identifier == admin["id"]:
            raise HTTPException(409, "Administrator accounts cannot be suspended here")
        if body.status not in ("active", "suspended"):
            raise HTTPException(422, "Choose active or suspended")
        update = {"$set": values, "$inc": {"token_version": 1}}
    elif resource == "orders":
        transitions = {"Processing": ["Confirmed", "Cancelled"], "Confirmed": ["Dispatched", "Cancelled"], "Dispatched": ["Delivered"], "Delivered": [], "Cancelled": []}
        current = doc["status"]
        if body.status != current and body.status not in transitions.get(current, []):
            raise HTTPException(409, "This order cannot move to that status")
        query["status"] = current
        values["notes"] = body.notes
        if body.payment_status:
            if body.payment_status not in ("Pending", "Paid", "Refunded"):
                raise HTTPException(422, "Invalid manual payment status")
            if body.payment_status in ("Paid", "Refunded") and not body.payment_reference:
                raise HTTPException(422, "Enter a payment reference for the manual record")
            values.update(payment_status=body.payment_status, payment_reference=body.payment_reference)
        update = {"$set": values}
    elif resource in ("requests", "inbox", "waitlist"):
        allowed = {"requests": ["New", "Assigned", "In progress", "Completed", "Cancelled"], "inbox": ["New", "In progress", "Resolved"], "waitlist": ["New", "Contacted", "Invited"]}[resource]
        if body.status not in allowed:
            raise HTTPException(422, "Invalid workflow status")
        values["notes"] = body.notes
        if resource == "requests":
            if body.status in ("Assigned", "In progress") and not body.assigned_to:
                raise HTTPException(422, "Enter the assigned specialist’s name")
            values.update(assigned_to=body.assigned_to, specialist_contact=body.specialist_contact)
        update = {"$set": values}
    else:
        raise HTTPException(405, "Use the content editor or moderation controls")
    result = await db[config(resource)[0]].find_one_and_update(query, update, projection=NO_ID, return_document=ReturnDocument.AFTER)
    if not result:
        raise HTTPException(409, "Record changed. Refresh and try again.")
    if resource == "orders" and body.status == "Cancelled" and doc["status"] != "Cancelled" and doc.get("stock_reserved"):
        for item in doc["items"]:
            await db.products.update_one({"id": item["productId"]}, {"$inc": {"stock": item["qty"]}})
    await audit(admin, f"status: {body.status}", resource, identifier, doc.get("name") or doc.get("email") or identifier)
    return {"item": clean(resource, result)}


@router.patch("/forum/{identifier}/moderate", response_model=AdminRecord)
async def moderate_thread(identifier: str, body: ModerationIn, admin: AdminUser):
    await existing("forum", identifier)
    result = await db.threads.find_one_and_update({"id": identifier}, {"$set": {"hidden": body.hidden, "moderation_reason": body.reason, "updated_at": now_iso()}}, projection=NO_ID, return_document=ReturnDocument.AFTER)
    await audit(admin, "hidden" if body.hidden else "restored", "forum", identifier, result.get("title") or result["text"])
    return {"item": clean("forum", result)}


@router.patch("/forum/{identifier}/comments/{comment_id}", response_model=AdminRecord)
async def moderate_comment(identifier: str, comment_id: str, body: ModerationIn, admin: AdminUser):
    result = await db.threads.update_one({"id": identifier, "comments.id": comment_id}, {"$set": {"comments.$.hidden": body.hidden, "comments.$.moderation_reason": body.reason}})
    if not result.matched_count:
        raise HTTPException(404, "Reply not found")
    await audit(admin, "reply hidden" if body.hidden else "reply restored", "forum", identifier, comment_id)
    return {"item": clean("forum", await existing("forum", identifier))}