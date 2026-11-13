import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from starlette.concurrency import run_in_threadpool
from starlette.middleware.cors import CORSMiddleware

from config import validate_startup_settings
from db import client, ensure_indexes
from hardening import SecurityAndLimitMiddleware, configure_structured_logging
from routes import admin, ai, auth, catalog, content, forum, media, orders, tools
from seed import seed_if_empty

configure_structured_logging()
settings = validate_startup_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await ensure_indexes()
    try:
        await seed_if_empty()
    except Exception as exc:
        logging.warning("Skipping startup seed check: %s", exc)

    async def warm_storage():
        try:
            await run_in_threadpool(media.init_storage)
        except Exception:
            logging.warning("Image storage warmup unavailable; uploads will retry on demand")

    storage_task = asyncio.create_task(warm_storage())
    yield
    storage_task.cancel()
    client.close()


app = FastAPI(title="Mqulima Platform API", version="1.0.0", lifespan=lifespan)


# Probe endpoint for the deployer and pod health checks: root-level (not /api), no DB call.
@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok", "env": settings.APP_ENV}


api_router = APIRouter(prefix="/api")
api_v1_router = APIRouter(prefix="/api/v1")


@api_router.get("/")
@api_v1_router.get("/")
async def root():
    return {"message": "Mqulima API", "version": "1.0.0"}


for r in (
    auth.router,
    auth.account_router,
    catalog.router,
    forum.router,
    orders.router,
    ai.router,
    content.router,
    media.router,
    admin.router,
    tools.router,
):
    api_router.include_router(r)
    api_v1_router.include_router(r)


app.include_router(api_router)
app.include_router(api_v1_router)

# Starlette applies middleware in reverse order of registration:
# CORS wraps SecurityAndLimitMiddleware so 413/429 responses retain CORS headers.
app.add_middleware(SecurityAndLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Idempotency-Key", "X-Request-ID"],
)
