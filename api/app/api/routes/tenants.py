from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.db import get_session
from app.models import Tenant
from app.services import tenant_service as svc
from app.schemas.public import (
    ArticleOut,
    ContactMessageOut,
    DestinationOut,
    ExhibitorOut,
    GalleryImageOut,
    NewsletterSubscriberOut,
    PartnerOut,
    ProductOut,
    ProgramEventOut,
    TenantBundleOut,
    TenantConfigOut,
    TenantContentOut,
    TenantSummaryOut,
)

router = APIRouter(prefix="/tenants", tags=["tenants"])


def build_bundle(session: Session, tenant: Tenant) -> TenantBundleOut:
    tid = tenant.id
    content = TenantContentOut(
        exhibitors=[ExhibitorOut.from_model(x) for x in svc.exhibitors_for(session, tid)],
        products=[ProductOut.from_model(x) for x in svc.products_for(session, tid)],
        destinations=[
            DestinationOut.from_model(x) for x in svc.destinations_for(session, tid)
        ],
        program=[ProgramEventOut.from_model(x) for x in svc.program_for(session, tid)],
        partners=[PartnerOut.from_model(x) for x in svc.partners_for(session, tid)],
        gallery=[GalleryImageOut.from_model(x) for x in svc.gallery_for(session, tid)],
        articles=[ArticleOut.from_model(x) for x in svc.articles_for(session, tid)],
        contact_messages=[
            ContactMessageOut.from_model(x) for x in svc.messages_for(session, tid)
        ],
        newsletter=[
            NewsletterSubscriberOut.from_model(x)
            for x in svc.newsletter_for(session, tid)
        ],
    )
    return TenantBundleOut(
        slug=tenant.slug,
        config=TenantConfigOut.from_model(tenant),
        content=content,
    )


@router.get("", response_model=list[TenantSummaryOut])
def list_tenants(session: Session = Depends(get_session)) -> list[TenantSummaryOut]:
    return [
        TenantSummaryOut(
            slug=t.slug, name=t.name, tagline=t.tagline, hero_image=t.hero_image
        )
        for t in svc.list_tenants(session)
    ]


@router.get("/{slug}", response_model=TenantBundleOut)
def get_tenant_bundle(
    slug: str, session: Session = Depends(get_session)
) -> TenantBundleOut:
    from fastapi import HTTPException, status

    tenant = svc.get_tenant(session, slug)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Festivalul '{slug}' nu a fost găsit.",
        )
    return build_bundle(session, tenant)
