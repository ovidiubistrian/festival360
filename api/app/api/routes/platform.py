from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.api.deps import get_current_superuser
from app.core.db import get_session
from app.models import AdminUser, Tenant
from app.presets import build_tenant_fields, list_presets, PRESETS
from app.schemas.common import CamelModel

router = APIRouter(prefix="/platform", tags=["platform"])

# Demo tenants that must not be deleted (the content admin is wired to prispa).
PROTECTED_SLUGS = {"prispa"}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class TenantCreateIn(CamelModel):
    name: str
    slug: str
    event_type: str = "festival"


class TenantSummary(CamelModel):
    slug: str
    name: str
    event_type: str
    tagline: str
    theme_primary: str


@router.get("/presets", dependencies=[Depends(get_current_superuser)])
def get_presets() -> list[dict]:
    return list_presets()


@router.get(
    "/tenants",
    response_model=list[TenantSummary],
    dependencies=[Depends(get_current_superuser)],
)
def list_all_tenants(session: Session = Depends(get_session)):
    from sqlmodel import select

    rows = session.exec(select(Tenant).order_by(Tenant.name)).all()
    return [
        TenantSummary(
            slug=t.slug,
            name=t.name,
            event_type=t.event_type,
            tagline=t.tagline,
            theme_primary=t.theme_primary,
        )
        for t in rows
    ]


@router.post("/tenants", response_model=TenantSummary, status_code=201)
def create_tenant(
    payload: TenantCreateIn,
    session: Session = Depends(get_session),
    _: AdminUser = Depends(get_current_superuser),
):
    slug = payload.slug.strip().lower()
    if not SLUG_RE.match(slug):
        raise HTTPException(
            status_code=400,
            detail="Slug invalid: doar litere mici, cifre și cratime (ex. festivalul-meu).",
        )
    if payload.event_type not in PRESETS:
        raise HTTPException(status_code=400, detail="Tip de eveniment necunoscut.")
    if session.get(Tenant, slug):
        raise HTTPException(status_code=409, detail=f"Slug-ul „{slug}” este deja folosit.")

    fields = build_tenant_fields(payload.event_type, payload.name.strip(), slug)
    tenant = Tenant(**fields)
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return TenantSummary(
        slug=tenant.slug,
        name=tenant.name,
        event_type=tenant.event_type,
        tagline=tenant.tagline,
        theme_primary=tenant.theme_primary,
    )


@router.delete("/tenants/{slug}", status_code=204)
def delete_tenant(
    slug: str,
    session: Session = Depends(get_session),
    _: AdminUser = Depends(get_current_superuser),
):
    if slug in PROTECTED_SLUGS:
        raise HTTPException(status_code=403, detail="Acest site demo nu poate fi șters.")
    tenant = session.get(Tenant, slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Site inexistent.")
    from app.db.seed import _wipe_tenant

    _wipe_tenant(session, slug)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
