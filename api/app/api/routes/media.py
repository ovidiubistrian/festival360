from __future__ import annotations

import re
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlmodel import Session, select

from app.api.deps import require_tenant_admin, tenant_or_404
from app.core.config import settings
from app.core.db import get_session
from app.models import MediaAsset, Tenant
from app.models.base import new_id
from app.schemas.media import MediaAssetOut

router = APIRouter(
    prefix="/tenants/{slug}/admin/media",
    tags=["media"],
    dependencies=[Depends(require_tenant_admin)],
)

ALLOWED = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
}


def _media_dir() -> Path:
    d = Path(settings.MEDIA_DIR)
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.get("", response_model=list[MediaAssetOut])
def list_media(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    rows = session.exec(
        select(MediaAsset)
        .where(MediaAsset.tenant_id == tenant.id)
        .order_by(MediaAsset.created_at.desc())  # type: ignore[union-attr]
    ).all()
    return [MediaAssetOut.from_model(m) for m in rows]


@router.post("", response_model=MediaAssetOut, status_code=201)
async def upload_media(
    file: UploadFile = File(...),
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    ext = ALLOWED.get(file.content_type or "")
    if not ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tip de fișier neacceptat (doar imagini: jpg, png, webp, gif, avif).",
        )
    data = await file.read()
    if len(data) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Fișierul depășește {settings.MAX_UPLOAD_MB} MB.",
        )

    asset_id = new_id("md")
    filename = f"{asset_id}{ext}"
    (_media_dir() / filename).write_bytes(data)

    base = (file.filename or "imagine").rsplit(".", 1)[0]
    alt = re.sub(r"[-_]+", " ", base).strip()[:120]

    asset = MediaAsset(
        id=asset_id,
        tenant_id=tenant.id,
        url=f"{settings.MEDIA_URL_PREFIX}/{filename}",
        alt=alt,
        filename=file.filename or filename,
        content_type=file.content_type or "",
        size=len(data),
        is_stock=False,
    )
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return MediaAssetOut.from_model(asset)


@router.delete("/{item_id}", status_code=204)
def delete_media(
    item_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    asset = session.get(MediaAsset, item_id)
    if not asset or asset.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Imagine inexistentă.")
    # Remove the file for uploaded (non-stock) assets.
    if not asset.is_stock and asset.url.startswith(settings.MEDIA_URL_PREFIX):
        fname = asset.url.rsplit("/", 1)[-1]
        fpath = _media_dir() / fname
        if fpath.exists():
            fpath.unlink()
    session.delete(asset)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
