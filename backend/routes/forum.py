import re
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from pymongo import ReturnDocument

from auth import CurrentUser, OptionalUser, new_id, now_iso
from db import NO_ID, db

router = APIRouter(prefix="/threads", tags=["forum"])


class ThreadIn(BaseModel):
    title: str = Field(default="", max_length=120)
    text: str = Field(min_length=5, max_length=2000)
    tag: str = Field(min_length=1, max_length=40)
    county: str = Field(min_length=1, max_length=60)
    image: Optional[str] = None

    @field_validator("title", "text", "tag", "county", mode="before")
    @classmethod
    def trim_fields(cls, value):
        return value.strip() if isinstance(value, str) else value


class CommentIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    parent_id: Optional[str] = None

    @field_validator("text", mode="before")
    @classmethod
    def trim_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class CommentOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    author: str
    text: str
    time: str
    parent_id: Optional[str] = None


class ThreadOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str = ""
    author: str
    handle: str = ""
    date: str
    created_at: str = ""
    tag: str
    text: str
    image: Optional[str] = None
    county: str = ""
    location: str = ""
    likes: int = 0
    liked: bool = False
    saved: bool = False
    resolved: bool = False
    comments: list[CommentOut] = Field(default_factory=list)


class FeedOut(BaseModel):
    items: list[ThreadOut]
    total: int
    next_page: Optional[int] = None


class SavedIn(BaseModel):
    saved: bool


class ResolvedIn(BaseModel):
    resolved: bool


def _view(doc: dict, user: Optional[dict]) -> dict:
    clean = {k: v for k, v in doc.items() if k not in ("_id", "liked_by", "saved_by", "moderation_reason")}
    visible = [c for c in doc.get("comments", []) if not c.get("hidden")]
    visible_ids = {c["id"] for c in visible}
    clean["comments"] = [{k: v for k, v in c.items() if k not in ("hidden", "moderation_reason")} for c in visible if not c.get("parent_id") or c["parent_id"] in visible_ids]
    clean["liked"] = bool(user and user["id"] in doc.get("liked_by", []))
    clean["saved"] = bool(user and user["id"] in doc.get("saved_by", []))
    return clean


@router.get("", response_model=list[ThreadOut])
async def list_threads(user: OptionalUser, mine: bool = False):
    if mine and not user:
        raise HTTPException(401, "Sign in to see your discussions")
    filters = {"user_id": user["id"], "hidden": {"$ne": True}} if mine else {"hidden": {"$ne": True}}
    docs = await db.threads.find(filters, NO_ID).sort("created_at", -1).to_list(200)
    return [_view(doc, user) for doc in docs]


@router.get("/feed", response_model=FeedOut)
async def forum_feed(
    user: OptionalUser,
    q: str = Query(default="", max_length=120),
    tag: str = Query(default="", max_length=40),
    sort: Literal["latest", "popular", "unanswered"] = "latest",
    scope: Literal["all", "mine", "saved"] = "all",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
):
    filters = {"hidden": {"$ne": True}}
    if scope != "all":
        if not user:
            raise HTTPException(401, "Sign in to see your discussions")
        filters["user_id" if scope == "mine" else "saved_by"] = user["id"]
    if tag:
        filters["tag"] = tag
    if q.strip():
        pattern = {"$regex": re.escape(q.strip()), "$options": "i"}
        filters["$or"] = [{field: pattern} for field in ("title", "text", "author", "county", "location")]
    if sort == "unanswered":
        filters["comments"] = {"$not": {"$elemMatch": {"hidden": {"$ne": True}, "$or": [{"parent_id": None}, {"parent_id": {"$exists": False}}]}}}
        filters["resolved"] = {"$ne": True}
    order = [("likes", -1), ("created_at", -1), ("id", 1)] if sort == "popular" else [("created_at", -1), ("id", 1)]
    total = await db.threads.count_documents(filters)
    docs = await db.threads.find(filters, NO_ID).sort(order).skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"items": [_view(doc, user) for doc in docs], "total": total, "next_page": page + 1 if page * limit < total else None}


