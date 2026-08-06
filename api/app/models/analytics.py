from __future__ import annotations

import datetime as dt

from sqlmodel import Field, SQLModel

from app.models.base import utcnow

# Cookieless, IP-anonymised page-view records. The raw IP is NEVER stored — only
# a daily-rotating `visitor_hash` derived from it, so uniques are per-day by
# construction and no personal data is retained.


class PageView(SQLModel, table=True):
    __tablename__ = "page_view"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    path: str = ""
    referrer_host: str = ""  # bare host, e.g. "google.com"; "" = direct
    country: str = ""  # ISO-2, e.g. "RO"
    country_name: str = ""
    city: str = ""
    region: str = ""
    device: str = ""  # "desktop" | "mobile" | "tablet"
    browser: str = ""
    os: str = ""
    visitor_hash: str = Field(default="", index=True)  # 16 hex chars, daily
    day: dt.date = Field(index=True)  # date of the view, for cheap grouping
    created_at: dt.datetime = Field(default_factory=utcnow, index=True)
