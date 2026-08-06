"""Remove demo data before going fully live.

By default it removes the DEMO LOGIN accounts (known-password AdminUsers + the
demo staff account) — the important security step. With --tenants it ALSO
deletes the demo showcase sites (prispa, muzeul-satului-banatean) and everything
under them.

    docker compose --env-file .env -f docker-compose.prod.yml exec api \
        python -m app.scripts.cleanup_demo            # remove demo accounts only
    docker compose ... exec api python -m app.scripts.cleanup_demo --tenants  # + demo sites

Protected and NEVER touched:
  - your own super-admin (created with create_superadmin, e.g. ovidiubistrian@gmail.com)
  - the real tenant `poiana-marului` and any admin/staff you created for it
Also set SEED_ON_STARTUP=false in .env so demo data is never recreated on restart.
"""

from __future__ import annotations

import argparse

from sqlmodel import Session, select

from app.core.db import engine
from app.models import (
    Accommodation,
    AdminUser,
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    FeatureFlag,
    GalleryImage,
    MediaAsset,
    NewsletterSubscriber,
    PageView,
    Partner,
    PaymentOrder,
    ProgramEvent,
    Product,
    StaffAccount,
    Subscription,
    Tenant,
)

# Known-password demo login accounts (AdminUser).
DEMO_ACCOUNTS = ["admin@prispa.demo", "admin@prispa.ro"]
# Demo staff accounts (StaffAccount table).
DEMO_STAFF = ["organizator@prispa.ro"]
# Demo showcase sites — only deleted with --tenants. `poiana-marului` is the
# user's REAL site and is intentionally NOT here.
DEMO_TENANTS = ["prispa", "muzeul-satului-banatean"]
# Never delete these tenants, whatever happens.
PROTECTED_TENANTS = {"poiana-marului"}

# Delete children before parents (Product references Exhibitor); PageView +
# Accommodation must be included or the tenant delete hits a FK constraint.
_TENANT_SCOPED = (
    Product,
    Exhibitor,
    Accommodation,
    Destination,
    ProgramEvent,
    Partner,
    GalleryImage,
    Article,
    ContactMessage,
    NewsletterSubscriber,
    MediaAsset,
    PageView,
    PaymentOrder,
    FeatureFlag,
    StaffAccount,
    Subscription,
)


def _purge_tenant(session: Session, tenant_id: str) -> bool:
    if tenant_id in PROTECTED_TENANTS:
        return False
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        return False
    for model in _TENANT_SCOPED:
        for row in session.exec(
            select(model).where(model.tenant_id == tenant_id)  # type: ignore[attr-defined]
        ).all():
            session.delete(row)
    # Any AdminUser scoped to this tenant (tenant-admins) goes too.
    for u in session.exec(
        select(AdminUser).where(AdminUser.tenant_id == tenant_id)
    ).all():
        session.delete(u)
    session.delete(tenant)
    session.commit()
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Curăță datele demo Siteora")
    parser.add_argument(
        "--tenants",
        action="store_true",
        help="Șterge și site-urile demo (prispa, muzeul-satului-banatean)",
    )
    args = parser.parse_args()

    with Session(engine) as session:
        # 1) Demo AdminUser logins (known passwords).
        removed_accounts = []
        for email in DEMO_ACCOUNTS:
            u = session.exec(
                select(AdminUser).where(AdminUser.email == email)
            ).first()
            if u:
                session.delete(u)
                removed_accounts.append(email)

        # 2) Demo staff accounts.
        removed_staff = []
        for email in DEMO_STAFF:
            s = session.exec(
                select(StaffAccount).where(StaffAccount.email == email)
            ).first()
            if s:
                session.delete(s)
                removed_staff.append(email)
        session.commit()

        print(f"Conturi demo șterse: {removed_accounts or 'niciunul'}")
        print(f"Staff demo șters:    {removed_staff or 'niciunul'}")

        if args.tenants:
            removed = [t for t in DEMO_TENANTS if _purge_tenant(session, t)]
            print(f"Site-uri demo șterse: {removed or 'niciunul'}")
            print(f"Protejate (păstrate): {', '.join(sorted(PROTECTED_TENANTS))}")
        else:
            print(
                "Site-urile demo au fost PĂSTRATE "
                "(rulează cu --tenants ca să ștergi prispa + muzeul)."
            )

    print("Gata. Setează SEED_ON_STARTUP=false în .env ca să nu fie recreate.")


if __name__ == "__main__":
    main()
