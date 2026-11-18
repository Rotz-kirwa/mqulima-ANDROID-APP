# Production Runtime & Hardening Configuration

## 1. Backend ASGI Server (Gunicorn + UvicornWorker, no `--reload`)

Run the FastAPI API from `backend/` using Gunicorn with `uvicorn.workers.UvicornWorker`:

```bash
cd backend
./.venv/bin/gunicorn server:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 2 \
  --bind 0.0.0.0:8080 \
  --timeout 60 \
  --graceful-timeout 30 \
  --keep-alive 5
```

- Adjust `--workers` to `min(2 * CPU + 1, 4)` based on allocated container cores.
- Never pass `--reload` in production.

## 2. Environment Variables

| Variable | Default / Purpose |
| --- | --- |
| `REDIS_URL` | Optional Redis URI (e.g. `redis://127.0.0.1:6379/0`) for shared sliding-window rate-limit state across workers (falls back to memory if unset). |
| `TRUSTED_PROXIES` | Comma-separated proxy IPs/CIDRs allowed to supply `X-Forwarded-For` (`127.0.0.1,::1` default). Requests from untrusted peers ignore `X-Forwarded-For`. |
| `SENTRY_DSN` | Backend Sentry DSN (`FastApiIntegration`, `traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE`). |
| `EXPO_PUBLIC_SENTRY_DSN` | Frontend React Native / Expo Sentry DSN (also captured from `ErrorBoundary`). |
| `MEDIA_PUBLIC_BASE_URL` | Optional CDN / object-storage public base URL for 307 redirects on `/api/v1/media/{id}`; proxying uses an in-process LRU byte cache + ETag `304`. |
| `SYNC_CATALOG_ON_STARTUP` | Opt-in flag (`true`) to run `sync_products_328()` during startup; otherwise run `./.venv/bin/python seed.py sync` explicitly. |
