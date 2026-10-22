from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError
from auth import new_id, now_iso
from db import NO_ID, db
from operations import check_limit, record_attempt

router = APIRouter(tags=["content"])
PUBLISHED = {"status": {"$nin": ["draft", "archived"]}}


@router.get("/services/categories")
async def categories():
    groups = await db.service_categories.find(PUBLISHED, NO_ID).sort("n", 1).to_list(100)
    services = await db.services.find(PUBLISHED, NO_ID).to_list(1000)
    return [{**group, "subs": [s for s in services if s["category_id"] == group["id"]]} for group in groups]


@router.get("/services/categories/{identifier}")
async def category(identifier: str):
    data = await categories()
    item = next((c for c in data if c["id"] == identifier), None)
    if not item:
        raise HTTPException(404, "Service category not found")
    return item


@router.get("/services/{identifier}")
async def service(identifier: str):
    item = await db.services.find_one({"id": identifier, **PUBLISHED}, NO_ID)
    if not item:
        raise HTTPException(404, "Service not found")
    group = await category(item["category_id"])
    return {"sub": item, "category": group, "price": item["price"], "steps": item.get("steps", []), "includes": item.get("includes", [])}


@router.get("/courses")
async def courses():
    return [public_course(doc) for doc in await db.courses.find(PUBLISHED, NO_ID).sort("n", 1).to_list(100)]


def public_course(item):
    return {**item, "modules": [{**module, "lessons": [lesson if lesson.get("preview") else {"title": lesson["title"], "duration": lesson["duration"], "preview": False} for lesson in module.get("lessons", [])]} for module in item.get("modules", [])]}


@router.get("/courses/{identifier}")
async def course(identifier: str):
    item = await db.courses.find_one({"id": identifier, **PUBLISHED}, NO_ID)
    if not item:
        raise HTTPException(404, "Course not found")
    return public_course(item)


class ServiceRequestIn(BaseModel):
    service: str = Field(min_length=2, max_length=150)
    name: str = Field(min_length=3, max_length=100)
    phone: str = Field(pattern=r"^(\+?254|0)[17]\d{8}$")
    county: str = Field(min_length=2, max_length=80)
    subcounty: str = Field(default="", max_length=100)
    date: str = Field(default="", max_length=100)
    details: str = Field(min_length=10, max_length=5000)


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    contact: str = Field(min_length=5, max_length=160)
    subject: str = Field(default="", max_length=200)
    message: str = Field(min_length=10, max_length=5000)


class WaitlistIn(BaseModel):
    email: EmailStr


async def submission(collection: str, values: dict, request: Request):
    key = await check_limit(f"submit-{collection}", request.client.host if request.client else "unknown", maximum=60)
    await record_attempt(key)
    doc = {**values, "id": new_id(), "status": "New", "created_at": now_iso(), "notes": ""}
    await db[collection].insert_one(doc)
    return {"id": doc["id"], "status": "New"}


@router.post("/service-requests", status_code=201)
async def request_service(body: ServiceRequestIn, request: Request):
    item = await db.services.find_one({"title": body.service, **PUBLISHED}, NO_ID)
    if not item:
        raise HTTPException(422, "This service is no longer available. Select another service.")
    await category(item["category_id"])
    return await submission("service_requests", {**body.model_dump(), "service_id": item["id"]}, request)


@router.post("/contact", status_code=201)
async def contact(body: ContactIn, request: Request):
    return await submission("inbox", body.model_dump(), request)


@router.post("/academy/waitlist", status_code=201)
async def waitlist(body: WaitlistIn, request: Request):
    try:
        return await submission("waitlist", {"email": body.email.lower().strip()}, request)
    except DuplicateKeyError:
        return {"status": "Registered"}