from __future__ import annotations

import datetime as dt
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class Tenant(SQLModel, table=True):
    """A festival (tenant). Public routes resolve everything from its slug."""

    __tablename__ = "tenant"

    id: str = Field(primary_key=True)
    slug: str = Field(unique=True, index=True)

    # --- Vertical / preset ---
    # "festival" | "resort" | ... — drives default modules & terminology.
    event_type: str = "festival"
    # Per-tenant display labels overriding the festival defaults (terminology
    # system). Optional keys; the frontend falls back to festival copy.
    labels: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    # --- Custom domain (Caddy on-demand TLS + DNS TXT ownership verify) ---
    custom_domain: str | None = Field(default=None, unique=True, index=True)
    custom_domain_active: bool = False  # true only after DNS TXT verification
    domain_verify_token: str = ""
    dns_verified_at: dt.datetime | None = None

    # --- Festival info ---
    name: str
    tagline: str = ""
    short_description: str = ""
    long_description: str = ""
    start_date: dt.date | None = None
    end_date: dt.date | None = None
    location_name: str = ""
    city: str = ""
    county: str = ""
    hero_image: str = ""
    hero_badge: str = ""
    logo_text: str = ""
    logo_image: str = ""  # optional logo image; shown instead of logo_text
    # "Despre" section images (main collage + small inset); "" falls back to the
    # frontend defaults.
    about_image: str = ""
    about_image_2: str = ""

    # --- Theme (brand palette) ---
    theme_primary: str = "#183C32"
    theme_secondary: str = "#F5EFE3"
    theme_terracotta: str = "#B85C3B"
    theme_gold: str = "#C99A45"
    theme_charcoal: str = "#202522"
    theme_background: str = "#FCFAF6"

    # --- Social ---
    social_facebook: str = ""
    social_instagram: str = ""
    social_youtube: str = ""
    social_website: str = ""

    # --- Contact ---
    contact_email: str = ""
    contact_phone: str = ""
    contact_address: str = ""
    contact_city: str = ""
    contact_county: str = ""
    contact_map_query: str = ""

    # --- Structured config stored as JSON (edited as whole arrays by admin) ---
    navigation: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    sections: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    stats: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    experiences: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    # Resort-only homepage widgets (editable JSON blobs); empty → frontend default.
    conditions: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    trails: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    # SEO controls (admin-editable): {title, description, keywords, ogImage,
    # googleSiteVerification, noindex}. Empty keys fall back to sensible defaults.
    seo: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    # Legal/organiser identity (asociația din spatele evenimentului): {name,
    # cif, regCom, address, city, county, iban, bank, email, phone, note}.
    # Set once in Setări, printed as the footer of every form the tenant builds.
    organization: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)
