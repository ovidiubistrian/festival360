"""SQLModel table models for Festival Hub.

Importing this package registers every table on SQLModel.metadata, which
Alembic autogenerate and create_all rely on.
"""

from app.models.tenant import Tenant
from app.models.content import (
    Exhibitor,
    Product,
    Destination,
    ProgramEvent,
    Partner,
    GalleryImage,
    Article,
    ContactMessage,
    NewsletterSubscriber,
)
from app.models.user import AdminUser
from app.models.media import MediaAsset

__all__ = [
    "Tenant",
    "MediaAsset",
    "Exhibitor",
    "Product",
    "Destination",
    "ProgramEvent",
    "Partner",
    "GalleryImage",
    "Article",
    "ContactMessage",
    "NewsletterSubscriber",
    "AdminUser",
]
