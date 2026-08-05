from __future__ import annotations

import datetime as dt

from sqlmodel import Session

from app.core.crypto import decrypt_field, encrypt_field
from app.models import PlatformSetting

# Setting keys.
STRIPE_SECRET_KEY = "stripe.secret_key"
STRIPE_WEBHOOK_SECRET = "stripe.webhook_secret"


def set_setting(session: Session, key: str, value: str) -> None:
    row = session.get(PlatformSetting, key)
    enc = encrypt_field(value)
    if row is None:
        row = PlatformSetting(key=key, value_encrypted=enc)
    else:
        row.value_encrypted = enc
        row.updated_at = dt.datetime.now(dt.timezone.utc)
    session.add(row)
    session.commit()


def get_setting(session: Session, key: str) -> str | None:
    row = session.get(PlatformSetting, key)
    if not row or not row.value_encrypted:
        return None
    return decrypt_field(row.value_encrypted)


def stripe_config(session: Session) -> tuple[str, str] | None:
    """(secret_key, webhook_secret) or None if not fully configured."""
    sk = get_setting(session, STRIPE_SECRET_KEY)
    ws = get_setting(session, STRIPE_WEBHOOK_SECRET)
    if sk and ws:
        return sk, ws
    return None


def is_stripe_configured(session: Session) -> bool:
    return stripe_config(session) is not None
