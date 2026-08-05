from __future__ import annotations

import datetime as dt
from typing import Any

from sqlmodel import Session, select

from app.billing.payments import EVENT_COMPLETED, StripeGateway
from app.billing.settings_store import stripe_config
from app.core.config import settings
from app.models import PaymentOrder, PlanPackage, Subscription, Tenant
from app.models.base import new_id


class PaymentNotConfigured(Exception):
    pass


class CheckoutError(Exception):
    pass


def _gateway(session: Session) -> StripeGateway:
    cfg = stripe_config(session)
    if not cfg:
        raise PaymentNotConfigured()
    return StripeGateway(cfg[0], cfg[1])


def _amount_for(session: Session, plan: str, cycle: str) -> tuple[int, str]:
    pkg = session.exec(
        select(PlanPackage)
        .where(PlanPackage.code == plan)
        .where(PlanPackage.tenant_id == None)  # noqa: E711
    ).first()
    if not pkg or pkg.price_monthly_bani <= 0:
        raise CheckoutError("Acest plan nu are un preț de checkout (contactează-ne).")
    if cycle == "annual" and pkg.price_annual_bani:
        return pkg.price_annual_bani, pkg.currency
    return pkg.price_monthly_bani, pkg.currency


def start_subscription_checkout(
    session: Session, tenant: Tenant, plan: str, cycle: str = "monthly"
) -> str:
    """Create a Stripe Checkout session for a subscription and return its URL."""
    gateway = _gateway(session)
    amount, currency = _amount_for(session, plan, cycle)

    order_ref = new_id("ord")
    base = f"https://{settings.PLATFORM_DOMAIN}/admin/subscriptions"
    order = PaymentOrder(
        id=order_ref,
        order_ref=order_ref,
        tenant_id=tenant.id,
        kind="subscription",
        amount_minor=amount,
        currency=currency,
        status="pending",
        provider="stripe",
        order_metadata={"plan": plan, "cycle": cycle},
    )
    session.add(order)
    session.commit()

    session_id, url = gateway.create_checkout_session(
        amount_minor=amount,
        currency=currency,
        description=f"Abonament {plan.capitalize()} — {tenant.name}",
        success_url=f"{base}?checkout=success",
        cancel_url=f"{base}?checkout=cancel",
        order_ref=order_ref,
        metadata={"tenant_id": tenant.id, "plan": plan, "cycle": cycle},
    )
    order.provider_ref = session_id
    session.add(order)
    session.commit()
    return url


def fulfil_event(session: Session, event: dict[str, Any]) -> bool:
    """Apply a verified webhook event. Idempotent on order.fulfilled_at."""
    if event.get("type") != EVENT_COMPLETED:
        return False
    order_ref = event.get("order_ref")
    order = None
    if order_ref:
        order = session.get(PaymentOrder, order_ref)
    if order is None and event.get("session_id"):
        order = session.exec(
            select(PaymentOrder).where(PaymentOrder.provider_ref == event["session_id"])
        ).first()
    if order is None or order.fulfilled_at is not None:
        return order is not None  # unknown → False; already done → True (idempotent)

    now = dt.datetime.now(dt.timezone.utc)
    order.status = "paid"
    order.fulfilled_at = now
    session.add(order)

    plan = (order.order_metadata or {}).get("plan", "pro")
    cycle = (order.order_metadata or {}).get("cycle", "monthly")
    if order.tenant_id:
        sub = session.exec(
            select(Subscription).where(Subscription.tenant_id == order.tenant_id)
        ).first()
        if sub is None:
            sub = Subscription(id=f"sub-{order.tenant_id}", tenant_id=order.tenant_id)
        sub.plan = plan
        sub.status = "active"
        sub.billing_cycle = cycle
        days = 365 if cycle == "annual" else 30
        sub.current_period_end = now + dt.timedelta(days=days)
        sub.updated_at = now
        session.add(sub)

    session.commit()
    return True
