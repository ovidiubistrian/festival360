from __future__ import annotations

import datetime as dt
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class PlanPackage(SQLModel, table=True):
    """Commercial catalog for a plan: price/labels/limits, edited from console.

    `code` matches a Plan value for standard packages. Prices are in MINOR UNITS.
    `tenant_id` NULL = standard public package; set = a custom offer for a tenant.
    """

    __tablename__ = "plan_package"

    id: str = Field(primary_key=True)
    code: str = Field(index=True)
    label: str
    tagline: str = ""
    price_monthly_bani: int = 0
    price_annual_bani: int | None = None
    currency: str = "RON"
    benefits: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    seats: int | None = None
    is_public: bool = True
    is_featured: bool = False
    tenant_id: str | None = Field(default=None, foreign_key="tenant.id", index=True)
    sort_order: int = 0
    active: bool = True
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class Subscription(SQLModel, table=True):
    """One row per tenant (1:1). Links a tenant to a plan + status."""

    __tablename__ = "subscription"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", unique=True, index=True)
    plan: str = "starter"
    status: str = "trialing"  # trialing|active|past_due|suspended|cancelled
    billing_cycle: str = "monthly"  # monthly|annual
    trial_ends_at: dt.datetime | None = None
    current_period_end: dt.datetime | None = None
    seats: int | None = None
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class FeatureFlag(SQLModel, table=True):
    """Per-tenant feature override (tenant_id set) or global (tenant_id NULL)."""

    __tablename__ = "feature_flag"

    id: str = Field(primary_key=True)
    key: str = Field(index=True)
    tenant_id: str | None = Field(default=None, foreign_key="tenant.id", index=True)
    enabled: bool = True
    created_at: dt.datetime = Field(default_factory=utcnow)


class PlatformSetting(SQLModel, table=True):
    """Platform-level settings (e.g. encrypted Stripe keys). Not in .env."""

    __tablename__ = "platform_setting"

    key: str = Field(primary_key=True)
    value_encrypted: str = ""
    updated_at: dt.datetime = Field(default_factory=utcnow)


class StaffAccount(SQLModel, table=True):
    """A non-owner user of a tenant. Identity stays in our JWT; this mirrors the
    role. `user_id` is nullable so audit refs survive login deletion."""

    __tablename__ = "staff_account"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    user_id: str | None = None
    first_name: str = ""
    last_name: str = ""
    email: str = Field(index=True)
    role: str = "owner"  # owner|admin|member (enforced at the app layer)
    is_active: bool = True
    created_by: str | None = None
    created_at: dt.datetime = Field(default_factory=utcnow)


class PaymentOrder(SQLModel, table=True):
    """A checkout attempt. Linked to Stripe via `order_ref` + session metadata,
    not a Stripe price id. Idempotent fulfilment via `fulfilled_at`."""

    __tablename__ = "payment_order"

    id: str = Field(primary_key=True)
    order_ref: str = Field(unique=True, index=True)
    tenant_id: str | None = Field(default=None, foreign_key="tenant.id", index=True)
    kind: str = "subscription"  # subscription|...
    amount_minor: int = 0
    currency: str = "RON"
    status: str = "pending"  # pending|paid|expired|failed
    provider: str = "stripe"
    provider_ref: str | None = None  # Stripe session id
    order_metadata: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    fulfilled_at: dt.datetime | None = None
    created_at: dt.datetime = Field(default_factory=utcnow)


class PlatformLead(SQLModel, table=True):
    """A signup / sales inquiry from the marketing site (platform-level)."""

    __tablename__ = "platform_lead"

    id: str = Field(primary_key=True)
    name: str = ""
    email: str = ""
    organization: str = ""
    event_type: str = ""
    plan: str = ""
    message: str = ""
    status: str = "new"  # new|contacted|converted|closed
    tenant_id: str | None = Field(default=None, foreign_key="tenant.id")
    created_at: dt.datetime = Field(default_factory=utcnow)
