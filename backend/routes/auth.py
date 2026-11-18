from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import CurrentUser, make_token, new_id, now_iso, password_hash, public_user, users
from db import db
from operations import audit, check_limit, record_attempt
from sms import send_welcome_sms
from tasks import create_background_task

router = APIRouter(prefix="/auth", tags=["auth"])
account_router = APIRouter(tags=["account"])


class RegisterIn(BaseModel):
    name: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=30)
    phoneNumber: Optional[str] = Field(default="", max_length=30)
    county: str = Field(default="", max_length=60)
    deliveryLocation: Optional[str] = ""
    farmingType: Optional[str] = "Crops"
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str


@router.post("/register", status_code=201)
async def register(body: RegisterIn):
    email = body.email.lower().strip()
    full_name = (body.name or f"{body.firstName or ''} {body.lastName or ''}").strip()
    if not full_name:
        full_name = "Farmer"
    phone_number = (body.phoneNumber or body.phone or "").strip()

    if await users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    doc = {
        "id": new_id(),
        "name": full_name,
        "email": email,
        "phone": phone_number,
        "county": body.county.strip(),
        "delivery_location": (body.deliveryLocation or body.county).strip(),
        "farming_type": (body.farmingType or "Crops").strip(),
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

    # Audit the registration in admin log
    try:
        await audit(
            {"name": full_name, "email": email, "id": doc["id"], "role": "customer"},
            "user_registered",
            "users",
            doc["id"],
            f"New farmer registered: {full_name} ({body.county})"
        )
    except Exception:
        pass

    # Fire official Mqulima welcome SMS via TextSMS Kenya
    if phone_number:
        create_background_task(
            send_welcome_sms(full_name, phone_number, body.password),
            name=f"welcome_sms:{doc['id']}",
        )

    tok = make_token(doc["id"])
    return {"access_token": tok, "token": tok, "token_type": "bearer", "user": public_user(doc)}


@router.post("/login")
async def login(body: LoginIn):
    target = (body.identifier or body.email or "").lower().strip()
    if not target:
        raise HTTPException(status_code=400, detail="Email or phone number is required")
    key = await check_limit("login", target)
    user = await users.find_one({"$or": [{"email": target}, {"phone": target}]})
    if not user or not password_hash.verify(body.password, user["password_hash"]):
        await record_attempt(key)
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.get("status", "active") != "active":
        raise HTTPException(401, "This account is suspended. Contact Mqulima support.")
    await db.login_limits.delete_one({"key": key})
    tok = make_token(user["id"], user.get("token_version", 0), user.get("role") == "admin")
    return {"access_token": tok, "token": tok, "token_type": "bearer", "user": public_user(user)}


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


async def _anonymize_and_delete_account(user: dict) -> dict:
    uid = user["id"]
    redacted_email = f"deleted-{uid}@redacted.mqulima.local"
    await users.update_one(
        {"id": uid},
        {
            "$set": {
                "name": "Deleted User",
                "email": redacted_email,
                "phone": "",
                "delivery_location": "",
                "status": "deleted",
                "deleted_at": now_iso(),
            },
            "$inc": {"token_version": 1},
        },
    )
    try:
        await audit(user, "account_deleted", "users", uid, "User requested in-app account deletion")
    except Exception:
        pass
    return {"success": True, "deleted": True, "message": "Your account has been permanently deactivated and personal data removed."}


@router.delete("/me")
async def delete_my_account(user: CurrentUser):
    """Play Console compliant self-service account deletion."""
    return await _anonymize_and_delete_account(user)


@account_router.delete("/account")
async def delete_account_alias(user: CurrentUser):
    """Alias for mobile app DELETE /api/v1/account self-service deletion."""
    return await _anonymize_and_delete_account(user)
