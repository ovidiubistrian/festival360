"""Per-tenant SMTP email sending for the marketing module.

Sends are synchronous (fine for the small opted-in newsletter lists this serves).
Passwords are decrypted only in-memory at send time.
"""

from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

from app.core.crypto import decrypt_field
from app.models import TenantEmailSettings


class EmailNotConfigured(Exception):
    """Raised when the tenant has no usable SMTP configuration."""


def is_configured(cfg: TenantEmailSettings | None) -> bool:
    return bool(
        cfg
        and cfg.enabled
        and cfg.smtp_host
        and cfg.from_email
        and cfg.smtp_password_encrypted
    )


def _connect(cfg: TenantEmailSettings) -> smtplib.SMTP:
    password = decrypt_field(cfg.smtp_password_encrypted) or ""
    port = cfg.smtp_port or (465 if not cfg.use_tls else 587)
    if not cfg.use_tls and port == 465:
        # Implicit SSL (port 465).
        server: smtplib.SMTP = smtplib.SMTP_SSL(
            cfg.smtp_host, port, timeout=20, context=ssl.create_default_context()
        )
    else:
        server = smtplib.SMTP(cfg.smtp_host, port, timeout=20)
        server.ehlo()
        if cfg.use_tls:
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
    if cfg.smtp_user:
        server.login(cfg.smtp_user, password)
    return server


def _build_message(
    cfg: TenantEmailSettings, to_email: str, subject: str, html: str, text: str
) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((cfg.from_name or cfg.from_email, cfg.from_email))
    msg["To"] = to_email
    msg.set_content(text or "")
    msg.add_alternative(html, subtype="html")
    return msg


def send_one(
    cfg: TenantEmailSettings, to_email: str, subject: str, html: str, text: str = ""
) -> None:
    """Send a single email. Raises on failure."""
    if not is_configured(cfg):
        raise EmailNotConfigured("SMTP nu este configurat sau activat.")
    with _connect(cfg) as server:
        server.send_message(_build_message(cfg, to_email, subject, html, text))


def send_bulk(
    cfg: TenantEmailSettings,
    recipients: list[str],
    subject: str,
    html: str,
    text: str = "",
) -> tuple[int, int, list[str]]:
    """Send to many recipients over one connection.

    Returns (sent, failed, errors[]). One connection is reused; a per-recipient
    failure is counted but does not abort the run.
    """
    if not is_configured(cfg):
        raise EmailNotConfigured("SMTP nu este configurat sau activat.")
    sent = failed = 0
    errors: list[str] = []
    with _connect(cfg) as server:
        for to_email in recipients:
            addr = (to_email or "").strip()
            if not addr:
                continue
            try:
                server.send_message(
                    _build_message(cfg, addr, subject, html, text)
                )
                sent += 1
            except Exception as exc:  # noqa: BLE001 — record & continue
                failed += 1
                if len(errors) < 10:
                    errors.append(f"{addr}: {exc}")
    return sent, failed, errors


def html_from_plaintext(body: str) -> str:
    """Very small plaintext → HTML (paragraphs + line breaks), escaped."""
    from html import escape

    paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
    blocks = "".join(
        f"<p>{escape(p).replace(chr(10), '<br>')}</p>" for p in paragraphs
    )
    return (
        '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;'
        'line-height:1.6;color:#202522">' + blocks + "</div>"
    )
