from __future__ import annotations

import datetime as dt

from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class TenantEmailSettings(SQLModel, table=True):
    """Per-tenant SMTP configuration for sending marketing emails.

    The SMTP password is stored Fernet-encrypted (never in plain text and never
    returned by the API).
    """

    __tablename__ = "tenant_email_settings"

    tenant_id: str = Field(primary_key=True, foreign_key="tenant.id")
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password_encrypted: str = ""
    from_name: str = ""
    from_email: str = ""
    use_tls: bool = True  # STARTTLS on port 587; set False + port 465 for SSL
    enabled: bool = False
    updated_at: dt.datetime = Field(default_factory=utcnow)
