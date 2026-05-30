import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.database import Base, engine
from app import models  # noqa: F401 ensures models are registered before create_all

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# CORS_ORIGINS can include "*" for permissive setups (Vercel deployments often
# proxy /api/* through Next.js rewrites, so cross-origin is rare in practice).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Best-effort schema bootstrap.

    On Vercel cold starts this runs each time a new lambda instance boots. It's
    idempotent (create_all only creates missing tables), and we swallow errors
    so a misconfigured DB doesn't keep the rest of the app from booting — the
    error surfaces in the first request instead, which is easier to debug.
    """
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:  # pragma: no cover - boot diagnostics only
        logger.warning("Skipping create_all on startup: %s", exc)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/api/v1/health", tags=["health"])
def api_health() -> dict:
    return {"status": "ok"}


app.include_router(api_router)
