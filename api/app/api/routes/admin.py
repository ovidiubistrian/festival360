from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session

from app.api.deps import get_current_user, require_tenant_admin, tenant_or_404
from app.core.config import settings
from app.core.db import get_session
from app.models import (
    Accommodation,
    AdminUser,
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    FormDefinition,
    FormSubmission,
    GalleryImage,
    NewsletterSubscriber,
    Partner,
    ProgramEvent,
    Product,
    Restaurant,
    TenantEvent,
    Tenant,
)
from app.models.base import new_id, utcnow
from app.services import crud, forms_service
from app.schemas.public import (
    AccommodationOut,
    ArticleOut,
    DestinationOut,
    EventOut,
    ExhibitorOut,
    FormAdminOut,
    FormSubmissionOut,
    GalleryImageOut,
    PartnerOut,
    ProductOut,
    ProgramEventOut,
    RestaurantOut,
    TenantConfigOut,
)
from app.schemas.write import (
    AccommodationIn,
    ArticleIn,
    DestinationIn,
    EventIn,
    ExhibitorIn,
    FormIn,
    GalleryImageIn,
    MessageReadIn,
    MoveIn,
    NavigationIn,
    NewsletterIn,
    PartnerIn,
    ProductIn,
    ProgramEventIn,
    RestaurantIn,
    SectionsIn,
    SettingsIn,
    SubmissionReadIn,
)

# Every route here requires a valid admin token.
router = APIRouter(
    prefix="/tenants/{slug}/admin",
    tags=["admin"],
    dependencies=[Depends(require_tenant_admin)],
)


