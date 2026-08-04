from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import tenant_or_404
from app.core.db import get_session
from app.models import ContactMessage, NewsletterSubscriber, Tenant
from app.models.base import new_id, utcnow
from app.services import tenant_service as svc
from app.schemas.public import (
    ArticleOut,
    DestinationOut,
    ExhibitorOut,
    GalleryImageOut,
    PartnerOut,
    ProductOut,
    ProgramEventOut,
)
from app.schemas.write import ContactMessageIn, NewsletterIn

router = APIRouter(prefix="/tenants/{slug}", tags=["content"])


def _not_found(what: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{what} inexistent.")


# --- Exhibitors ---
@router.get("/exhibitors", response_model=list[ExhibitorOut])
def list_exhibitors(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [ExhibitorOut.from_model(x) for x in svc.exhibitors_for(session, tenant.id)]


@router.get("/exhibitors/{item_slug}", response_model=ExhibitorOut)
def get_exhibitor(
    item_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    for x in svc.exhibitors_for(session, tenant.id):
        if x.slug == item_slug:
            return ExhibitorOut.from_model(x)
    raise _not_found("Expozant")


# --- Products ---
@router.get("/products", response_model=list[ProductOut])
def list_products(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [ProductOut.from_model(x) for x in svc.products_for(session, tenant.id)]


@router.get("/products/{item_slug}", response_model=ProductOut)
def get_product(
    item_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    for x in svc.products_for(session, tenant.id):
        if x.slug == item_slug:
            return ProductOut.from_model(x)
    raise _not_found("Produs")


# --- Destinations ---
@router.get("/destinations", response_model=list[DestinationOut])
def list_destinations(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [DestinationOut.from_model(x) for x in svc.destinations_for(session, tenant.id)]


@router.get("/destinations/{item_slug}", response_model=DestinationOut)
def get_destination(
    item_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    for x in svc.destinations_for(session, tenant.id):
        if x.slug == item_slug:
            return DestinationOut.from_model(x)
    raise _not_found("Destinație")


# --- Program ---
@router.get("/program", response_model=list[ProgramEventOut])
def list_program(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [ProgramEventOut.from_model(x) for x in svc.program_for(session, tenant.id)]


# --- Partners ---
@router.get("/partners", response_model=list[PartnerOut])
def list_partners(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [PartnerOut.from_model(x) for x in svc.partners_for(session, tenant.id)]


# --- Gallery ---
@router.get("/gallery", response_model=list[GalleryImageOut])
def list_gallery(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [GalleryImageOut.from_model(x) for x in svc.gallery_for(session, tenant.id)]


# --- Articles ---
@router.get("/articles", response_model=list[ArticleOut])
def list_articles(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [ArticleOut.from_model(x) for x in svc.articles_for(session, tenant.id)]


@router.get("/articles/{item_slug}", response_model=ArticleOut)
def get_article(
    item_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    for x in svc.articles_for(session, tenant.id):
        if x.slug == item_slug:
            return ArticleOut.from_model(x)
    raise _not_found("Articol")


# --- Public actions (no auth) ---
@router.post("/contact-messages", status_code=201)
def submit_contact_message(
    payload: ContactMessageIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    msg = ContactMessage(
        id=new_id("cm"),
        tenant_id=tenant.id,
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
        date=utcnow().date(),
        read=False,
    )
    session.add(msg)
    session.commit()
    return {"ok": True, "id": msg.id}


@router.post("/newsletter/subscribe", status_code=201)
def subscribe_newsletter(
    payload: NewsletterIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    from sqlmodel import select

    existing = session.exec(
        select(NewsletterSubscriber)
        .where(NewsletterSubscriber.tenant_id == tenant.id)
        .where(NewsletterSubscriber.email == payload.email)
    ).first()
    if existing:
        return {"ok": True, "id": existing.id, "already": True}
    sub = NewsletterSubscriber(
        id=new_id("ns"),
        tenant_id=tenant.id,
        email=payload.email,
        source=payload.source,
        date=utcnow().date(),
    )
    session.add(sub)
    session.commit()
    return {"ok": True, "id": sub.id}
