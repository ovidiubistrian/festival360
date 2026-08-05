from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from typing import Any

from sqlmodel import Session, select

from app.core.db import engine
from app.core.security import hash_password
from app.db.seed_museum import run_museum_seed
from app.db.seed_poiana import run_poiana_seed
from app.models import (
    AdminUser,
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    GalleryImage,
    MediaAsset,
    NewsletterSubscriber,
    Partner,
    ProgramEvent,
    Product,
    Tenant,
)

SEED_FILE = Path(__file__).parent / "seed_data.json"

DEMO_ADMIN_EMAIL = "admin@prispa.demo"
DEMO_ADMIN_PASSWORD = "demo1234"


def ensure_demo_admin(session: Session) -> None:
    """Idempotently create the demo admin (superuser, not tenant-bound)."""
    existing = session.exec(
        select(AdminUser).where(AdminUser.email == DEMO_ADMIN_EMAIL)
    ).first()
    if existing:
        return
    session.add(
        AdminUser(
            id="admin-demo",
            email=DEMO_ADMIN_EMAIL,
            hashed_password=hash_password(DEMO_ADMIN_PASSWORD),
            full_name="Administrator Demo",
            tenant_id=None,
            is_superuser=True,
            is_active=True,
        )
    )
    session.commit()


def _parse_dates(row: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    """Convert ISO date strings to date objects for the given keys."""
    out = dict(row)
    for k in keys:
        v = out.get(k)
        if isinstance(v, str) and v:
            out[k] = dt.date.fromisoformat(v)
    return out


def load_seed_payload() -> dict[str, Any]:
    with SEED_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def run_seed(session: Session, *, force: bool = False) -> None:
    """Insert the demo data (both tenants). If force, wipe first."""
    ensure_demo_admin(session)

    # Seed the second demo tenant (resort) — idempotent, independent of prispa's
    # early-return below, so it also seeds on a normal (non-force) startup.
    run_poiana_seed(session, force=force)

    # Seed the third demo tenant (museum) — same idempotent contract.
    run_museum_seed(session, force=force)

    payload = load_seed_payload()
    tenant_row = _parse_dates(payload["tenant"], ["start_date", "end_date"])
    tenant_id = tenant_row["id"]

    existing = session.get(Tenant, tenant_id)
    if existing and not force:
        return
    if existing and force:
        _wipe_tenant(session, tenant_id)

    # Insert parents before children so foreign keys resolve (no ORM
    # relationships are declared, so we order the flushes explicitly).
    session.add(Tenant(**tenant_row))
    session.flush()

    for row in payload["exhibitors"]:
        session.add(Exhibitor(**row))
    session.flush()

    for row in payload["products"]:
        session.add(Product(**row))
    for row in payload["destinations"]:
        session.add(Destination(**row))
    for row in payload["program"]:
        session.add(ProgramEvent(**_parse_dates(row, ["date"])))
    for row in payload["partners"]:
        session.add(Partner(**row))
    for row in payload["gallery"]:
        session.add(GalleryImage(**row))
    for row in payload["articles"]:
        session.add(Article(**_parse_dates(row, ["date"])))
    for row in payload["contact_messages"]:
        session.add(ContactMessage(**_parse_dates(row, ["date"])))
    for row in payload["newsletter"]:
        session.add(NewsletterSubscriber(**_parse_dates(row, ["date"])))
    for row in payload.get("media", []):
        session.add(MediaAsset(**row))

    session.commit()


def _wipe_tenant(session: Session, tenant_id: str) -> None:
    for model in (
        Product,  # child of exhibitor — delete before exhibitor
        Exhibitor,
        Destination,
        ProgramEvent,
        Partner,
        GalleryImage,
        Article,
        ContactMessage,
        NewsletterSubscriber,
        MediaAsset,
    ):
        rows = session.exec(
            select(model).where(model.tenant_id == tenant_id)  # type: ignore[attr-defined]
        ).all()
        for r in rows:
            session.delete(r)
    tenant = session.get(Tenant, tenant_id)
    if tenant:
        session.delete(tenant)
    session.commit()


def seed_if_empty() -> None:
    """Convenience used on startup (SEED_ON_STARTUP)."""
    with Session(engine) as session:
        run_seed(session, force=False)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed the Festival Hub database")
    parser.add_argument(
        "--force", action="store_true", help="Wipe and reseed the tenant"
    )
    args = parser.parse_args()
    with Session(engine) as session:
        run_seed(session, force=args.force)
    print("Seed complete." + (" (forced reseed)" if args.force else ""))
