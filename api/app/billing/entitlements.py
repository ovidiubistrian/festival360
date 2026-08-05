from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field

from sqlmodel import Session, select

from app.billing.plans import (
    Feature,
    GRACE_DAYS,
    Plan,
    PLAN_LIMITS,
    features_for,
)
from app.models import FeatureFlag, Subscription


@dataclass
class Entitlement:
    tenant_id: str
    plan: Plan
    status: str
    trial_ends_at: dt.datetime | None
    current_period_end: dt.datetime | None
    features: set[str]
    limits: dict[str, int | None]
    lapsed: bool
    in_grace: bool
    lapse_message: str | None = None
    add_ons: list[str] = field(default_factory=list)

    def has(self, feature: Feature | str) -> bool:
        return str(feature) in self.features


def _naive(d: dt.datetime | None) -> dt.datetime | None:
    """Strip tzinfo so naive (DB) and aware datetimes compare cleanly."""
    return d.replace(tzinfo=None) if d and d.tzinfo else d


def _lapse(sub: Subscription, now: dt.datetime, grace_days: int) -> tuple[bool, bool, str | None]:
    """Return (lapsed, in_grace, message). Computed, never swept by a job."""
    if sub.status in ("suspended", "cancelled"):
        return True, False, "Abonamentul este suspendat sau anulat."
    grace = dt.timedelta(days=grace_days)
    now = _naive(now)  # type: ignore[assignment]
    ref = _naive(sub.current_period_end if sub.status == "active" else sub.trial_ends_at)
    if ref is None:
        return False, False, None
    if now <= ref:
        return False, False, None
    if now <= ref + grace:
        return False, True, "Perioadă de grație — reînnoiește abonamentul."
    kind = "Perioada abonamentului" if sub.status == "active" else "Perioada de probă"
    return True, False, f"{kind} a expirat."


def entitlement(
    session: Session, tenant_id: str, *, now: dt.datetime | None = None
) -> Entitlement:
    now = now or dt.datetime.now(dt.timezone.utc)
    sub = session.exec(
        select(Subscription).where(Subscription.tenant_id == tenant_id)
    ).first()

    if sub is None:
        # No subscription yet → treat as a bare starter (no premium features).
        return Entitlement(
            tenant_id=tenant_id,
            plan=Plan.STARTER,
            status="none",
            trial_ends_at=None,
            current_period_end=None,
            features=set(),
            limits=dict(PLAN_LIMITS[Plan.STARTER]),
            lapsed=False,
            in_grace=False,
        )

    try:
        plan = Plan(sub.plan)
    except ValueError:
        plan = Plan.STARTER

    lapsed, in_grace, msg = _lapse(sub, now, GRACE_DAYS)

    # Resolve features: default → plan. If lapsed, premium features are withheld.
    feats = set() if lapsed else {str(f) for f in features_for(plan)}

    # Per-tenant overrides (tenant_id set) win last.
    overrides = session.exec(
        select(FeatureFlag).where(FeatureFlag.tenant_id == tenant_id)
    ).all()
    for o in overrides:
        if o.enabled:
            feats.add(o.key)
        else:
            feats.discard(o.key)

    limits = dict(PLAN_LIMITS.get(plan, PLAN_LIMITS[Plan.STARTER]))
    if sub.seats is not None:
        limits["seats"] = sub.seats

    return Entitlement(
        tenant_id=tenant_id,
        plan=plan,
        status=sub.status,
        trial_ends_at=sub.trial_ends_at,
        current_period_end=sub.current_period_end,
        features=feats,
        limits=limits,
        lapsed=lapsed,
        in_grace=in_grace,
        lapse_message=msg,
    )
