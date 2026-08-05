from __future__ import annotations

import datetime as dt

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow

# Note: enum-like fields (category, status, tier, span) are stored as plain
# strings; allowed values are validated at the Pydantic schema layer.


class Exhibitor(SQLModel, table=True):
    __tablename__ = "exhibitor"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    slug: str = Field(index=True)
    name: str
    category: str = ""
    town: str = ""
    county: str = ""
    region: str = ""
    short_description: str = ""
    description: str = ""
    image: str = ""
    gallery: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    certified: bool = False
    featured: bool = False
    product_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    contact_phone: str = ""
    contact_website: str = ""
    status: str = "published"
    sort_order: int = 0
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class Product(SQLModel, table=True):
    __tablename__ = "product"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    slug: str = Field(index=True)
    name: str
    producer: str = ""
    exhibitor_id: str | None = Field(default=None, foreign_key="exhibitor.id")
    region: str = ""
    category: str = ""
    short_description: str = ""
    story: str = ""
    image: str = ""
    gallery: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    price: str | None = None
    featured: bool = False
    # "all" | "winter" | "summer" — for seasonal verticals (resorts).
    season: str = "all"
    status: str = "published"
    sort_order: int = 0
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class Destination(SQLModel, table=True):
    __tablename__ = "destination"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    slug: str = Field(index=True)
    name: str
    region: str = ""
    county: str = ""
    short_description: str = ""
    description: str = ""
    cover_image: str = ""
    gallery: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    attractions: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    experiences: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    gastronomy: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    external_link: str | None = None
    featured: bool = False
    editorial: bool = False
    status: str = "published"
    sort_order: int = 0
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class ProgramEvent(SQLModel, table=True):
    __tablename__ = "program_event"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    day: int = 1
    date: dt.date | None = None
    start_time: str = ""
    end_time: str = ""
    title: str = ""
    description: str = ""
    stage: str = ""
    category: str = ""
    featured: bool = False
    sort_order: int = 0
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class Partner(SQLModel, table=True):
    __tablename__ = "partner"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    slug: str = Field(index=True)
    name: str
    tier: str = ""
    logo: str = ""
    description: str = ""
    website: str = ""
    featured_on_home: bool = False
    sort_order: int = 0
    status: str = "published"
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class GalleryImage(SQLModel, table=True):
    __tablename__ = "gallery_image"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    src: str = ""
    alt: str = ""
    category: str = ""
    span: str = "normal"
    sort_order: int = 0
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class Article(SQLModel, table=True):
    __tablename__ = "article"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    slug: str = Field(index=True)
    title: str
    excerpt: str = ""
    body: str = ""
    category: str = ""
    author: str = ""
    date: dt.date | None = None
    reading_minutes: int = 3
    cover_image: str = ""
    featured: bool = False
    status: str = "published"
    sort_order: int = 0
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class ContactMessage(SQLModel, table=True):
    __tablename__ = "contact_message"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    name: str = ""
    email: str = ""
    subject: str = ""
    message: str = ""
    date: dt.date | None = None
    read: bool = False
    created_at: dt.datetime = Field(default_factory=utcnow)


class NewsletterSubscriber(SQLModel, table=True):
    __tablename__ = "newsletter_subscriber"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    email: str = ""
    date: dt.date | None = None
    source: str = ""
    created_at: dt.datetime = Field(default_factory=utcnow)
