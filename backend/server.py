import logging
import asyncio
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from db import client
from seed import seed_if_empty
from routes import ai, auth, catalog, forum, orders, admin, content, media
from starlette.concurrency import run_in_threadpool

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await seed_if_empty()
    async def warm_storage():
        try:
            await run_in_threadpool(media.init_storage)
        except Exception:
            logging.warning("Image storage warmup unavailable; uploads will retry on demand")
    storage_task = asyncio.create_task(warm_storage())
    yield
    storage_task.cancel()
    client.close()


app = FastAPI(lifespan=lifespan)


# Probe endpoint for the deployer and pod health checks: root-level (not /api), no DB call.
@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}


api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Mqulima API"}


for r in (auth.router, catalog.router, forum.router, orders.router, ai.router, content.router, media.router, admin.router):
    api_router.include_router(r)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
