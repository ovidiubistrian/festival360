"""Reset a SINGLE tenant to a clean slate — keep the site shell, wipe its content.

Unlike `app.db.seed --force` (which wipes and reseeds EVERY tenant), this only
touches the one slug you pass. The Tenant row, its theme/preset, admin accounts
and subscription are preserved; all content (accommodations, exhibitors,
products, destinations, program, partners, gallery, articles, messages,
newsletter, uploaded media, traffic) is deleted so you can build the site for
real from the admin panel.

Usage (from the api/ dir or inside the api container):
    python -m app.scripts.reset_tenant --slug poiana-marului
    python -m app.scripts.reset_tenant --slug poiana-marului --reset-branding

Options:
    --reset-branding  Also blank the hero image/badge, tagline and descriptions
                      (keeps the name + theme colors) so Settings starts empty.
    --yes             Skip the interactive confirmation prompt.
"""

from __future__ import annotations

import argparse
import sys

from sqlmodel import Session, select

from app.core.db import engine
from app.models import (
    Accommodation,
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    GalleryImage,
    MediaAsset,
    NewsletterSubscriber,
    PageView,
    Partner,
    Product,
    ProgramEvent,
    Tenant,
)

# Delete order: children before parents (Product references Exhibitor).
_CONTENT_MODELS = (
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
)


def reset_tenant(slug: str, *, reset_branding: bool) -> dict[str, int]:
    counts: dict[str, int] = {}
    with Session(engine) as session:
        tenant = session.get(Tenant, slug)
        if not tenant:
            raise SystemExit(f"Tenant '{slug}' not found.")

        for model in _CONTENT_MODELS:
            rows = session.exec(
                select(model).where(model.tenant_id == slug)  # type: ignore[attr-defined]
            ).all()
            for r in rows:
                session.delete(r)
            counts[model.__name__] = len(rows)

        if reset_branding:
            tenant.tagline = ""
            tenant.short_description = ""
            tenant.long_description = ""
            tenant.hero_image = ""
            tenant.hero_badge = ""
            session.add(tenant)

        session.commit()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset one tenant to a clean slate")
    parser.add_argument("--slug", required=True, help="Tenant slug, e.g. poiana-marului")
    parser.add_argument(
        "--reset-branding",
        action="store_true",
        help="Also blank hero/tagline/descriptions (keeps name + theme).",
    )
    parser.add_argument("--yes", action="store_true", help="Skip confirmation.")
    args = parser.parse_args()

    if not args.yes:
        print(
            f"This will DELETE all content of tenant '{args.slug}' "
            f"(keeping the site, theme and admin access)."
        )
        if args.reset_branding:
            print("It will ALSO blank the hero/tagline/descriptions.")
        reply = input("Type the slug again to confirm: ").strip()
        if reply != args.slug:
            print("Aborted.")
            sys.exit(1)

    counts = reset_tenant(args.slug, reset_branding=args.reset_branding)
    total = sum(counts.values())
    print(f"Reset '{args.slug}' — deleted {total} content rows:")
    for name, n in counts.items():
        if n:
            print(f"  {name}: {n}")
    print("Done. The site is now empty and ready to configure from the admin panel.")


if __name__ == "__main__":
    main()
