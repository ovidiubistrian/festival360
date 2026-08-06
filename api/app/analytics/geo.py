"""GeoIP lookup backed by a MaxMind-format .mmdb (DB-IP City Lite compatible).

The reader is opened once and cached in a module global. If the DB file is
missing we cache a sentinel so we don't stat the disk on every request. Every
public function is total: it NEVER raises and returns blanks on any failure.
"""

from __future__ import annotations

import ipaddress
from typing import Any

from app.core.config import settings

# Module-level cache. `_reader` states:
#   None     -> not yet initialised
#   False    -> tried and unavailable (missing DB / import error) — sentinel
#   <Reader> -> an open geoip2 Reader
_reader: Any = None


def _get_reader() -> Any:
    global _reader
    if _reader is not None:
        return _reader or None
    try:
        import geoip2.database  # imported lazily; optional dependency

        _reader = geoip2.database.Reader(settings.GEOIP_DB_PATH)
    except Exception:
        _reader = False  # sentinel: don't retry the disk on every request
    return _reader or None


def _is_private(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True  # unparseable → treat as non-geolocatable
    return (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_reserved
        or addr.is_unspecified
    )


def lookup(ip: str) -> tuple[str, str, str, str]:
    """Return (country_iso, country_name, city, region). All "" on any miss."""
    if not ip or _is_private(ip):
        return "", "", "", ""
    reader = _get_reader()
    if reader is None:
        return "", "", "", ""
    try:
        resp = reader.city(ip)
        country = resp.country.iso_code or ""
        country_name = resp.country.name or ""
        city = resp.city.name or ""
        region = ""
        if resp.subdivisions:
            region = resp.subdivisions.most_specific.name or ""
        return country, country_name, city, region
    except Exception:
        return "", "", "", ""
