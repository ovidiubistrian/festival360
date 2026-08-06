"""Download the DB-IP City Lite GeoIP database (free, CC-BY, no account).

DB-IP publishes a fresh MaxMind-format .mmdb every month at:

    https://download.db-ip.com/free/dbip-city-lite-{YYYY-MM}.mmdb.gz

We try the current month first and fall back up to two months back (the newest
build is sometimes published a few days into the month). The gzip is streamed to
`settings.GEOIP_DB_PATH` (parent dirs created). Existing, recent files are kept.

Best-effort by design: exits 0 even on network failure so a container build /
entrypoint never fails just because the mirror is unreachable. Pass `--strict`
to exit non-zero on failure instead. Stdlib only.
"""

from __future__ import annotations

import datetime as dt
import gzip
import os
import shutil
import sys
import tempfile
import urllib.error
import urllib.request

# Import settings if available; fall back to the documented default path so the
# script is runnable in a minimal environment (e.g. a build stage).
try:
    from app.core.config import settings

    DEST_PATH = settings.GEOIP_DB_PATH
except Exception:  # pragma: no cover - defensive fallback
    DEST_PATH = os.environ.get("GEOIP_DB_PATH", "data/geoip/dbip-city-lite.mmdb")

BASE_URL = "https://download.db-ip.com/free/dbip-city-lite-{ym}.mmdb.gz"
MAX_MONTHS_BACK = 2
FRESH_DAYS = 40


def _log(msg: str) -> None:
    print(f"[download_geoip] {msg}", flush=True)


def _month_str(d: dt.date) -> str:
    return d.strftime("%Y-%m")


def _candidate_months() -> list[str]:
    today = dt.date.today()
    months: list[str] = []
    y, m = today.year, today.month
    for _ in range(MAX_MONTHS_BACK + 1):
        months.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return months


def _is_fresh(path: str) -> bool:
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return False
    age_days = (dt.datetime.now().timestamp() - mtime) / 86400
    return age_days < FRESH_DAYS


def _download_and_extract(url: str, dest: str) -> bool:
    """Stream `url` (gzip) and gunzip to `dest`. Return True on success."""
    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    tmp_gz = None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "siteora-geoip/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:  # noqa: S310
            with tempfile.NamedTemporaryFile(delete=False, suffix=".gz") as tf:
                tmp_gz = tf.name
                shutil.copyfileobj(resp, tf)
        # gunzip to a temp file next to dest, then atomically move into place.
        tmp_out = dest + ".tmp"
        with gzip.open(tmp_gz, "rb") as f_in, open(tmp_out, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)
        os.replace(tmp_out, dest)
        return True
    except urllib.error.HTTPError as e:
        _log(f"HTTP {e.code} for {url}")
        return False
    except Exception as e:  # network / IO errors
        _log(f"failed {url}: {e}")
        return False
    finally:
        if tmp_gz and os.path.exists(tmp_gz):
            try:
                os.remove(tmp_gz)
            except OSError:
                pass


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    strict = "--strict" in argv

    if os.path.exists(DEST_PATH) and _is_fresh(DEST_PATH):
        _log(f"{DEST_PATH} exists and is fresh (< {FRESH_DAYS} days); skipping.")
        return 0

    for ym in _candidate_months():
        url = BASE_URL.format(ym=ym)
        _log(f"trying {url}")
        if _download_and_extract(url, DEST_PATH):
            size = os.path.getsize(DEST_PATH)
            _log(f"saved {DEST_PATH} ({size / 1_000_000:.1f} MB) from {ym}")
            return 0

    _log("could not download any DB-IP City Lite build (tried current + 2 prior months).")
    if strict:
        _log("--strict set: exiting non-zero.")
        return 1
    _log("best-effort mode: exiting 0. Geolocation will be disabled until the DB exists.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