def _notfound(what: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{what} inexistent.")


# =========================================================================
# Exhibitors
# =========================================================================
@router.post("/exhibitors", response_model=ExhibitorOut, status_code=201)
def create_exhibitor(
    payload: ExhibitorIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.create(session, Exhibitor, payload.to_kwargs(tenant.id), "ex")
    return ExhibitorOut.from_model(obj)


@router.put("/exhibitors/{item_id}", response_model=ExhibitorOut)
def update_exhibitor(
    item_id: str,
    payload: ExhibitorIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, Exhibitor, item_id, tenant.id)
    if not obj:
        raise _notfound("Expozant")
    return ExhibitorOut.from_model(crud.update(session, obj, payload.to_kwargs(tenant.id)))


# =========================================================================
# Forms (formulare construite de organizator) + cererile primite
# =========================================================================
def _form_or_404(session: Session, item_id: str, tenant_id: str) -> FormDefinition:
    obj = crud.get_owned(session, FormDefinition, item_id, tenant_id)
    if not obj:
        raise _notfound("Formular")
    return obj


def _check_slug_free(
    session: Session, tenant_id: str, slug: str, exclude_id: str | None = None
) -> None:
    """Slugul e linkul public — două formulare cu același slug s-ar acoperi."""
    existing = forms_service.form_by_slug(session, tenant_id, slug)
    if existing and existing.id != exclude_id:
        raise HTTPException(
            status_code=409,
            detail=f"Există deja un formular cu adresa „{slug}”.",
        )


@router.get("/forms", response_model=list[FormAdminOut])
def list_forms(
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    counts = forms_service.submission_counts(session, tenant.id)
    return [
        FormAdminOut.from_model(f, counts.get(f.id, (0, 0)))
        for f in forms_service.forms_for(session, tenant.id)
    ]


@router.post("/forms", response_model=FormAdminOut, status_code=201)
def create_form(
    payload: FormIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    _check_slug_free(session, tenant.id, payload.slug)
    obj = crud.create(session, FormDefinition, payload.to_kwargs(tenant.id), "fo")
    return FormAdminOut.from_model(obj)


@router.put("/forms/{item_id}", response_model=FormAdminOut)
def update_form(
    item_id: str,
    payload: FormIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = _form_or_404(session, item_id, tenant.id)
    _check_slug_free(session, tenant.id, payload.slug, exclude_id=item_id)
    updated = crud.update(session, obj, payload.to_kwargs(tenant.id))
    counts = forms_service.submission_counts(session, tenant.id)
    return FormAdminOut.from_model(updated, counts.get(item_id, (0, 0)))


@router.delete("/forms/{item_id}", status_code=204)
def delete_form(
    item_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    """Șterge formularul împreună cu cererile lui (altfel rămân orfane)."""
    obj = _form_or_404(session, item_id, tenant.id)
    for sub in forms_service.submissions_for(session, tenant.id, item_id):
        session.delete(sub)
    session.commit()
    crud.delete(session, obj)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/forms/{item_id}/submissions", response_model=list[FormSubmissionOut])
def list_form_submissions(
    item_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    _form_or_404(session, item_id, tenant.id)
    return [
        FormSubmissionOut.from_model(s)
        for s in forms_service.submissions_for(session, tenant.id, item_id)
    ]


@router.patch("/forms/{item_id}/submissions/{sub_id}")
def set_submission_read(
    item_id: str,
    sub_id: str,
    payload: SubmissionReadIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, FormSubmission, sub_id, tenant.id)
    if not obj or obj.form_id != item_id:
        raise _notfound("Cerere")
    obj.read = payload.read
    session.add(obj)
    session.commit()
    return {"id": sub_id, "read": obj.read}


@router.delete("/forms/{item_id}/submissions/{sub_id}", status_code=204)
def delete_submission(
    item_id: str,
    sub_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, FormSubmission, sub_id, tenant.id)
    if not obj or obj.form_id != item_id:
        raise _notfound("Cerere")
    crud.delete(session, obj)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =========================================================================
# Accommodations (cazări)
# =========================================================================
@router.get("/accommodations", response_model=list[AccommodationOut])
def list_accommodations(
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    from app.services import tenant_service as svc

    return [
        AccommodationOut.from_model(x)
        for x in svc.accommodations_for(session, tenant.id)
    ]


@router.post("/accommodations", response_model=AccommodationOut, status_code=201)
def create_accommodation(
    payload: AccommodationIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return AccommodationOut.from_model(
        crud.create(session, Accommodation, payload.to_kwargs(tenant.id), "ac")
    )


@router.put("/accommodations/{item_id}", response_model=AccommodationOut)
def update_accommodation(
    item_id: str,
    payload: AccommodationIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, Accommodation, item_id, tenant.id)
    if not obj:
        raise _notfound("Cazare")
    return AccommodationOut.from_model(
        crud.update(session, obj, payload.to_kwargs(tenant.id))
    )


# =========================================================================
# Restaurants (restaurante)
# =========================================================================
@router.get("/restaurants", response_model=list[RestaurantOut])
def list_restaurants(
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    from app.services import tenant_service as svc

    return [
        RestaurantOut.from_model(x)
        for x in svc.restaurants_for(session, tenant.id)
    ]


@router.post("/restaurants", response_model=RestaurantOut, status_code=201)
def create_restaurant(
    payload: RestaurantIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return RestaurantOut.from_model(
        crud.create(session, Restaurant, payload.to_kwargs(tenant.id), "re")
    )


@router.put("/restaurants/{item_id}", response_model=RestaurantOut)
def update_restaurant(
    item_id: str,
    payload: RestaurantIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, Restaurant, item_id, tenant.id)
    if not obj:
        raise _notfound("Restaurant")
    return RestaurantOut.from_model(
        crud.update(session, obj, payload.to_kwargs(tenant.id))
    )


# =========================================================================
# Events (evenimente)
# =========================================================================
@router.get("/events", response_model=list[EventOut])
def list_events(
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    from app.services import tenant_service as svc

    return [EventOut.from_model(x) for x in svc.events_for(session, tenant.id)]


@router.post("/events", response_model=EventOut, status_code=201)
def create_event_item(
    payload: EventIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return EventOut.from_model(
        crud.create(session, TenantEvent, payload.to_kwargs(tenant.id), "ev")
    )


@router.put("/events/{item_id}", response_model=EventOut)
def update_event_item(
    item_id: str,
    payload: EventIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, TenantEvent, item_id, tenant.id)
    if not obj:
        raise _notfound("Eveniment")
    return EventOut.from_model(
        crud.update(session, obj, payload.to_kwargs(tenant.id))
    )


# =========================================================================
# Products
# =========================================================================
@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return ProductOut.from_model(
        crud.create(session, Product, payload.to_kwargs(tenant.id), "pr")
    )


@router.put("/products/{item_id}", response_model=ProductOut)
def update_product(
    item_id: str,
    payload: ProductIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, Product, item_id, tenant.id)
    if not obj:
        raise _notfound("Produs")
    return ProductOut.from_model(crud.update(session, obj, payload.to_kwargs(tenant.id)))


# =========================================================================
# Destinations
# =========================================================================
@router.post("/destinations", response_model=DestinationOut, status_code=201)
def create_destination(
    payload: DestinationIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return DestinationOut.from_model(
        crud.create(session, Destination, payload.to_kwargs(tenant.id), "de")
    )


@router.put("/destinations/{item_id}", response_model=DestinationOut)
def update_destination(
    item_id: str,
    payload: DestinationIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, Destination, item_id, tenant.id)
    if not obj:
        raise _notfound("Destinație")
    return DestinationOut.from_model(
        crud.update(session, obj, payload.to_kwargs(tenant.id))
    )


# =========================================================================
# Program
# =========================================================================
@router.post("/program", response_model=ProgramEventOut, status_code=201)
def create_event(
    payload: ProgramEventIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return ProgramEventOut.from_model(
        crud.create(session, ProgramEvent, payload.to_kwargs(tenant.id), "ev")
    )


@router.put("/program/{item_id}", response_model=ProgramEventOut)
def update_event(
    item_id: str,
    payload: ProgramEventIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, ProgramEvent, item_id, tenant.id)
    if not obj:
        raise _notfound("Eveniment")
    return ProgramEventOut.from_model(
        crud.update(session, obj, payload.to_kwargs(tenant.id))
    )


# =========================================================================
# Partners
# =========================================================================
@router.post("/partners", response_model=PartnerOut, status_code=201)
def create_partner(
    payload: PartnerIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return PartnerOut.from_model(
        crud.create(session, Partner, payload.to_kwargs(tenant.id), "pa")
    )


@router.put("/partners/{item_id}", response_model=PartnerOut)
def update_partner(
    item_id: str,
    payload: PartnerIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, Partner, item_id, tenant.id)
    if not obj:
        raise _notfound("Partener")
    return PartnerOut.from_model(crud.update(session, obj, payload.to_kwargs(tenant.id)))


# =========================================================================
# Gallery
# =========================================================================
@router.post("/gallery", response_model=GalleryImageOut, status_code=201)
def create_gallery(
    payload: GalleryImageIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return GalleryImageOut.from_model(
        crud.create(session, GalleryImage, payload.to_kwargs(tenant.id), "g")
    )


@router.put("/gallery/{item_id}", response_model=GalleryImageOut)
def update_gallery(
    item_id: str,
    payload: GalleryImageIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, GalleryImage, item_id, tenant.id)
    if not obj:
        raise _notfound("Imagine")
    return GalleryImageOut.from_model(
        crud.update(session, obj, payload.to_kwargs(tenant.id))
    )


# =========================================================================
# Articles
# =========================================================================
@router.post("/articles", response_model=ArticleOut, status_code=201)
def create_article(
    payload: ArticleIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return ArticleOut.from_model(
        crud.create(session, Article, payload.to_kwargs(tenant.id), "ar")
    )


@router.put("/articles/{item_id}", response_model=ArticleOut)
def update_article(
    item_id: str,
    payload: ArticleIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, Article, item_id, tenant.id)
    if not obj:
        raise _notfound("Articol")
    return ArticleOut.from_model(crud.update(session, obj, payload.to_kwargs(tenant.id)))


# =========================================================================
# Generic delete / move / toggle-status across collections
# =========================================================================
_MODELS: dict[str, type] = {
    "exhibitors": Exhibitor,
    "accommodations": Accommodation,
    "restaurants": Restaurant,
    "events": TenantEvent,
    "products": Product,
    "destinations": Destination,
    "program": ProgramEvent,
    "partners": Partner,
    "gallery": GalleryImage,
    "articles": Article,
    "forms": FormDefinition,
}
_STATUS_MODELS = {
    "exhibitors",
    "accommodations",
    "restaurants",
    "events",
    "products",
    "destinations",
    "partners",
    "articles",
    "forms",
}


def _model_or_400(collection: str) -> type:
    model = _MODELS.get(collection)
    if not model:
        raise HTTPException(status_code=400, detail=f"Colecție necunoscută: {collection}")
    return model


@router.delete("/{collection}/{item_id}", status_code=204)
def delete_item(
    collection: str,
    item_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    model = _model_or_400(collection)
    obj = crud.get_owned(session, model, item_id, tenant.id)
    if not obj:
        raise _notfound("Element")
    crud.delete(session, obj)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{collection}/{item_id}/move")
def move_item(
    collection: str,
    item_id: str,
    payload: MoveIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    model = _model_or_400(collection)
    direction = 1 if payload.direction > 0 else -1
    ok = crud.move(session, model, tenant.id, item_id, direction)
    return {"ok": ok}


@router.post("/{collection}/{item_id}/toggle-status")
def toggle_item_status(
    collection: str,
    item_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    if collection not in _STATUS_MODELS:
        raise HTTPException(status_code=400, detail="Colecția nu are status.")
    model = _MODELS[collection]
    obj = crud.get_owned(session, model, item_id, tenant.id)
    if not obj:
        raise _notfound("Element")
    crud.toggle_status(session, obj)
    return {"id": item_id, "status": obj.status}


# =========================================================================
# Analytics aggregation (tenant-admin)
# =========================================================================
_RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}


def _empty_analytics(range_key: str, days: int) -> dict:
    import datetime as dt

    today = dt.date.today()
    start = today - dt.timedelta(days=days - 1)
    series = [
        {
            "date": (start + dt.timedelta(days=i)).isoformat(),
            "views": 0,
            "uniques": 0,
        }
        for i in range(days)
    ]
    return {
        "range": range_key,
        "totals": {"views": 0, "uniques": 0, "viewsPrev": 0, "uniquesPrev": 0},
        "timeseries": series,
        "topPages": [],
        "topCountries": [],
        "topCities": [],
        "referrers": [],
        "devices": [],
    }


@router.get("/analytics")
def get_analytics(
    range_: str = Query("7d", alias="range"),
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
) -> dict:
    import datetime as dt
    from collections import defaultdict

    from sqlmodel import select

    from app.models import PageView

    range_key = range_ if range_ in _RANGE_DAYS else "7d"
    days = _RANGE_DAYS[range_key]

    if not settings.ANALYTICS_ENABLED:
        return _empty_analytics(range_key, days)

    today = dt.date.today()
    start = today - dt.timedelta(days=days - 1)
    prev_start = start - dt.timedelta(days=days)  # N days before the window

    rows = list(
        session.exec(
            select(PageView)
            .where(PageView.tenant_id == tenant.id)
            .where(PageView.day >= prev_start)
        ).all()
    )

    # --- totals (current + previous window) ---
    cur_views = prev_views = 0
    cur_uniques: set[str] = set()
    prev_uniques: set[str] = set()
    # --- per-day (current window) ---
    day_views: dict[str, int] = defaultdict(int)
    day_uniques: dict[str, set[str]] = defaultdict(set)
    # --- breakdowns (current window) ---
    page_views: dict[str, int] = defaultdict(int)
    country_views: dict[str, int] = defaultdict(int)
    country_names: dict[str, str] = {}
    city_views: dict[tuple[str, str], int] = defaultdict(int)
    referrer_views: dict[str, int] = defaultdict(int)
    device_views: dict[str, int] = defaultdict(int)

    for r in rows:
        if r.day < start:
            # previous window: only used for the trend baseline
            if prev_start <= r.day < start:
                prev_views += 1
                if r.visitor_hash:
                    prev_uniques.add(r.visitor_hash)
            continue
        # current window
        cur_views += 1
        if r.visitor_hash:
            cur_uniques.add(r.visitor_hash)
        d = r.day.isoformat()
        day_views[d] += 1
        if r.visitor_hash:
            day_uniques[d].add(r.visitor_hash)
        if r.path:
            page_views[r.path] += 1
        if r.country:
            country_views[r.country] += 1
            if r.country not in country_names and r.country_name:
                country_names[r.country] = r.country_name
        if r.city:
            city_views[(r.city, r.country)] += 1
        referrer_views[r.referrer_host] += 1  # "" => Direct
        if r.device:
            device_views[r.device] += 1

    timeseries = []
    for i in range(days):
        d = (start + dt.timedelta(days=i)).isoformat()
        timeseries.append(
            {"date": d, "views": day_views.get(d, 0), "uniques": len(day_uniques.get(d, ()))}
        )

    top_pages = [
        {"path": p, "views": v}
        for p, v in sorted(page_views.items(), key=lambda kv: kv[1], reverse=True)[:10]
    ]
    top_countries = [
        {"country": c, "countryName": country_names.get(c, ""), "views": v}
        for c, v in sorted(country_views.items(), key=lambda kv: kv[1], reverse=True)[:10]
    ]
    top_cities = [
        {"city": city, "country": country, "views": v}
        for (city, country), v in sorted(
            city_views.items(), key=lambda kv: kv[1], reverse=True
        )[:10]
    ]
    referrers = [
        {"referrer": (r or "Direct"), "views": v}
        for r, v in sorted(referrer_views.items(), key=lambda kv: kv[1], reverse=True)[:10]
    ]
    devices = [
        {"device": dv, "views": v}
        for dv, v in sorted(device_views.items(), key=lambda kv: kv[1], reverse=True)
    ]

    return {
        "range": range_key,
        "totals": {
            "views": cur_views,
            "uniques": len(cur_uniques),
            "viewsPrev": prev_views,
            "uniquesPrev": len(prev_uniques),
        },
        "timeseries": timeseries,
        "topPages": top_pages,
        "topCountries": top_countries,
        "topCities": top_cities,
        "referrers": referrers,
        "devices": devices,
    }


# =========================================================================
# Settings + sections
# =========================================================================
@router.put("/settings", response_model=TenantConfigOut)
def update_settings(
    payload: SettingsIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    patch = payload.to_tenant_patch()
    for col, val in patch.items():
        setattr(tenant, col, val)
    tenant.updated_at = utcnow()
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return TenantConfigOut.from_model(tenant)


@router.put("/navigation", response_model=TenantConfigOut)
def update_navigation(
    payload: NavigationIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    """Salvează meniul de sus. Stocăm doar `href/label/visible` — restul
    (`custom`, `sectionHidden`) se recalculează din preset la citire, ca o
    schimbare de preset să nu rămână „înghețată" în baza de date."""
    tenant.navigation = [
        {
            "href": str(item.get("href") or "").strip(),
            "label": str(item.get("label") or "").strip(),
            "visible": bool(item.get("visible", True)),
        }
        for item in payload.navigation
        if str(item.get("href") or "").strip()
    ]
    tenant.updated_at = utcnow()
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return TenantConfigOut.from_model(tenant)


@router.put("/sections", response_model=TenantConfigOut)
def update_sections(
    payload: SectionsIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    tenant.sections = payload.sections
    tenant.updated_at = utcnow()
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return TenantConfigOut.from_model(tenant)


# =========================================================================
# Contact messages
# =========================================================================
@router.patch("/messages/{item_id}")
def set_message_read(
    item_id: str,
    payload: MessageReadIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, ContactMessage, item_id, tenant.id)
    if not obj:
        raise _notfound("Mesaj")
    obj.read = payload.read
    session.add(obj)
    session.commit()
    return {"id": item_id, "read": obj.read}


@router.delete("/messages/{item_id}", status_code=204)
def delete_message(
    item_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, ContactMessage, item_id, tenant.id)
    if not obj:
        raise _notfound("Mesaj")
    crud.delete(session, obj)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =========================================================================
# Newsletter (admin add / delete)
# =========================================================================
@router.post("/newsletter", status_code=201)
def add_subscriber(
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
        raise HTTPException(status_code=409, detail="Adresa este deja abonată.")
    sub = NewsletterSubscriber(
        id=new_id("ns"),
        tenant_id=tenant.id,
        email=payload.email,
        source=payload.source,
        date=utcnow().date(),
    )
    session.add(sub)
    session.commit()
    return {"id": sub.id, "email": sub.email}


@router.delete("/newsletter/{item_id}", status_code=204)
def delete_subscriber(
    item_id: str,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    obj = crud.get_owned(session, NewsletterSubscriber, item_id, tenant.id)
    if not obj:
        raise _notfound("Abonat")
    crud.delete(session, obj)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =========================================================================
# Reset demo data
# =========================================================================
@router.post("/reset")
def reset_demo(
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
    user: AdminUser = Depends(get_current_user),
):
    from app.db.seed import run_seed

    run_seed(session, force=True)
    return {"ok": True, "message": "Datele demo au fost resetate."}
