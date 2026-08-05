from __future__ import annotations

import datetime as dt
import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlmodel import Session, select

from app.api.deps import get_current_superuser
from app.billing import settings_store
from app.billing.checkout import (
    CheckoutError,
    PaymentNotConfigured,
    fulfil_event,
    start_subscription_checkout,
)
from app.billing.payments import StripeGateway
from app.core.db import get_session
from app.models import (
    AdminUser,
    PlanPackage,
    PlatformLead,
    Subscription,
    Tenant,
)
from app.models.base import new_id
from app.presets import build_tenant_fields, list_presets, PRESETS
from app.schemas.common import CamelModel

router = APIRouter(prefix="/platform", tags=["platform"])

# Demo tenants that must not be deleted (the content admin is wired to prispa).
PROTECTED_SLUGS = {"prispa"}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class TenantCreateIn(CamelModel):
    name: str
    slug: str
    event_type: str = "festival"


class TenantSummary(CamelModel):
    slug: str
    name: str
    event_type: str
    tagline: str
    theme_primary: str


@router.get("/presets", dependencies=[Depends(get_current_superuser)])
def get_presets() -> list[dict]:
    return list_presets()


@router.get(
    "/tenants",
    response_model=list[TenantSummary],
    dependencies=[Depends(get_current_superuser)],
)
def list_all_tenants(session: Session = Depends(get_session)):
    from sqlmodel import select

    rows = session.exec(select(Tenant).order_by(Tenant.name)).all()
    return [
        TenantSummary(
            slug=t.slug,
            name=t.name,
            event_type=t.event_type,
            tagline=t.tagline,
            theme_primary=t.theme_primary,
        )
        for t in rows
    ]


@router.post("/tenants", response_model=TenantSummary, status_code=201)
def create_tenant(
    payload: TenantCreateIn,
    session: Session = Depends(get_session),
    _: AdminUser = Depends(get_current_superuser),
):
    slug = payload.slug.strip().lower()
    if not SLUG_RE.match(slug):
        raise HTTPException(
            status_code=400,
            detail="Slug invalid: doar litere mici, cifre și cratime (ex. festivalul-meu).",
        )
    if payload.event_type not in PRESETS:
        raise HTTPException(status_code=400, detail="Tip de eveniment necunoscut.")
    if session.get(Tenant, slug):
        raise HTTPException(status_code=409, detail=f"Slug-ul „{slug}” este deja folosit.")

    fields = build_tenant_fields(payload.event_type, payload.name.strip(), slug)
    tenant = Tenant(**fields)
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    return TenantSummary(
        slug=tenant.slug,
        name=tenant.name,
        event_type=tenant.event_type,
        tagline=tenant.tagline,
        theme_primary=tenant.theme_primary,
    )


