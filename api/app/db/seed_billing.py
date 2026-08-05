from __future__ import annotations

import datetime as dt

from sqlmodel import Session, select

from app.billing.plans import Plan
from app.core.security import hash_password
from app.models import AdminUser, PlanPackage, StaffAccount, Subscription

# Standard public packages. Prices in MINOR UNITS (bani). annual = 10 months.
_PACKAGES = [
    {
        "id": "pkg-starter", "code": Plan.STARTER, "label": "Starter",
        "tagline": "Un eveniment, un site frumos.", "price_monthly_bani": 9900,
        "price_annual_bani": 99000, "seats": 1, "is_featured": False, "sort_order": 1,
        "benefits": [
            "Site public modern + panou de administrare",
            "Module de bază (program, directoar, galerie, noutăți)",
            "Subdomeniu inclus", "1 administrator",
        ],
    },
    {
        "id": "pkg-pro", "code": Plan.PRO, "label": "Pro",
        "tagline": "Pentru evenimente cu ambiții.", "price_monthly_bani": 24900,
        "price_annual_bani": 249000, "seats": 3, "is_featured": True, "sort_order": 2,
        "benefits": [
            "Tot din Starter, plus:", "Domeniu propriu", "Ticketing & înscrieri",
            "Multilingv", "Hartă interactivă", "Analytics real", "Fără brandingul platformei",
        ],
    },
    {
        "id": "pkg-cultural", "code": Plan.CULTURAL, "label": "Cultural",
        "tagline": "Pentru instituții recurente.", "price_monthly_bani": 49900,
        "price_annual_bani": 499000, "seats": 8, "is_featured": False, "sort_order": 3,
        "benefits": [
            "Tot din Pro, plus:", "Ediții / sezoane", "Mai mulți administratori & roluri",
            "Suport prioritar",
        ],
    },
    {
        "id": "pkg-enterprise", "code": Plan.ENTERPRISE, "label": "Enterprise",
        "tagline": "Rețele & primării.", "price_monthly_bani": 0,
        "price_annual_bani": None, "seats": None, "is_featured": False, "sort_order": 4,
        "benefits": [
            "Tot din Cultural, plus:", "Multi-tenant „umbrelă” (calendar agregat)",
            "API & integrări", "SLA & onboarding asistat", "Preț la cerere",
        ],
    },
]

# Which demo tenant is on which plan (to show variety in the console).
_DEMO_SUBS = {
    "prispa": ("cultural", "active"),
    "poiana-marului": ("pro", "trialing"),
    "muzeul-satului-banatean": ("starter", "active"),
}


def run_billing_seed(session: Session, *, force: bool = False) -> None:
    # Standard packages (idempotent; re-seeded on force).
    existing = session.exec(
        select(PlanPackage).where(PlanPackage.tenant_id == None)  # noqa: E711
    ).all()
    if existing and force:
        for p in existing:
            session.delete(p)
        session.flush()
    if not existing or force:
        for row in _PACKAGES:
            session.add(PlanPackage(**row))
        session.commit()

    # Demo subscriptions.
    now = dt.datetime.now(dt.timezone.utc)
    for tenant_id, (plan, status) in _DEMO_SUBS.items():
        sub = session.exec(
            select(Subscription).where(Subscription.tenant_id == tenant_id)
        ).first()
        if sub:
            continue
        session.add(
            Subscription(
                id=f"sub-{tenant_id}",
                tenant_id=tenant_id,
                plan=plan,
                status=status,
                billing_cycle="monthly",
                trial_ends_at=(now + dt.timedelta(days=10)) if status == "trialing" else None,
                current_period_end=(now + dt.timedelta(days=30)) if status == "active" else None,
            )
        )
    # A demo owner account for prispa.
    if not session.exec(
        select(StaffAccount).where(StaffAccount.tenant_id == "prispa")
    ).first():
        session.add(
            StaffAccount(
                id="staff-prispa-owner",
                tenant_id="prispa",
                first_name="Organizator",
                last_name="PRISPA",
                email="organizator@prispa.ro",
                role="owner",
            )
        )

    # A demo TENANT-ADMIN login (scoped to prispa) — to test role-based login
    # alongside the platform super-admin.
    if not session.exec(
        select(AdminUser).where(AdminUser.email == "admin@prispa.ro")
    ).first():
        session.add(
            AdminUser(
                id="admin-prispa",
                email="admin@prispa.ro",
                hashed_password=hash_password("demo1234"),
                full_name="Admin PRISPA",
                tenant_id="prispa",
                is_superuser=False,
                is_active=True,
            )
        )
    session.commit()
