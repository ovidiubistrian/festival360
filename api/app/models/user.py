from __future__ import annotations

import datetime as dt

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class AdminUser(SQLModel, table=True):
    """Admin account for the dashboard. Used from the auth phase onward.

    A user may be scoped to a single tenant (tenant_id set) or be a platform
    superuser (tenant_id null + is_superuser true).
    """

    __tablename__ = "admin_user"

    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str = ""
    tenant_id: str | None = Field(default=None, foreign_key="tenant.id")
    is_superuser: bool = False
    is_active: bool = True
    created_at: dt.datetime = Field(default_factory=utcnow)
