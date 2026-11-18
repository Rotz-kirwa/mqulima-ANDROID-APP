from collections import OrderedDict
import hashlib
import io
import os
import threading
import requests
from PIL import Image, UnidentifiedImageError
from dotenv import load_dotenv
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse, Response
from starlette.concurrency import run_in_threadpool
from auth import AdminUser, new_id, now_iso
from db import NO_ID, db
from operations import audit

load_dotenv()
router = APIRouter(tags=["media"])
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
MEDIA_PUBLIC_BASE_URL = (os.environ.get("MEDIA_PUBLIC_BASE_URL") or "").strip().rstrip("/")
_key = None
_lock = threading.Lock()

_CACHE_MAX_ENTRIES = 128
_CACHE_MAX_BYTES = 32 * 1024 * 1024
_cache_lock = threading.Lock()
# Maps media identifier -> (content_bytes, content_type, etag)
_media_cache: OrderedDict[str, tuple[bytes, str, str]] = OrderedDict()
_media_cache_bytes = 0


def _cache_get(identifier: str) -> tuple[bytes, str, str] | None:
    with _cache_lock:
        entry = _media_cache.get(identifier)
        if entry is not None:
            _media_cache.move_to_end(identifier)
        return entry


def _cache_put(identifier: str, content: bytes, content_type: str, etag: str) -> None:
    global _media_cache_bytes
    size = len(content)
    if size > _CACHE_MAX_BYTES // 4:
        return
    with _cache_lock:
        existing = _media_cache.pop(identifier, None)
        if existing is not None:
            _media_cache_bytes -= len(existing[0])
        while _media_cache and (
            len(_media_cache) >= _CACHE_MAX_ENTRIES or _media_cache_bytes + size > _CACHE_MAX_BYTES
        ):
            _, evicted = _media_cache.popitem(last=False)
            _media_cache_bytes -= len(evicted[0])
        _media_cache[identifier] = (content, content_type, etag)
        _media_cache_bytes += size


def _etag_matches(header_value: str | None, etag: str) -> bool:
    if not header_value:
        return False
    return any(tag.strip() in (etag, "*") for tag in header_value.split(","))


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
    storage_path = result.json()["path"]
    public_url = f"{MEDIA_PUBLIC_BASE_URL}/{storage_path.lstrip('/')}" if MEDIA_PUBLIC_BASE_URL else None
    doc = {
        "id": identifier,
        "owner_id": admin["id"],
        "audience": "public_content",
        "storage_path": storage_path,
        "created_at": now_iso(),
        "content_type": "image/webp",
    }
    if public_url:
        doc["public_url"] = public_url
    await db.media.insert_one(doc)
    await audit(admin, "uploaded image", "media", identifier, file.filename or "Image")
    return {"image": public_url or f"/api/media/{identifier}"}


@router.get("/media/{identifier}")
async def public_image(identifier: str, request: Request):
    # Only explicitly public catalogue/editorial assets are served here, never private user uploads.
    doc = await db.media.find_one({"id": identifier, "audience": "public_content"}, NO_ID)
    if not doc or not doc.get("owner_id"):
        raise HTTPException(404, "Image not found")

    headers = {
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
    }

    cdn_url = doc.get("public_url") or (
        f"{MEDIA_PUBLIC_BASE_URL}/{doc['storage_path'].lstrip('/')}"
        if MEDIA_PUBLIC_BASE_URL and doc.get("storage_path")
        else None
    )
    if cdn_url:
        return RedirectResponse(url=cdn_url, status_code=307, headers=headers)

    if_none_match = request.headers.get("if-none-match")
    cached = _cache_get(identifier)
    if cached is not None:
        content, content_type, etag = cached
        if _etag_matches(if_none_match, etag):
            return Response(status_code=304, headers={**headers, "ETag": etag})
        return Response(content, media_type=content_type, headers={**headers, "ETag": etag})

    try:
        response = await run_in_threadpool(storage_request, "GET", doc["storage_path"])
    except requests.RequestException:
        raise HTTPException(503, "Image temporarily unavailable")

    content = response.content
    etag = f'"{hashlib.sha256(content).hexdigest()[:32]}"'
    _cache_put(identifier, content, doc["content_type"], etag)
    if _etag_matches(if_none_match, etag):
        return Response(status_code=304, headers={**headers, "ETag": etag})
    return Response(content, media_type=doc["content_type"], headers={**headers, "ETag": etag})
