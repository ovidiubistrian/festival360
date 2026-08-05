"""Create (or update) a platform super-admin account.

Run inside the API container after deploy, e.g.:

    docker compose -f docker-compose.prod.yml exec api \
        python -m app.scripts.create_superadmin --email you@siteora.ro --name "Nume"

If --password is omitted you'll be prompted (input hidden). Idempotent: an
existing account with the same email has its password/role refreshed.
"""

from __future__ import annotations

import argparse
import getpass
import os
import sys

from sqlmodel import Session, select

from app.core.db import engine
from app.core.security import hash_password
from app.models import AdminUser
from app.models.base import new_id


def create_superadmin(email: str, password: str, full_name: str = "") -> str:
    email = email.strip().lower()
    if not email or "@" not in email:
        raise SystemExit("Email invalid.")
    if len(password) < 8:
        raise SystemExit("Parola trebuie să aibă minimum 8 caractere.")

    with Session(engine) as session:
        user = session.exec(
            select(AdminUser).where(AdminUser.email == email)
        ).first()
        if user is None:
            user = AdminUser(id=new_id("admin"), email=email)
            action = "creat"
        else:
            action = "actualizat"
        user.hashed_password = hash_password(password)
        user.full_name = full_name or user.full_name
        user.tenant_id = None
        user.is_superuser = True
        user.is_active = True
        session.add(user)
        session.commit()
    return action


def main() -> None:
    parser = argparse.ArgumentParser(description="Creează un super-admin Siteora")
    parser.add_argument("--email", default=os.getenv("SUPERADMIN_EMAIL"))
    parser.add_argument("--password", default=os.getenv("SUPERADMIN_PASSWORD"))
    parser.add_argument("--name", default=os.getenv("SUPERADMIN_NAME", ""))
    args = parser.parse_args()

    email = args.email or input("Email super-admin: ").strip()
    password = args.password
    if not password:
        password = getpass.getpass("Parolă: ")
        confirm = getpass.getpass("Confirmă parola: ")
        if password != confirm:
            raise SystemExit("Parolele nu coincid.")

    action = create_superadmin(email, password, args.name)
    print(f"Super-admin {action}: {email.strip().lower()}")


if __name__ == "__main__":
    sys.exit(main())
