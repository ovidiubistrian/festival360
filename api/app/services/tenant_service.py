from __future__ import annotations

from sqlmodel import Session, select

from app.models import (
    Accommodation,
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


def get_tenant(session: Session, slug: str) -> Tenant | None:
    return session.exec(select(Tenant).where(Tenant.slug == slug)).first()


def list_tenants(session: Session) -> list[Tenant]:
    return list(session.exec(select(Tenant).order_by(Tenant.name)).all())


def exhibitors_for(session: Session, tenant_id: str) -> list[Exhibitor]:
    return list(
        session.exec(
            select(Exhibitor)
            .where(Exhibitor.tenant_id == tenant_id)
            .order_by(Exhibitor.sort_order)
        ).all()
    )


def accommodations_for(session: Session, tenant_id: str) -> list[Accommodation]:
    return list(
        session.exec(
            select(Accommodation)
            .where(Accommodation.tenant_id == tenant_id)
            .order_by(Accommodation.sort_order)
        ).all()
    )


def products_for(session: Session, tenant_id: str) -> list[Product]:
    return list(
        session.exec(
            select(Product)
            .where(Product.tenant_id == tenant_id)
            .order_by(Product.sort_order)
        ).all()
    )


def destinations_for(session: Session, tenant_id: str) -> list[Destination]:
    return list(
        session.exec(
            select(Destination)
            .where(Destination.tenant_id == tenant_id)
            .order_by(Destination.sort_order)
        ).all()
    )


def program_for(session: Session, tenant_id: str) -> list[ProgramEvent]:
    return list(
        session.exec(
            select(ProgramEvent)
            .where(ProgramEvent.tenant_id == tenant_id)
            .order_by(ProgramEvent.day, ProgramEvent.start_time)
        ).all()
    )


def partners_for(session: Session, tenant_id: str) -> list[Partner]:
    return list(
        session.exec(
            select(Partner)
            .where(Partner.tenant_id == tenant_id)
            .order_by(Partner.sort_order)
        ).all()
    )


def gallery_for(session: Session, tenant_id: str) -> list[GalleryImage]:
    return list(
        session.exec(
            select(GalleryImage)
            .where(GalleryImage.tenant_id == tenant_id)
            .order_by(GalleryImage.sort_order)
        ).all()
    )


def articles_for(session: Session, tenant_id: str) -> list[Article]:
    return list(
        session.exec(
            select(Article)
            .where(Article.tenant_id == tenant_id)
            .order_by(Article.sort_order)
        ).all()
    )


def messages_for(session: Session, tenant_id: str) -> list[ContactMessage]:
    return list(
        session.exec(
            select(ContactMessage)
            .where(ContactMessage.tenant_id == tenant_id)
            .order_by(ContactMessage.date.desc())  # type: ignore[union-attr]
        ).all()
    )


def newsletter_for(session: Session, tenant_id: str) -> list[NewsletterSubscriber]:
    return list(
        session.exec(
            select(NewsletterSubscriber)
            .where(NewsletterSubscriber.tenant_id == tenant_id)
            .order_by(NewsletterSubscriber.date.desc())  # type: ignore[union-attr]
        ).all()
    )
