from __future__ import annotations

import datetime as dt
import re
import time
import uuid

import dns.resolver
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select

from app.api.deps import get_current_superuser
from app.billing.entitlements import entitlement
from app.billing.plans import Feature
from app.core.config import settings
from app.core.db import get_session
from app.models import Tenant
from app.schemas.common import CamelModel

router = APIRouter()

DOMAIN_RE = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$")


def _norm(host: str) -> str:
    return host.split(":")[0].strip().lower().rstrip(".")


def _candidates(host: str) -> set[str]:
    host = _norm(host)
    cands = {host}
    if host.startswith("www."):
        cands.add(host[4:])
    else:
        cands.add("www." + host)
    return cands


# =========================================================================
# Caddy on-demand TLS "ask" endpoint — GET /caddy/check-domain?domain=<host>
# 200 = issue cert, 404 = refuse. Cached in-memory (TTL) to protect the DB.
# =========================================================================
_ASK_TTL = 60.0
_ask_cache: dict[str, tuple[bool, float]] = {}


@router.get("/caddy/check-domain", include_in_schema=False)
def caddy_check_domain(
    domain: str = Query(...), session: Session = Depends(get_session)
):
    host = _norm(domain)
    main = settings.PLATFORM_DOMAIN.lower()

    if host == main or host.endswith("." + main):
        return Response(status_code=200)

    now = time.monotonic()
    cached = _ask_cache.get(host)
    if cached and cached[1] > now:
        return Response(status_code=200 if cached[0] else 404)

    tenant = session.exec(
        select(Tenant)
        .where(Tenant.custom_domain.in_(_candidates(host)))  # type: ignore[union-attr]
        .where(Tenant.custom_domain_active == True)  # noqa: E712
    ).first()
    allowed = tenant is not None
    _ask_cache[host] = (allowed, now + _ASK_TTL)
    return Response(status_code=200 if allowed else 404)


# =========================================================================
# Host → tenant resolution for the frontend middleware. Clean 404 (no leak).
# =========================================================================
class TenantByDomainOut(CamelModel):
    slug: str


@router.get("/platform/tenant-by-domain", response_model=TenantByDomainOut)
def tenant_by_domain(
    host: str = Query(...), session: Session = Depends(get_session)
):
    h = _norm(host)
    main = settings.PLATFORM_DOMAIN.lower()

    # Subdomain of the platform domain → slug is the label.
    if h.endswith("." + main):
        sub = h[: -(len(main) + 1)]
        if sub and sub != "www":
            t = session.exec(select(Tenant).where(Tenant.slug == sub)).first()
            if t:
                return TenantByDomainOut(slug=t.slug)
        raise HTTPException(status_code=404, detail="Nedefinit.")

    t = session.exec(
        select(Tenant)
        .where(Tenant.custom_domain.in_(_candidates(h)))  # type: ignore[union-attr]
        .where(Tenant.custom_domain_active == True)  # noqa: E712
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Nedefinit.")
    return TenantByDomainOut(slug=t.slug)


# =========================================================================
# Domain management (super-admin) — gated on the custom_domain entitlement.
# =========================================================================
class DomainIn(CamelModel):
    domain: str


class DomainStatusOut(CamelModel):
    domain: str | None
    active: bool
    verify_token: str
    verify_record_name: str
    verify_record_value: str
    dns_target_hint: str


def _status(tenant: Tenant) -> DomainStatusOut:
    d = tenant.custom_domain
    return DomainStatusOut(
        domain=d,
        active=tenant.custom_domain_active,
        verify_token=tenant.domain_verify_token,
        verify_record_name=(
            f"{settings.DOMAIN_VERIFY_PREFIX}.{d}" if d else ""
        ),
        verify_record_value=(
            f"siteora-verify={tenant.domain_verify_token}"
            if tenant.domain_verify_token
            else ""
        ),
        dns_target_hint=f"Pointează un record A/ALIAS către serverul {settings.PLATFORM_DOMAIN}.",
    )


def _require_domain_feature(session: Session, tenant: Tenant) -> None:
    ent = entitlement(session, tenant.id)
    if not ent.has(Feature.CUSTOM_DOMAIN):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Domeniul propriu este disponibil din planul Pro în sus.",
        )


@router.get(
    "/platform/tenants/{slug}/domain",
    response_model=DomainStatusOut,
    dependencies=[Depends(get_current_superuser)],
)
def get_domain(slug: str, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Site inexistent.")
    return _status(tenant)


@router.put(
    "/platform/tenants/{slug}/domain",
    response_model=DomainStatusOut,
    dependencies=[Depends(get_current_superuser)],
)
def set_domain(slug: str, payload: DomainIn, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Site inexistent.")
    _require_domain_feature(session, tenant)

    domain = _norm(payload.domain)
    if not DOMAIN_RE.match(domain):
        raise HTTPException(status_code=400, detail="Domeniu invalid.")
    if domain.endswith("." + settings.PLATFORM_DOMAIN) or domain == settings.PLATFORM_DOMAIN:
        raise HTTPException(status_code=400, detail="Folosește un domeniu propriu, nu al platformei.")

    # Global uniqueness — cannot claim a domain already mapped to another tenant.
    taken = session.exec(
        select(Tenant).where(Tenant.custom_domain == domain).where(Tenant.id != tenant.id)
    ).first()
    if taken:
        raise HTTPException(status_code=409, detail="Domeniul este deja asociat altui site.")

    tenant.custom_domain = domain
    tenant.custom_domain_active = False  # inactive until DNS TXT verified
    tenant.dns_verified_at = None
    if not tenant.domain_verify_token:
        tenant.domain_verify_token = uuid.uuid4().hex[:24]
    tenant.updated_at = dt.datetime.now(dt.timezone.utc)
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    _ask_cache.pop(domain, None)
    return _status(tenant)


@router.post(
    "/platform/tenants/{slug}/domain/verify",
    response_model=DomainStatusOut,
    dependencies=[Depends(get_current_superuser)],
)
def verify_domain(slug: str, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, slug)
    if not tenant or not tenant.custom_domain:
        raise HTTPException(status_code=404, detail="Niciun domeniu de verificat.")
    _require_domain_feature(session, tenant)

    record = f"{settings.DOMAIN_VERIFY_PREFIX}.{tenant.custom_domain}"
    expected = f"siteora-verify={tenant.domain_verify_token}"
    try:
        answers = dns.resolver.resolve(record, "TXT", lifetime=5.0)
        values = set()
        for r in answers:
            txt = "".join(s.decode() if isinstance(s, bytes) else s for s in r.strings)  # type: ignore[attr-defined]
            values.add(txt.strip('"'))
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers, dns.exception.Timeout):
        values = set()

    if expected not in values:
        raise HTTPException(
            status_code=422,
            detail=f"Recordul TXT nu a fost găsit. Adaugă TXT „{record}” = „{expected}” și reîncearcă.",
        )

    tenant.custom_domain_active = True
    tenant.dns_verified_at = dt.datetime.now(dt.timezone.utc)
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    _ask_cache.pop(tenant.custom_domain, None)
    return _status(tenant)


@router.delete(
    "/platform/tenants/{slug}/domain",
    status_code=204,
    dependencies=[Depends(get_current_superuser)],
)
def remove_domain(slug: str, session: Session = Depends(get_session)):
    tenant = session.get(Tenant, slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="Site inexistent.")
    old = tenant.custom_domain
    tenant.custom_domain = None
    tenant.custom_domain_active = False
    tenant.dns_verified_at = None
    session.add(tenant)
    session.commit()
    if old:
        _ask_cache.pop(old, None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
