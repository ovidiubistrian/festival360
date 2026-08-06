"""Attach a custom domain to a tenant (and activate it) without the DNS-TXT dance.

Use this when you control the domain and have already pointed its DNS A record at
the VPS. Caddy then issues the TLS cert on-demand on first visit (the check-domain
ask endpoint returns True once the domain is set + active).

    python -m app.scripts.set_domain --slug poiana-marului --domain poianamarului.info

Options:
    --inactive   Set the domain but leave it inactive (use the admin Verify flow).
    --remove     Detach the custom domain from the tenant.
"""

from __future__ import annotations

import argparse

from sqlmodel import Session, select

from app.core.db import engine
from app.models import Tenant
from app.models.base import utcnow


def _norm(host: str) -> str:
    host = (host or "").strip().lower().rstrip(".")
    for prefix in ("https://", "http://"):
        if host.startswith(prefix):
            host = host[len(prefix):]
    return host.split("/")[0]


def main() -> None:
    parser = argparse.ArgumentParser(description="Set a tenant custom domain")
    parser.add_argument("--slug", required=True)
    parser.add_argument("--domain", default="")
    parser.add_argument("--inactive", action="store_true")
    parser.add_argument("--remove", action="store_true")
    args = parser.parse_args()

    with Session(engine) as session:
        tenant = session.get(Tenant, args.slug)
        if not tenant:
            raise SystemExit(f"Tenant '{args.slug}' inexistent.")

        if args.remove:
            tenant.custom_domain = None
            tenant.custom_domain_active = False
            tenant.updated_at = utcnow()
            session.add(tenant)
            session.commit()
            print(f"Domeniu detașat de la '{args.slug}'.")
            return

        domain = _norm(args.domain)
        if not domain:
            raise SystemExit("--domain este obligatoriu (ex: poianamarului.info).")

        # Ensure no other tenant already uses this domain.
        clash = session.exec(
            select(Tenant)
            .where(Tenant.custom_domain == domain)
            .where(Tenant.id != tenant.id)
        ).first()
        if clash:
            raise SystemExit(
                f"Domeniul '{domain}' este deja folosit de tenantul '{clash.id}'."
            )

        tenant.custom_domain = domain
        tenant.custom_domain_active = not args.inactive
        tenant.updated_at = utcnow()
        session.add(tenant)
        session.commit()
        state = "ACTIV" if tenant.custom_domain_active else "inactiv"
        print(f"'{args.slug}' → {domain} ({state}).")
        print(
            "Asigură-te că DNS-ul A al domeniului arată spre IP-ul VPS-ului. "
            "Caddy va emite certificatul TLS la prima accesare pe https://" + domain
        )


if __name__ == "__main__":
    main()
