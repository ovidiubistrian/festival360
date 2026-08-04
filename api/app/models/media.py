from __future__ import annotations

import datetime as dt

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class MediaAsset(SQLModel, table=True):
    """An image in the media library.

    `url` is what content references. For uploaded files it is a relative path
    like `/media/<file>` (proxied by the frontend); for stock/demo images it can
    be an absolute external URL.
    """

    __tablename__ = "media_asset"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    url: str
    alt: str = ""
    filename: str = ""
    content_type: str = ""
    size: int = 0
    is_stock: bool = False
    created_at: dt.datetime = Field(default_factory=utcnow)
