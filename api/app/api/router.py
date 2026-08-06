from fastapi import APIRouter

from app.api.routes import (
    admin,
    auth,
    content,
    domains,
    marketing,
    media,
    platform,
    tenants,
)

api_router = APIRouter()


@api_router.get("/meta", tags=["meta"])
def meta() -> dict:
    return {"name": "Festival Hub API", "version": "1"}


api_router.include_router(auth.router)
api_router.include_router(domains.router)
api_router.include_router(platform.router)
api_router.include_router(tenants.router)
api_router.include_router(content.router)
api_router.include_router(media.router)
api_router.include_router(admin.router)
api_router.include_router(marketing.router)
