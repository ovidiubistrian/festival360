"""Remove demo data before going fully live.

By default it removes only the DEMO LOGIN accounts (the known-password ones) —
the important security step. With --tenants it also deletes the 3 demo sites
(prispa, poiana-marului, muzeul-satului-banatean) and everything under them.

    docker compose --env-file .env -f docker-compose.prod.yml exec api \
        python -m app.scripts.cleanup_demo            # remove demo accounts only
    docker compose ... exec api python -m app.scripts.cleanup_demo --tenants  # + demo sites

Also set SEED_ON_STARTUP=false in .env so they are never recreated on restart.
Your own super-admin (created with create_superadmin) is NOT touched.
"""

from __future__ import annotations

import argparse

from sqlmodel import Session, select

from app.core.db import engine
from app.models import (
    AdminUser,
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    FeatureFlag,
    GalleryImage,
    MediaAsset,
    NewsletterSubscriber,
    Partner,
    PaymentOrder,
    ProgramEvent,
    Product,
    StaffAccount,
    Subscription,
    Tenant,
)

DEMO_ACCOUNTS = ["admin@prispa.demo", "admin@prispa.ro"]
DEMO_TENANTS = ["prispa", "poiana-marului", "muzeul-satului-banatean"]

_TENANT_SCOPED = (
    Product, Exhibitor, Destination, ProgramEvent, Partner, GalleryImage,
    Article, ContactMessage, NewsletterSubscriber, MediaAsset,
    PaymentOrder, FeatureFlag, StaffAccount, Subscription,
)


def _purge_tenant(session: Session, tenant_id: str) -> bool:
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        return False
    for model in _TENANT_SCOPED:
        for row in session.exec(
            select(model).where(model.tenant_id == tenant_id)  # type: ignore[attr-defined]
        ).all():
            session.delete(row)
    session.delete(tenant)
    session.commit()
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Curăță datele demo Siteora")
    parser.add_argument(
        "--tenants", action="store_true", help="Șterge și cele 3 site-uri demo"
    )
    args = parser.parse_args()

    with Session(engine) as session:
        removed_accounts = []
        for email in DEMO_ACCOUNTS:
            u = session.exec(select(AdminUser).where(AdminUser.email == email)).first()
            if u:
                session.delete(u)
                removed_accounts.append(email)
        session.commit()
        print(f"Conturi demo șterse: {removed_accounts or 'niciunul'}")

        if args.tenants:
            removed = [t for t in DEMO_TENANTS if _purge_tenant(session, t)]
            print(f"Site-uri demo șterse: {removed or 'niciunul'}")
        else:
            print("Site-urile demo au fost PĂSTRATE (rulează cu --tenants ca să le ștergi).")

    print("Gata. Setează SEED_ON_STARTUP=false în .env ca să nu fie recreate.")


if __name__ == "__main__":
    main()
