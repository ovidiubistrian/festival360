"""Subscription plans & feature entitlements — DEFINITION IN CODE.

What plans exist and what each GRANTS lives here (enums + a hardcoded dict,
testable). Commercial prices, marketing labels and editable limits live in the
DB table `plan_package` (written from the super-admin console). There is NO
price in this repository — see app/models/billing.py + the seed.

Money is always in MINOR UNITS (bani = 1/100 RON). Never floats.
"""

from __future__ import annotations

from enum import StrEnum


class Plan(StrEnum):
    STARTER = "starter"
    PRO = "pro"
    CULTURAL = "cultural"
    ENTERPRISE = "enterprise"


class Feature(StrEnum):
    CUSTOM_DOMAIN = "custom_domain"       # own domain instead of a subdomain
    MULTILANGUAGE = "multilanguage"       # i18n content
    TICKETING = "ticketing"               # ticketing / registrations
    MAP = "map"                           # interactive map / trails
    ANALYTICS = "analytics"               # real analytics dashboard
    REMOVE_BRANDING = "remove_branding"   # hide "powered by Festival Hub"
    PRIORITY_SUPPORT = "priority_support"
    API_ACCESS = "api_access"


# Features enabled for everyone regardless of plan (the base product).
DEFAULT_FEATURES: frozenset[Feature] = frozenset()

# What each plan grants (cumulative is expressed explicitly, not by inheritance).
PLAN_FEATURES: dict[Plan, frozenset[Feature]] = {
    Plan.STARTER: frozenset(),
    Plan.PRO: frozenset({
        Feature.CUSTOM_DOMAIN, Feature.MULTILANGUAGE, Feature.TICKETING,
        Feature.MAP, Feature.ANALYTICS, Feature.REMOVE_BRANDING,
    }),
    Plan.CULTURAL: frozenset({
        Feature.CUSTOM_DOMAIN, Feature.MULTILANGUAGE, Feature.TICKETING,
        Feature.MAP, Feature.ANALYTICS, Feature.REMOVE_BRANDING,
        Feature.PRIORITY_SUPPORT,
    }),
    Plan.ENTERPRISE: frozenset(Feature),  # everything
}

# Non-feature limits per plan (editable defaults; the DB package can override).
PLAN_LIMITS: dict[Plan, dict[str, int | None]] = {
    Plan.STARTER: {"seats": 1, "locales": 1},
    Plan.PRO: {"seats": 3, "locales": 3},
    Plan.CULTURAL: {"seats": 8, "locales": 5},
    Plan.ENTERPRISE: {"seats": None, "locales": None},  # None = unlimited
}

# Trial length applied on signup.
DEFAULT_TRIAL_DAYS = 14
# Grace period after trial/period end before features are cut.
GRACE_DAYS = 3


def features_for(plan: Plan) -> frozenset[Feature]:
    return DEFAULT_FEATURES | PLAN_FEATURES.get(plan, frozenset())


def _assert_no_hollow_plans() -> None:
    """Refuse to start if a non-starter plan grants nothing meaningful."""
    for plan in (Plan.PRO, Plan.CULTURAL, Plan.ENTERPRISE):
        if not PLAN_FEATURES.get(plan):
            raise RuntimeError(f"Plan '{plan}' grants no features — misconfigured.")


_assert_no_hollow_plans()
