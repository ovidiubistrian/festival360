"""Client-IP extraction and daily-rotating visitor hashing.

The raw IP is NEVER stored — only `visitor_hash`, which mixes a per-day salt so
that hashes rotate every 24h and uniques are per-day by construction.
"""

from __future__ import annotations

import datetime as dt
import hashlib
from typing import Any
from urllib.parse import urlsplit

from app.core.config import settings


def client_ip(request: Any) -> str:
    """Best client IP: first XFF entry, else X-Real-IP, else socket peer."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        first = xff.split(",")[0].strip()
        if first:
            return first
    real = request.headers.get("x-real-ip", "")
    if real:
        return real.strip()
    client = getattr(request, "client", None)
    return getattr(client, "host", "") or ""


def daily_salt() -> str:
    return hashlib.sha256(
        f"{settings.SECRET_KEY}|{dt.date.today().isoformat()}".encode()
    ).hexdigest()


def visitor_hash(ip: str, ua: str, slug: str) -> str:
    """16-hex daily-rotating fingerprint; never reversible to the raw IP."""
    raw = f"{daily_salt()}|{ip}|{ua}|{slug}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def referrer_host(referrer: str, *internal_hosts: str) -> str:
    """Bare host of a referrer URL, "" for direct/internal. Strips leading www."""
    if not referrer:
        return ""
    try:
        host = urlsplit(referrer).hostname or ""
    except Exception:
        return ""
    if not host:
        return ""
    host = host.lower()
    if host.startswith("www."):
        host = host[4:]
    internal = {h.lower().removeprefix("www.") for h in internal_hosts if h}
    if host in internal:
        return ""
    return host
