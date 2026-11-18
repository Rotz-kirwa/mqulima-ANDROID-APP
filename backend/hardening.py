"""Production hardening utilities: structured JSON logging, Redis/memory rate limiting, security headers & payload caps."""
import asyncio
import contextvars
import ipaddress
import logging
import re
import time
import uuid
from collections import defaultdict, deque
from typing import Deque, Dict, Optional, Tuple

from fastapi import Request
from fastapi.responses import JSONResponse
from pythonjsonlogger.json import JsonFormatter
from starlette.middleware.base import BaseHTTPMiddleware

from config import get_settings

try:
    import redis.asyncio as aioredis
    from redis.exceptions import RedisError
except ImportError:  # pragma: no cover - optional runtime fallback
    aioredis = None  # type: ignore[assignment]
    RedisError = Exception  # type: ignore[misc, assignment]

logger = logging.getLogger(__name__)
request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")
_REDACT_PATTERNS = re.compile(r"(Bearer\s+[A-Za-z0-9\-_.]+|sk_live_[A-Za-z0-9]+|pk_live_[A-Za-z0-9]+)", re.IGNORECASE)

_REDIS_SLIDING_WINDOW_LUA = """
local key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local cutoff_ms = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local window_ms = tonumber(ARGV[4])
local member = ARGV[5]

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff_ms)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry_after = 1
  if #oldest >= 2 then
    local oldest_ms = tonumber(oldest[2])
    retry_after = math.max(1, math.floor((window_ms - (now_ms - oldest_ms)) / 1000))
  end
  return {0, 0, retry_after}
end

redis.call('ZADD', key, now_ms, member)
redis.call('PEXPIRE', key, window_ms)
return {1, math.max(0, limit - (count + 1)), 0}
"""


