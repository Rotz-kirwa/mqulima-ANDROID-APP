from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import CurrentUser, make_token, new_id, now_iso, password_hash, public_user, users

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
    user = await users.find_one({"email": body.email.lower().strip()})
    if not user or not password_hash.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": make_token(user["id"]), "token_type": "bearer", "user": public_user(user)}


@router.get("/me")
async def me(user: CurrentUser):
    return public_user(user)
