from __future__ import annotations

import datetime as dt
from typing import Any

from app.schemas.common import CamelModel
from app.models import (
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    GalleryImage,
    NewsletterSubscriber,
    Partner,
    ProgramEvent,
    Product,
    Tenant,
)


def _iso(d: dt.date | None) -> str | None:
    return d.isoformat() if d else None


# --- Content items (shape matches web/lib/tenants/types.ts) -------------------


class ContactOut(CamelModel):
    phone: str | None = None
    website: str | None = None


class ExhibitorOut(CamelModel):
    id: str
    slug: str
    name: str
    category: str
    town: str
    county: str
    region: str
    short_description: str
    description: str
    image: str
    gallery: list[str]
    certified: bool
    featured: bool
    product_ids: list[str]
    status: str
    contact: ContactOut | None = None

    @classmethod
    def from_model(cls, m: Exhibitor) -> "ExhibitorOut":
        return cls(
            id=m.id,
            slug=m.slug,
            name=m.name,
            category=m.category,
            town=m.town,
            county=m.county,
            region=m.region,
            short_description=m.short_description,
            description=m.description,
            image=m.image,
            gallery=m.gallery,
            certified=m.certified,
            featured=m.featured,
            product_ids=m.product_ids,
            status=m.status,
            contact=ContactOut(
                phone=m.contact_phone or None, website=m.contact_website or None
            ),
        )


class ProductOut(CamelModel):
    id: str
    slug: str
    name: str
    producer: str
    exhibitor_id: str | None
    region: str
    category: str
    short_description: str
    story: str
    image: str
    gallery: list[str]
    price: str | None
    featured: bool
    status: str

    @classmethod
    def from_model(cls, m: Product) -> "ProductOut":
        return cls.model_validate(m)


class DestinationOut(CamelModel):
    id: str
    slug: str
    name: str
    region: str
    county: str
    short_description: str
    description: str
    cover_image: str
    gallery: list[str]
    attractions: list[str]
    experiences: list[str]
    gastronomy: list[str]
    external_link: str | None
    featured: bool
    editorial: bool
    status: str

    @classmethod
    def from_model(cls, m: Destination) -> "DestinationOut":
        return cls.model_validate(m)


class ProgramEventOut(CamelModel):
    id: str
    day: int
    date: str | None
    start_time: str
    end_time: str
    title: str
    description: str
    stage: str
    category: str
    featured: bool

    @classmethod
    def from_model(cls, m: ProgramEvent) -> "ProgramEventOut":
        return cls(
            id=m.id,
            day=m.day,
            date=_iso(m.date),
            start_time=m.start_time,
            end_time=m.end_time,
            title=m.title,
            description=m.description,
            stage=m.stage,
            category=m.category,
            featured=m.featured,
        )


class PartnerOut(CamelModel):
    id: str
    slug: str
    name: str
    tier: str
    logo: str
    description: str
    website: str
    featured_on_home: bool
    order: int
    status: str

    @classmethod
    def from_model(cls, m: Partner) -> "PartnerOut":
        return cls(
            id=m.id,
            slug=m.slug,
            name=m.name,
            tier=m.tier,
            logo=m.logo,
            description=m.description,
            website=m.website,
            featured_on_home=m.featured_on_home,
            order=m.sort_order,
            status=m.status,
        )


class GalleryImageOut(CamelModel):
    id: str
    src: str
    alt: str
    category: str
    span: str

    @classmethod
    def from_model(cls, m: GalleryImage) -> "GalleryImageOut":
        return cls.model_validate(m)


class ArticleOut(CamelModel):
    id: str
    slug: str
    title: str
    excerpt: str
    body: str
    category: str
    author: str
    date: str | None
    reading_minutes: int
    cover_image: str
    featured: bool
    status: str

    @classmethod
    def from_model(cls, m: Article) -> "ArticleOut":
        return cls(
            id=m.id,
            slug=m.slug,
            title=m.title,
            excerpt=m.excerpt,
            body=m.body,
            category=m.category,
            author=m.author,
            date=_iso(m.date),
            reading_minutes=m.reading_minutes,
            cover_image=m.cover_image,
            featured=m.featured,
            status=m.status,
        )