class ContextRedactingFilter(logging.Filter):
    """Attaches request_id and scrubs accidental credentials from log messages."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get("-")
        if isinstance(record.msg, str):
            record.msg = _REDACT_PATTERNS.sub("[REDACTED]", record.msg)
        return True


def configure_structured_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    handler = logging.StreamHandler()
    formatter = JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(request_id)s %(message)s",
        rename_fields={"asctime": "timestamp", "levelname": "level", "name": "logger"},
    )
    handler.setFormatter(formatter)
    handler.addFilter(ContextRedactingFilter())
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)


class SlidingWindowLimiter:
    """Async sliding-window per-client rate limiter backed by Redis when REDIS_URL is configured."""

    def __init__(self) -> None:
        self._buckets: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        self._redis_clients: Dict[asyncio.AbstractEventLoop, Tuple[str, object]] = {}

    def _get_redis_client(self) -> Optional[object]:
        settings = get_settings()
        redis_url = (settings.REDIS_URL or "").strip()
        if not redis_url or aioredis is None:
            return None
        loop = asyncio.get_running_loop()
        cached = self._redis_clients.get(loop)
        if cached and cached[0] == redis_url:
            return cached[1]
        client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=0.5,
            socket_timeout=0.5,
        )
        self._redis_clients[loop] = (redis_url, client)
        return client

    async def _allow_memory(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int, int]:
        now = time.monotonic()
        cutoff = now - window_seconds
        async with self._lock:
            q = self._buckets[key]
            while q and q[0] <= cutoff:
                q.popleft()
            if len(q) >= limit:
                retry_after = max(1, int(window_seconds - (now - q[0])))
                return False, 0, retry_after
            q.append(now)
            remaining = max(0, limit - len(q))
            if len(self._buckets) > 10000:
                stale = [k for k, dq in self._buckets.items() if not dq or dq[-1] <= cutoff]
                for k in stale[:2000]:
                    del self._buckets[k]
            return True, remaining, 0

    async def allow(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int, int]:
        redis_client = self._get_redis_client()
        if redis_client is not None:
            now_ms = int(time.time() * 1000)
            window_ms = window_seconds * 1000
            cutoff_ms = now_ms - window_ms
            member = f"{now_ms}:{uuid.uuid4().hex[:8]}"
            try:
                res = await redis_client.eval(  # type: ignore[attr-defined]
                    _REDIS_SLIDING_WINDOW_LUA,
                    1,
                    f"mqulima:ratelimit:{key}",
                    now_ms,
                    cutoff_ms,
                    limit,
                    window_ms,
                    member,
                )
                allowed, remaining, retry_after = int(res[0]), int(res[1]), int(res[2])
                return bool(allowed), remaining, retry_after
            except RedisError as exc:
                logger.warning("Redis rate limiter unavailable, falling back to memory: %s", exc)
        return await self._allow_memory(key, limit, window_seconds)

    async def reset(self) -> None:
        async with self._lock:
            self._buckets.clear()
        redis_client = self._get_redis_client()
        if redis_client is not None:
            try:
                keys = [k async for k in redis_client.scan_iter(match="mqulima:ratelimit:*")]  # type: ignore[attr-defined]
                if keys:
                    await redis_client.delete(*keys)  # type: ignore[attr-defined]
            except RedisError as exc:
                logger.warning("Failed to clear Redis rate limit keys: %s", exc)


rate_limiter = SlidingWindowLimiter()


def _is_trusted_proxy(host: str) -> bool:
    if not host:
        return False
    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        return False
    return any(addr in net for net in get_settings().trusted_proxy_networks)


def _client_ip(request: Request) -> str:
    peer_host = request.client.host if request.client else ""
    if _is_trusted_proxy(peer_host):
        fwd = request.headers.get("x-forwarded-for", "").strip()
        if fwd:
            hops = [h.strip() for h in fwd.split(",") if h.strip()]
            # Walk right-to-left past any additional trusted reverse proxies
            for hop in reversed(hops):
                if not _is_trusted_proxy(hop):
                    return hop
            if hops:
                return hops[0]
    return peer_host or "unknown"


def _rate_bucket(request: Request) -> Tuple[str, int, int]:
    settings = get_settings()
    path = request.url.path.lower()
    if "/auth/" in path and request.method in ("POST", "PUT", "DELETE"):
        return "auth", settings.RATE_LIMIT_AUTH_PER_MIN, 60
    if "/ai/" in path:
        return "ai", settings.RATE_LIMIT_AI_PER_HOUR, 3600
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        return "write", settings.RATE_LIMIT_WRITE_PER_MIN, 60
    return "read", settings.RATE_LIMIT_DEFAULT_PER_MIN, 60


class SecurityAndLimitMiddleware(BaseHTTPMiddleware):
    """Enforces body-size limits, tiered rate limits, request-ID logging, and HTTP security headers."""

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        req_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        token = request_id_var.set(req_id)
        started = time.perf_counter()

        try:
            # 1. Payload size guard (reject huge payloads before parsing)
            content_len = request.headers.get("content-length")
            if content_len:
                try:
                    if int(content_len) > settings.MAX_REQUEST_BYTES:
                        return JSONResponse(
                            {"detail": f"Payload exceeds {settings.MAX_REQUEST_BYTES // (1024 * 1024)}MB limit."},
                            status_code=413,
                            headers={"X-Request-ID": req_id},
                        )
                except ValueError:
                    pass

            # 2. Tiered rate limiting (skip health probe)
            scope, limit, window = _rate_bucket(request)
            remaining = limit
            if request.url.path != "/health":
                bucket_key = f"{scope}:{_client_ip(request)}"
                allowed, remaining, retry_after = await rate_limiter.allow(bucket_key, limit, window)
                if not allowed:
                    return JSONResponse(
                        {"detail": "Too many requests. Please slow down and try again.", "retry_after": retry_after},
                        status_code=429,
                        headers={
                            "X-Request-ID": req_id,
                            "Retry-After": str(retry_after),
                            "X-RateLimit-Limit": str(limit),
                            "X-RateLimit-Remaining": "0",
                        },
                    )

            response = await call_next(request)
            elapsed_ms = round((time.perf_counter() - started) * 1000, 1)

            # 3. Hardened HTTP response headers
            response.headers["X-Request-ID"] = req_id
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "camera=(self), geolocation=(self), microphone=()"
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            if settings.APP_ENV.strip().lower() == "production":
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

            logging.getLogger("mqulima.access").info(
                "http_request",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": elapsed_ms,
                    "client_ip": _client_ip(request),
                },
            )
            return response
        finally:
            request_id_var.reset(token)
