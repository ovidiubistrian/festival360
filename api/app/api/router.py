from fastapi import APIRouter

from app.api.routes import admin, auth, content, media, tenants

api_router = APIRouter()


@api_router.get("/meta", tags=["meta"])
def meta() -> dict:
    return {"name": "Festival Hub API", "version": "1"}


api_router.include_router(auth.router)
api_router.include_router(tenants.router)
api_router.include_router(content.router)
api_router.include_router(media.router)
api_router.include_router(admin.router)
