"""Dependency-free User-Agent parsing + bot detection.

Deliberately small and heuristic — good enough for coarse traffic breakdowns
without pulling a heavy UA-parsing dependency.
"""

from __future__ import annotations

import re

_BOT_RE = re.compile(
    r"bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|"
    r"python-requests|curl|wget|monitor|pingdom|uptime",
    re.IGNORECASE,
)


def parse_ua(ua: str) -> tuple[str, str, str]:
    """Return (device, browser, os) from a raw User-Agent string."""
    ua = ua or ""

    # --- device ---
    if re.search(r"iPad|Tablet", ua, re.IGNORECASE):
        device = "tablet"
    elif re.search(r"Mobile|Android|iPhone", ua, re.IGNORECASE):
        device = "mobile"
    else:
        device = "desktop"

    # --- browser (order matters: Edge/Opera masquerade as Chrome) ---
    if "Edg" in ua:
        browser = "Edge"
    elif "OPR" in ua or "Opera" in ua:
        browser = "Opera"
    elif "Chrome" in ua:
        browser = "Chrome"
    elif "Firefox" in ua:
        browser = "Firefox"
    elif "Safari" in ua:
        browser = "Safari"
    else:
        browser = "Other"

    # --- os --- (iPhone/iPad carry "Mac OS X", so match desktop via "Macintosh")
    if "Windows" in ua:
        os_name = "Windows"
    elif "Macintosh" in ua:
        os_name = "Mac OS"
    elif "Android" in ua:
        os_name = "Android"
    elif re.search(r"iPhone|iPad|iPod|iOS", ua):
        os_name = "iOS"
    elif "Linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Other"

    return device, browser, os_name


def is_bot(ua: str) -> bool:
    """True for empty UAs and anything that looks like a bot/monitor/script."""
    if not ua:
        return True
    return bool(_BOT_RE.search(ua))