@router.get("/{tid}", response_model=ThreadOut)
async def get_thread(tid: str, user: OptionalUser):
    doc = await db.threads.find_one({"id": tid, "hidden": {"$ne": True}}, NO_ID)
    if not doc:
        raise HTTPException(404, "Discussion not found")
    return _view(doc, user)


@router.post("", status_code=201, response_model=ThreadOut)
async def create_thread(body: ThreadIn, user: CurrentUser):
    now = now_iso()
    doc = {
        "id": new_id(), "user_id": user["id"], "author": user["name"],
        "handle": "@mqulima_" + "".join(user["name"].lower().split()),
        "date": now[:10], "created_at": now, "title": body.title,
        "tag": body.tag, "text": body.text, "image": body.image,
        "county": body.county, "location": body.county,
        "likes": 0, "liked_by": [], "saved_by": [], "comments": [], "resolved": False,
    }
    await db.threads.insert_one(doc)
    return _view(doc, user)


@router.post("/{tid}/comments", status_code=201, response_model=CommentOut)
async def add_comment(tid: str, body: CommentIn, user: CurrentUser):
    doc = await db.threads.find_one({"id": tid, "hidden": {"$ne": True}}, NO_ID)
    if not doc:
        raise HTTPException(404, "Discussion not found")
    if body.parent_id:
        parent = next((c for c in doc.get("comments", []) if c["id"] == body.parent_id), None)
        if not parent or parent.get("hidden"):
            raise HTTPException(400, "Reply not found in this discussion")
        if parent.get("parent_id"):
            raise HTTPException(400, "Reply to the original comment instead")
    comment = {"id": new_id(), "user_id": user["id"], "author": user["name"],
               "text": body.text, "time": now_iso(), "parent_id": body.parent_id}
    await db.threads.update_one({"id": tid}, {"$push": {"comments": comment}})
    return comment


@router.post("/{tid}/like")
async def toggle_like(tid: str, user: CurrentUser):
    # A single atomic update keeps counts consistent, even with concurrent taps/devices.
    liked = {"$in": [user["id"], {"$ifNull": ["$liked_by", []]}]}
    update = [{"$set": {
        "liked_by": {"$cond": [liked, {"$setDifference": ["$liked_by", [user["id"]]]}, {"$setUnion": [{"$ifNull": ["$liked_by", []]}, [user["id"]]]}]},
        "likes": {"$max": [0, {"$add": [{"$ifNull": ["$likes", 0]}, {"$cond": [liked, -1, 1]}]}]},
    }}]
    doc = await db.threads.find_one_and_update({"id": tid, "hidden": {"$ne": True}}, update, projection=NO_ID, return_document=ReturnDocument.AFTER)
    if not doc:
        raise HTTPException(404, "Discussion not found")
    return {"liked": user["id"] in doc["liked_by"], "likes": doc["likes"]}


@router.put("/{tid}/bookmark")
async def bookmark(tid: str, body: SavedIn, user: CurrentUser):
    operation = "$addToSet" if body.saved else "$pull"
    result = await db.threads.update_one({"id": tid, "hidden": {"$ne": True}}, {operation: {"saved_by": user["id"]}})
    if not result.matched_count:
        raise HTTPException(404, "Discussion not found")
    return {"saved": body.saved}


@router.put("/{tid}/resolved")
async def resolve(tid: str, body: ResolvedIn, user: CurrentUser):
    doc = await db.threads.find_one({"id": tid, "hidden": {"$ne": True}}, NO_ID)
    if not doc:
        raise HTTPException(404, "Discussion not found")
    if doc.get("user_id") != user["id"]:
        raise HTTPException(403, "Only the author can update this discussion")
    if doc.get("tag") != "Question":
        raise HTTPException(400, "Only questions can be marked resolved")
    await db.threads.update_one({"id": tid}, {"$set": {"resolved": body.resolved}})
    return {"resolved": body.resolved}