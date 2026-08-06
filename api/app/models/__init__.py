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
    Accommodation,
    Restaurant,
)
from app.models.analytics import PageView
from app.models.marketing import TenantEmailSettings
from app.models.user import AdminUser
from app.models.media import MediaAsset
from app.models.billing import (
    PlanPackage,
    Subscription,
    FeatureFlag,
    PlatformSetting,
    StaffAccount,
    PaymentOrder,
    PlatformLead,
)

__all__ = [
    "Tenant",
    "MediaAsset",
    "PlanPackage",
    "Subscription",
    "FeatureFlag",
    "PlatformSetting",
    "StaffAccount",
    "PaymentOrder",
    "PlatformLead",
    "Exhibitor",
    "Product",
    "Destination",
    "ProgramEvent",
    "Partner",
    "GalleryImage",
    "Article",
    "ContactMessage",
    "NewsletterSubscriber",
    "Accommodation",
    "Restaurant",
    "PageView",
    "TenantEmailSettings",
    "AdminUser",
]
