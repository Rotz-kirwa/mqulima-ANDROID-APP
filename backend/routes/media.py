import io
import os
import threading
import requests
from PIL import Image, UnidentifiedImageError
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool
from auth import AdminUser, new_id, now_iso
from db import NO_ID, db
from operations import audit

load_dotenv()
router = APIRouter(tags=["media"])
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
_key = None
_lock = threading.Lock()


def init_storage():
    global _key
    with _lock:
        if not _key:
            response = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
            response.raise_for_status()
            _key = response.json()["storage_key"]
    return _key


def storage_request(method: str, path: str, data=None, mime=None):
    global _key
    for attempt in range(2):
        response = requests.request(method, f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(), **({"Content-Type": mime} if mime else {})}, data=data, timeout=60)
        if response.status_code == 503 and attempt == 0:
            _key = None
            continue
        if response.status_code == 402:
            raise HTTPException(402, "Image storage is currently unavailable for new uploads. Please contact the administrator.")
        response.raise_for_status()
        return response


def prepare_image(data: bytes):
    try:
        image = Image.open(io.BytesIO(data))
        if image.format not in ("PNG", "JPEG", "WEBP") or image.width * image.height > 30000000:
            raise ValueError()
        image.load()
        image.thumbnail((1800, 1800))
        output = io.BytesIO()
        image.convert("RGB").save(output, "WEBP", quality=86)
        return output.getvalue()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(422, "Choose a valid JPEG, PNG or WebP image under 30 megapixels")


@router.post("/admin/media", status_code=201)
async def upload_image(admin: AdminUser, file: UploadFile = File(...)):
    data = await file.read(5 * 1024 * 1024 + 1)
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "Choose an image smaller than 5 MB")
    data = await run_in_threadpool(prepare_image, data)
    identifier = new_id()
    path = f"mqulima/uploads/{admin['id']}/{identifier}.webp"
    try:
        result = await run_in_threadpool(storage_request, "PUT", path, data, "image/webp")
    except requests.RequestException:
        raise HTTPException(503, "Image storage is unavailable. Please try again later.")
    await db.media.insert_one({"id": identifier, "owner_id": admin["id"], "audience": "public_content", "storage_path": result.json()["path"], "created_at": now_iso(), "content_type": "image/webp"})
    await audit(admin, "uploaded image", "media", identifier, file.filename or "Image")
    return {"image": f"/api/media/{identifier}"}


@router.get("/media/{identifier}")
async def public_image(identifier: str):
    # Only explicitly public catalogue/editorial assets are served here, never private user uploads.
    doc = await db.media.find_one({"id": identifier, "audience": "public_content"}, NO_ID)
    if not doc or not doc.get("owner_id"):
        raise HTTPException(404, "Image not found")
    try:
        response = await run_in_threadpool(storage_request, "GET", doc["storage_path"])
    except requests.RequestException:
        raise HTTPException(503, "Image temporarily unavailable")
    return Response(response.content, media_type=doc["content_type"], headers={"Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff"})