@router.delete("/tenants/{slug}", status_code=204)
def delete_tenant(
    slug: str,
    session: Session = Depends(get_session),
    _: AdminUser = Depends(get_current_superuser),
):
    if slug in PROTECTED_SLUGS:
        raise HTTPException(status_code=403, detail="Acest site demo nu poate fi șters.")
    tenant = session.get(Tenant, slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Site inexistent.")
    from app.db.seed import _wipe_tenant

    _wipe_tenant(session, slug)
    # Remove the tenant's subscription too (not covered by content wipe).
    sub = session.exec(
        select(Subscription).where(Subscription.tenant_id == slug)
    ).first()
    if sub:
        session.delete(sub)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =========================================================================
# Packages / pricing
# =========================================================================
class PackageOut(CamelModel):
    id: str
    code: str
    label: str
    tagline: str
    price_monthly_bani: int
    price_annual_bani: int | None
    currency: str
    benefits: list[str]
    seats: int | None
    is_featured: bool


@router.get("/packages", response_model=list[PackageOut])
def public_packages(session: Session = Depends(get_session)):
    """Public pricing for the marketing site (no auth)."""
    rows = session.exec(
        select(PlanPackage)
        .where(PlanPackage.tenant_id == None)  # noqa: E711
        .where(PlanPackage.is_public == True)  # noqa: E712
        .where(PlanPackage.active == True)  # noqa: E712
        .order_by(PlanPackage.sort_order)
    ).all()
    return [PackageOut.model_validate(p) for p in rows]


# =========================================================================
# Signup / leads
# =========================================================================
class SignupIn(CamelModel):
    name: str
    email: str
    organization: str = ""
    event_type: str = ""
    plan: str = ""
    message: str = ""


@router.post("/signup", status_code=201)
def signup(payload: SignupIn, session: Session = Depends(get_session)):
    """Public signup / sales inquiry — captured as a platform lead."""
    lead = PlatformLead(
        id=new_id("lead"),
        name=payload.name,
        email=payload.email,
        organization=payload.organization,
        event_type=payload.event_type,
        plan=payload.plan,
        message=payload.message,
        status="new",
    )
    session.add(lead)
    session.commit()
    return {"ok": True, "id": lead.id}


class LeadOut(CamelModel):
    id: str
    name: str
    email: str
    organization: str
    event_type: str
    plan: str
    message: str
    status: str
    created_at: dt.datetime


@router.get(
    "/leads",
    response_model=list[LeadOut],
    dependencies=[Depends(get_current_superuser)],
)
def list_leads(session: Session = Depends(get_session)):
    rows = session.exec(
        select(PlatformLead).order_by(PlatformLead.created_at.desc())  # type: ignore[union-attr]
    ).all()
    return [LeadOut.model_validate(r) for r in rows]


class LeadStatusIn(CamelModel):
    status: str


@router.patch("/leads/{lead_id}", dependencies=[Depends(get_current_superuser)])
def set_lead_status(
    lead_id: str, payload: LeadStatusIn, session: Session = Depends(get_session)
):
    lead = session.get(PlatformLead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Solicitare inexistentă.")
    lead.status = payload.status
    session.add(lead)
    session.commit()
    return {"id": lead_id, "status": lead.status}


# =========================================================================
# Subscriptions (super-admin)
# =========================================================================
class SubscriptionOut(CamelModel):
    tenant_id: str
    tenant_name: str
    event_type: str
    plan: str
    status: str
    billing_cycle: str
    trial_ends_at: dt.datetime | None
    current_period_end: dt.datetime | None


@router.get(
    "/subscriptions",
    response_model=list[SubscriptionOut],
    dependencies=[Depends(get_current_superuser)],
)
def list_subscriptions(session: Session = Depends(get_session)):
    tenants = {t.slug: t for t in session.exec(select(Tenant)).all()}
    out: list[SubscriptionOut] = []
    for t in tenants.values():
        sub = session.exec(
            select(Subscription).where(Subscription.tenant_id == t.id)
        ).first()
        out.append(
            SubscriptionOut(
                tenant_id=t.slug,
                tenant_name=t.name,
                event_type=t.event_type,
                plan=sub.plan if sub else "—",
                status=sub.status if sub else "none",
                billing_cycle=sub.billing_cycle if sub else "—",
                trial_ends_at=sub.trial_ends_at if sub else None,
                current_period_end=sub.current_period_end if sub else None,
            )
        )
    return out


class SetPlanIn(CamelModel):
    plan: str
    status: str = "active"


@router.put(
    "/tenants/{slug}/plan", dependencies=[Depends(get_current_superuser)]
)
def set_tenant_plan(
    slug: str, payload: SetPlanIn, session: Session = Depends(get_session)
):
    if payload.plan not in {"starter", "pro", "cultural", "enterprise"}:
        raise HTTPException(status_code=400, detail="Plan necunoscut.")
    tenant = session.get(Tenant, slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Site inexistent.")
    sub = session.exec(
        select(Subscription).where(Subscription.tenant_id == slug)
    ).first()
    now = dt.datetime.now(dt.timezone.utc)
    if sub is None:
        sub = Subscription(id=f"sub-{slug}", tenant_id=slug)
    sub.plan = payload.plan
    sub.status = payload.status
    if payload.status == "active":
        sub.current_period_end = now + dt.timedelta(days=30)
    sub.updated_at = now
    session.add(sub)
    session.commit()
    return {"tenant": slug, "plan": sub.plan, "status": sub.status}


# =========================================================================
# Stripe: platform config (encrypted), checkout, webhook
# =========================================================================
class StripeConfigIn(CamelModel):
    secret_key: str
    webhook_secret: str


@router.get("/settings/stripe", dependencies=[Depends(get_current_superuser)])
def stripe_status(session: Session = Depends(get_session)):
    return {"configured": settings_store.is_stripe_configured(session)}


@router.put("/settings/stripe", dependencies=[Depends(get_current_superuser)])
def set_stripe_config(
    payload: StripeConfigIn, session: Session = Depends(get_session)
):
    if not payload.secret_key.startswith("sk_") or not payload.webhook_secret.startswith("whsec_"):
        raise HTTPException(status_code=400, detail="Chei Stripe invalide (sk_… și whsec_…).")
    settings_store.set_setting(session, settings_store.STRIPE_SECRET_KEY, payload.secret_key)
    settings_store.set_setting(session, settings_store.STRIPE_WEBHOOK_SECRET, payload.webhook_secret)
    return {"configured": True}


class CheckoutIn(CamelModel):
    plan: str
    cycle: str = "monthly"


@router.post("/tenants/{slug}/checkout", dependencies=[Depends(get_current_superuser)])
def create_checkout(
    slug: str, payload: CheckoutIn, session: Session = Depends(get_session)
):
    tenant = session.get(Tenant, slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Site inexistent.")
    if payload.plan not in {"pro", "cultural"}:
        raise HTTPException(status_code=400, detail="Doar planurile cu preț pot fi plătite online.")
    import stripe

    try:
        url = start_subscription_checkout(session, tenant, payload.plan, payload.cycle)
    except PaymentNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Plățile nu sunt configurate încă (lipsesc cheile Stripe).",
        )
    except CheckoutError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Eroare Stripe: {e.user_message or 'checkout eșuat'}")
    return {"url": url}


@router.post("/stripe/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, session: Session = Depends(get_session)):
    cfg = settings_store.stripe_config(session)
    if not cfg:
        return {"received": False}  # not configured — ignore
    gateway = StripeGateway(cfg[0], cfg[1])
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    event = gateway.verify_webhook(payload, sig)
    if event is None:
        raise HTTPException(status_code=400, detail="Semnătură invalidă.")
    if event.get("type"):
        fulfil_event(session, event)
    return {"received": True}