class ContactMessageOut(CamelModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    date: str | None
    read: bool

    @classmethod
    def from_model(cls, m: ContactMessage) -> "ContactMessageOut":
        return cls(
            id=m.id,
            name=m.name,
            email=m.email,
            subject=m.subject,
            message=m.message,
            date=_iso(m.date),
            read=m.read,
        )


class NewsletterSubscriberOut(CamelModel):
    id: str
    email: str
    date: str | None
    source: str

    @classmethod
    def from_model(cls, m: NewsletterSubscriber) -> "NewsletterSubscriberOut":
        return cls(id=m.id, email=m.email, date=_iso(m.date), source=m.source)


# --- Tenant config (nested, mirrors TenantConfig) ----------------------------


class FestivalInfoOut(CamelModel):
    name: str
    slug: str
    tagline: str
    short_description: str
    long_description: str
    start_date: str | None
    end_date: str | None
    location_name: str
    city: str
    county: str
    hero_image: str
    hero_badge: str
    logo_text: str


class ThemeOut(CamelModel):
    primary: str
    secondary: str
    terracotta: str
    gold: str
    charcoal: str
    background: str


class SocialOut(CamelModel):
    facebook: str | None = None
    instagram: str | None = None
    youtube: str | None = None
    website: str | None = None


class ContactInfoOut(CamelModel):
    email: str
    phone: str
    address: str
    city: str
    county: str
    map_embed_query: str


class TenantConfigOut(CamelModel):
    info: FestivalInfoOut
    theme: ThemeOut
    navigation: list[dict[str, Any]]
    social: SocialOut
    contact: ContactInfoOut
    sections: list[dict[str, Any]]
    stats: list[dict[str, Any]]
    experiences: list[dict[str, Any]]

    @classmethod
    def from_model(cls, t: Tenant) -> "TenantConfigOut":
        return cls(
            info=FestivalInfoOut(
                name=t.name,
                slug=t.slug,
                tagline=t.tagline,
                short_description=t.short_description,
                long_description=t.long_description,
                start_date=_iso(t.start_date),
                end_date=_iso(t.end_date),
                location_name=t.location_name,
                city=t.city,
                county=t.county,
                hero_image=t.hero_image,
                hero_badge=t.hero_badge,
                logo_text=t.logo_text,
            ),
            theme=ThemeOut(
                primary=t.theme_primary,
                secondary=t.theme_secondary,
                terracotta=t.theme_terracotta,
                gold=t.theme_gold,
                charcoal=t.theme_charcoal,
                background=t.theme_background,
            ),
            navigation=t.navigation,
            social=SocialOut(
                facebook=t.social_facebook or None,
                instagram=t.social_instagram or None,
                youtube=t.social_youtube or None,
                website=t.social_website or None,
            ),
            contact=ContactInfoOut(
                email=t.contact_email,
                phone=t.contact_phone,
                address=t.contact_address,
                city=t.contact_city,
                county=t.contact_county,
                map_embed_query=t.contact_map_query,
            ),
            sections=t.sections,
            stats=t.stats,
            experiences=t.experiences,
        )


class TenantSummaryOut(CamelModel):
    slug: str
    name: str
    tagline: str
    hero_image: str


class TenantContentOut(CamelModel):
    exhibitors: list[ExhibitorOut]
    products: list[ProductOut]
    destinations: list[DestinationOut]
    program: list[ProgramEventOut]
    partners: list[PartnerOut]
    gallery: list[GalleryImageOut]
    articles: list[ArticleOut]
    contact_messages: list[ContactMessageOut]
    newsletter: list[NewsletterSubscriberOut]


class TenantBundleOut(CamelModel):
    """The full tenant (config + content) — mirrors the frontend `Tenant` type,
    so the frontend `getTenant()` becomes a single fetch to this endpoint."""

    slug: str
    config: TenantConfigOut
    content: TenantContentOut
