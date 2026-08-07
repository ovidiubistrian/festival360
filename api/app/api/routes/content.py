from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import tenant_or_404
from app.core.db import get_session
from app.models import (
    ContactMessage,
    FormDefinition,
    FormSubmission,
    NewsletterSubscriber,
    Tenant,
)
from app.models.base import new_id, utcnow
from app.services import forms_service
from app.services import tenant_service as svc
from app.schemas.public import (
    AccommodationOut,
    ArticleOut,
    DestinationOut,
    EventOut,
    ExhibitorOut,
    FormOut,
    GalleryImageOut,
    PartnerOut,
    ProductOut,
    ProgramEventOut,
    RestaurantOut,
)
from app.schemas.write import ContactMessageIn, FormSubmissionIn, NewsletterIn

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


# --- Accommodations (cazări) ---
@router.get("/accommodations", response_model=list[AccommodationOut])
def list_accommodations(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [
        AccommodationOut.from_model(x)
        for x in svc.accommodations_for(session, tenant.id)
    ]


@router.get("/accommodations/{item_slug}", response_model=AccommodationOut)
def get_accommodation(
    item_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    for x in svc.accommodations_for(session, tenant.id):
        if x.slug == item_slug:
            return AccommodationOut.from_model(x)
    raise _not_found("Cazare")


# --- Restaurants (restaurante) ---
@router.get("/restaurants", response_model=list[RestaurantOut])
def list_restaurants(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [
        RestaurantOut.from_model(x) for x in svc.restaurants_for(session, tenant.id)
    ]


@router.get("/restaurants/{item_slug}", response_model=RestaurantOut)
def get_restaurant(
    item_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    for x in svc.restaurants_for(session, tenant.id):
        if x.slug == item_slug:
            return RestaurantOut.from_model(x)
    raise _not_found("Restaurant")


# --- Events (evenimente) ---
@router.get("/events", response_model=list[EventOut])
def list_events(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [EventOut.from_model(x) for x in svc.events_for(session, tenant.id)]


@router.get("/events/{item_slug}", response_model=EventOut)
def get_event(
    item_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    for x in svc.events_for(session, tenant.id):
        if x.slug == item_slug:
            return EventOut.from_model(x)
    raise _not_found("Eveniment")


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


# --- Forms (public: published only) ---
@router.get("/forms", response_model=list[FormOut])
def list_forms(
    tenant: Tenant = Depends(tenant_or_404), session: Session = Depends(get_session)
):
    return [
        FormOut.from_model(f) for f in forms_service.published_forms_for(session, tenant.id)
    ]


@router.get("/forms/{form_slug}", response_model=FormOut)
def get_form(
    form_slug: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    form = forms_service.form_by_slug(session, tenant.id, form_slug)
    # Un formular nepublicat nu există pentru vizitator — linkul lui e „mort”
    # până când organizatorul îl publică.
    if not form or form.status != "published":
        raise _not_found("Formular")
    return FormOut.from_model(form)


@router.post("/forms/{form_slug}/submissions", status_code=201)
def submit_form(
    form_slug: str,
    payload: FormSubmissionIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    form = forms_service.form_by_slug(session, tenant.id, form_slug)
    if not form or form.status != "published":
        raise _not_found("Formular")

    try:
        answers, total, summary, email = forms_service.build_answers(
            form, payload.values
        )
    except forms_service.ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    sub = FormSubmission(
        id=new_id("fs"),
        tenant_id=tenant.id,
        form_id=form.id,
        form_title=form.title,
        answers=answers,
        total=total,
        summary=summary,
        email=email,
    )
    session.add(sub)
    session.commit()

    _notify_submission(session, tenant, form, sub)
    return {"ok": True, "id": sub.id}


def _notify_submission(
    session: Session,
    tenant: Tenant,
    form: FormDefinition,
    sub: FormSubmission,
) -> None:
    """Anunță organizatorul pe email, dacă are SMTP configurat și o adresă.

    Cererea e deja salvată — o eroare de trimitere nu are voie să întoarcă
    eroare vizitatorului, deci o înghițim (logat de SMTP-ul de sub).
    """
    to = (form.notify_email or "").strip()
    if not to:
        return
    from app.marketing import email as mail
    from app.models import TenantEmailSettings

    cfg = session.get(TenantEmailSettings, tenant.id)
    if not mail.is_configured(cfg):
        return
    body = forms_service.notification_body(form, sub)
    try:
        mail.send_one(
            cfg,  # type: ignore[arg-type]
            to,
            f"[{tenant.name}] Cerere nouă: {form.title}",
            mail.html_from_plaintext(body),
            body,
        )
    except Exception as exc:  # noqa: BLE001 — notificarea e best-effort
        print(f"[forms] notificare eșuată pentru {form.slug}: {exc}")


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
        name=(payload.name or "").strip(),
        source=payload.source,
        date=utcnow().date(),
    )
    session.add(sub)
    session.commit()
    return {"ok": True, "id": sub.id}
