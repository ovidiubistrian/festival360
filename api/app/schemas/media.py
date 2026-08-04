from __future__ import annotations

from app.schemas.common import CamelModel
from app.models import MediaAsset


class MediaAssetOut(CamelModel):
    id: str
    url: str
    alt: str
    filename: str
    content_type: str
    size: int
    is_stock: bool

    @classmethod
    def from_model(cls, m: MediaAsset) -> "MediaAssetOut":
        return cls.model_validate(m)


class MediaAltIn(CamelModel):
    alt: str = ""
