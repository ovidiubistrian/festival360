from __future__ import annotations

import datetime as dt

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.base import utcnow


class FormDefinition(SQLModel, table=True):
    """A form the organiser builds from the admin (e.g. an exhibitor application).

    The field list is JSON on purpose: the organiser adds/removes/reorders
    fields from the builder, so a new question must never need a migration.
    Each item is `{id, type, label, placeholder, help, required, width,
    options[{label, value, price}]}` in camelCase — the frontend renders it
    as-is.
    """

    __tablename__ = "form_definition"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    slug: str = Field(index=True)
    title: str
    # Intro shown under the title on the public page.
    description: str = ""
    fields: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    submit_label: str = ""  # "" → UI default ("Trimite cererea")
    success_message: str = ""  # "" → UI default
    # Where to notify a new submission; empty → no email (always stored anyway).
    notify_email: str = ""
    # Print the tenant's legal/organisation block at the bottom of the form.
    show_organization: bool = True
    status: str = "draft"  # published | draft | archived
    sort_order: int = 0
    created_at: dt.datetime = Field(default_factory=utcnow)
    updated_at: dt.datetime = Field(default_factory=utcnow)


class FormSubmission(SQLModel, table=True):
    """One filled-in form.

    Answers are stored as an ordered snapshot (`{id, label, value}`) rather than
    a raw id→value map: a submission must stay readable years later, even after
    the organiser renames or deletes the fields it was filled against.
    """

    __tablename__ = "form_submission"

    id: str = Field(primary_key=True)
    tenant_id: str = Field(foreign_key="tenant.id", index=True)
    form_id: str = Field(foreign_key="form_definition.id", index=True)
    form_title: str = ""  # title at submit time
    answers: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    # Sum of the priced options picked (0 when the form has no prices).
    total: float = 0
    # Derived at submit time so the admin list can show something meaningful.
    summary: str = ""
    email: str = ""
    read: bool = False
    created_at: dt.datetime = Field(default_factory=utcnow)
