from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.api.deps import get_current_user, tenant_or_404
from app.core.db import get_session
from app.models import (
    AdminUser,
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    GalleryImage,
    NewsletterSubscriber,
    Partner,
    ProgramEvent,
    Product,
    Tenant,
)
from app.models.base import new_id, utcnow
from app.services import crud
from app.schemas.public import (
    ArticleOut,
    DestinationOut,
    ExhibitorOut,
    GalleryImageOut,
    PartnerOut,
    ProductOut,
    ProgramEventOut,
    TenantConfigOut,
)
from app.schemas.write import (
    ArticleIn,
    DestinationIn,
    ExhibitorIn,
    GalleryImageIn,
    MessageReadIn,
    MoveIn,
    NewsletterIn,
    PartnerIn,
    ProductIn,
    ProgramEventIn,
    SectionsIn,
    SettingsIn,
)

# Every route here requires a valid admin token.
router = APIRouter(
    prefix="/tenants/{slug}/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_user)],
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
    "products": Product,
    "destinations": Destination,
    "program": ProgramEvent,
    "partners": Partner,
    "gallery": GalleryImage,
    "articles": Article,
}
_STATUS_MODELS = {"exhibitors", "products", "destinations", "partners", "articles"}


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
