from fastapi import APIRouter

from app.api.v1 import (
    clients,
    campaigns,
    checklists,
    incidents,
    tasks,
    changelog,
    dashboard,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(clients.router)
api_router.include_router(campaigns.router)
api_router.include_router(checklists.router)
api_router.include_router(incidents.router)
api_router.include_router(tasks.router)
api_router.include_router(changelog.router)
api_router.include_router(dashboard.router)
