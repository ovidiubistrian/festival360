from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel
from sqlmodel import Session

from app.core.config import settings
from app.core.db import get_session
from app.models import Tenant
from app.services import tenant_service as svc
from app.schemas.public import (
    AccommodationOut,
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
        accommodations=[
            AccommodationOut.from_model(x)
            for x in svc.accommodations_for(session, tid)
        ],
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


# =========================================================================
# Analytics ingestion (public, cookieless) — POST /tenants/{slug}/track
# =========================================================================
class TrackIn(BaseModel):
    path: str
    referrer: str = ""


@router.post("/{slug}/track", status_code=204)
def track_pageview(
    slug: str,
    payload: TrackIn,
    request: Request,
    session: Session = Depends(get_session),
) -> Response:
    """Record one page view. Never 500s — analytics must never break a page."""
    if not settings.ANALYTICS_ENABLED:
        return Response(status_code=204)
    try:
        from app.analytics.geo import lookup
        from app.analytics.track import client_ip, referrer_host, visitor_hash
        from app.analytics.useragent import is_bot, parse_ua
        from app.models import PageView, Tenant
        from app.models.base import new_id, utcnow

        path = (payload.path or "").strip()[:400]
        if not path:
            return Response(status_code=204)

        ua = request.headers.get("user-agent", "")
        if is_bot(ua):
            return Response(status_code=204)

        tenant = session.get(Tenant, slug)
        if not tenant:  # don't leak which slugs exist
            return Response(status_code=204)

        ip = client_ip(request)
        country, country_name, city, region = lookup(ip)
        device, browser, os_name = parse_ua(ua)

        internal_hosts = [
            settings.PLATFORM_DOMAIN,
            tenant.custom_domain or "",
            f"{tenant.slug}.{settings.PLATFORM_DOMAIN}",
        ]
        rhost = referrer_host(payload.referrer, *internal_hosts)

        now = utcnow()
        view = PageView(
            id=new_id("pv"),
            tenant_id=tenant.id,
            path=path,
            referrer_host=rhost,
            country=country,
            country_name=country_name,
            city=city,
            region=region,
            device=device,
            browser=browser,
            os=os_name,
            visitor_hash=visitor_hash(ip, ua, tenant.slug),
            day=now.date(),
            created_at=now,
        )
        session.add(view)
        session.commit()
    except Exception:
        session.rollback()
    return Response(status_code=204)
