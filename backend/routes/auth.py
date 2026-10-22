from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import CurrentUser, make_token, new_id, now_iso, password_hash, public_user, users
from db import db
from operations import audit, check_limit, record_attempt

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    email: EmailStr
    phone: str = Field(default="", max_length=20)
    county: str = Field(default="", max_length=60)
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=201)
async def register(body: RegisterIn):
    email = body.email.lower().strip()
    if await users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    doc = {
        "id": new_id(),
        "name": body.name.strip(),
        "email": email,
        "phone": body.phone.strip(),
        "county": body.county.strip(),
        "password_hash": password_hash.hash(body.password),
        "created_at": now_iso(),
        "role": "customer", "status": "active", "token_version": 0,
    }
    try:
        await users.insert_one(doc)
    except Exception as exc:  # unique index race
        if "duplicate" in str(exc).lower():
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        raise
    return {"access_token": make_token(doc["id"]), "token_type": "bearer", "user": public_user(doc)}


@router.post("/login")
async def login(body: LoginIn):
    key = await check_limit("login", body.email.lower().strip())
    user = await users.find_one({"email": body.email.lower().strip()})
    if not user or not password_hash.verify(body.password, user["password_hash"]):
        await record_attempt(key)
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.get("status", "active") != "active":
        raise HTTPException(401, "This account is suspended. Contact Mqulima support.")
    await db.login_limits.delete_one({"key": key})
    return {"access_token": make_token(user["id"], user.get("token_version", 0), user.get("role") == "admin"), "token_type": "bearer", "user": public_user(user)}


@router.get("/me")
async def me(user: CurrentUser):
    return public_user(user)


class PasswordIn(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


@router.post("/password")
async def change_password(body: PasswordIn, user: CurrentUser):
    key = await check_limit("password", user["id"])
    if not password_hash.verify(body.current_password, user["password_hash"]):
        await record_attempt(key)
        raise HTTPException(400, "Your current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(400, "Choose a different password")
    version = user.get("token_version", 0)
    result = await users.update_one({"id": user["id"], "password_hash": user["password_hash"]}, {"$set": {"password_hash": password_hash.hash(body.new_password), "must_change_password": False, "password_changed_at": now_iso()}, "$inc": {"token_version": 1}})
    if not result.modified_count:
        raise HTTPException(409, "Your session changed. Sign in again.")
    await audit(user, "password_changed", "users", user["id"], user["name"])
    user["must_change_password"] = False
    return {"access_token": make_token(user["id"], version + 1, user.get("role") == "admin"), "user": public_user(user)}
