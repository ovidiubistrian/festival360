from __future__ import annotations

import datetime as dt
from typing import Any

from app.schemas.common import CamelModel


def _date(v: str | None) -> dt.date | None:
    return dt.date.fromisoformat(v) if v else None


class ContactIn(CamelModel):
    phone: str | None = None
    website: str | None = None


class ExhibitorIn(CamelModel):
    id: str | None = None
    slug: str
    name: str
    category: str = ""
    town: str = ""
    county: str = ""
    region: str = ""
    short_description: str = ""
    description: str = ""
    image: str = ""
    gallery: list[str] = []
    certified: bool = False
    featured: bool = False
    product_ids: list[str] = []
    status: str = "published"
    contact: ContactIn | None = None

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        return {
            "tenant_id": tenant_id,
            "slug": self.slug,
            "name": self.name,
            "category": self.category,
            "town": self.town,
            "county": self.county,
            "region": self.region,
            "short_description": self.short_description,
            "description": self.description,
            "image": self.image,
            "gallery": self.gallery,
            "certified": self.certified,
            "featured": self.featured,
            "product_ids": self.product_ids,
            "status": self.status,
            "contact_phone": (self.contact.phone if self.contact else "") or "",
            "contact_website": (self.contact.website if self.contact else "") or "",
        }


class AccommodationIn(CamelModel):
    id: str | None = None
    slug: str
    name: str
    type: str = ""
    short_description: str = ""
    description: str = ""
    image: str = ""
    gallery: list[str] = []
    price_from: str = ""
    capacity: int = 0
    rooms: int = 0
    amenities: list[str] = []
    address: str = ""
    contact_phone: str = ""
    contact_website: str = ""
    booking_url: str = ""
    featured: bool = False
    status: str = "published"

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        d = self.model_dump(exclude={"id"})
        d["tenant_id"] = tenant_id
        return d


class ProductIn(CamelModel):
    id: str | None = None
    slug: str
    name: str
    producer: str = ""
    exhibitor_id: str | None = None
    region: str = ""
    category: str = ""
    short_description: str = ""
    story: str = ""
    image: str = ""
    gallery: list[str] = []
    price: str | None = None
    featured: bool = False
    season: str = "all"
    status: str = "published"

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        d = self.model_dump(exclude={"id"})
        d["tenant_id"] = tenant_id
        return d


class DestinationIn(CamelModel):
    id: str | None = None
    slug: str
    name: str
    region: str = ""
    county: str = ""
    short_description: str = ""
    description: str = ""
    cover_image: str = ""
    gallery: list[str] = []
    attractions: list[str] = []
    experiences: list[str] = []
    gastronomy: list[str] = []
    external_link: str | None = None
    featured: bool = False
    editorial: bool = False
    status: str = "published"

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        d = self.model_dump(exclude={"id"})
        d["tenant_id"] = tenant_id
        return d


class ProgramEventIn(CamelModel):
    id: str | None = None
    day: int = 1
    date: str | None = None
    start_time: str = ""
    end_time: str = ""
    title: str = ""
    description: str = ""
    stage: str = ""
    category: str = ""
    featured: bool = False

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        d = self.model_dump(exclude={"id"})
        d["date"] = _date(self.date)
        d["tenant_id"] = tenant_id
        return d


class PartnerIn(CamelModel):
    id: str | None = None
    slug: str
    name: str
    tier: str = ""
    logo: str = ""
    description: str = ""
    website: str = ""
    featured_on_home: bool = False
    order: int = 0
    status: str = "published"

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        return {
            "tenant_id": tenant_id,
            "slug": self.slug,
            "name": self.name,
            "tier": self.tier,
            "logo": self.logo,
            "description": self.description,
            "website": self.website,
            "featured_on_home": self.featured_on_home,
            "sort_order": self.order,
            "status": self.status,
        }


class GalleryImageIn(CamelModel):
    id: str | None = None
    src: str = ""
    alt: str = ""
    category: str = ""
    span: str = "normal"

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        d = self.model_dump(exclude={"id"})
        d["tenant_id"] = tenant_id
        return d


class ArticleIn(CamelModel):
    id: str | None = None
    slug: str
    title: str
    excerpt: str = ""
    body: str = ""
    category: str = ""
    author: str = ""
    date: str | None = None
    reading_minutes: int = 3
    cover_image: str = ""
    featured: bool = False
    status: str = "published"

    def to_kwargs(self, tenant_id: str) -> dict[str, Any]:
        d = self.model_dump(exclude={"id"})
        d["date"] = _date(self.date)
        d["tenant_id"] = tenant_id
        return d


class MoveIn(CamelModel):
    direction: int  # -1 (up) or 1 (down)


class SectionsIn(CamelModel):
    sections: list[dict[str, Any]]


class SettingsIn(CamelModel):
    name: str | None = None
    tagline: str | None = None
    short_description: str | None = None
    long_description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    location_name: str | None = None
    city: str | None = None
    county: str | None = None
    email: str | None = None
    phone: str | None = None
    facebook: str | None = None
    instagram: str | None = None
    youtube: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    gold_color: str | None = None
    hero_image: str | None = None
    hero_badge: str | None = None
    logo_text: str | None = None
    # Homepage zone content (About "cifre" + Experiences grid), edited as whole
    # arrays from the per-section editors.
    stats: list[dict[str, Any]] | None = None
    experiences: list[dict[str, Any]] | None = None

    def to_tenant_patch(self) -> dict[str, Any]:
        m = {
            "name": "name",
            "tagline": "tagline",
            "short_description": "short_description",
            "long_description": "long_description",
            "location_name": "location_name",
            "city": "city",
            "county": "county",
            "email": "contact_email",
            "phone": "contact_phone",
            "facebook": "social_facebook",
            "instagram": "social_instagram",
            "youtube": "social_youtube",
            "primary_color": "theme_primary",
            "secondary_color": "theme_secondary",
            "gold_color": "theme_gold",
            "hero_image": "hero_image",
            "hero_badge": "hero_badge",
            "logo_text": "logo_text",
            "stats": "stats",
            "experiences": "experiences",
        }
        patch: dict[str, Any] = {}
        for field, col in m.items():
            val = getattr(self, field)
            if val is not None:
                patch[col] = val
        if self.start_date is not None:
            patch["start_date"] = _date(self.start_date)
        if self.end_date is not None:
            patch["end_date"] = _date(self.end_date)
        return patch


class ContactMessageIn(CamelModel):
    name: str
    email: str
    subject: str = ""
    message: str


class MessageReadIn(CamelModel):
    read: bool = True


class NewsletterIn(CamelModel):
    email: str
    source: str = "Website"
