"""Per-tenant marketing: SMTP settings, test send, and newsletter campaigns."""

from __future__ import annotations

import re

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.api.deps import require_tenant_admin, tenant_or_404
from app.core.crypto import encrypt_field
from app.core.db import get_session
from app.marketing import email as mail
from app.marketing import invitation
from app.models import NewsletterSubscriber, Tenant, TenantEmailSettings
from app.models.base import new_id, utcnow
from app.schemas.common import CamelModel

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

router = APIRouter(
    prefix="/tenants/{slug}/admin/marketing",
    tags=["marketing"],
    dependencies=[Depends(require_tenant_admin)],
)


# --------------------------------------------------------------------- schemas
class EmailSettingsOut(CamelModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    from_name: str
    from_email: str
    use_tls: bool
    enabled: bool
    has_password: bool
    configured: bool


class EmailSettingsIn(CamelModel):
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    # Optional: when omitted/blank the stored password is kept.
    smtp_password: str | None = None
    from_name: str = ""
    from_email: str = ""
    use_tls: bool = True
    enabled: bool = False


class TestIn(CamelModel):
    to: str


class CampaignIn(CamelModel):
    subject: str
    body: str  # plain text; converted to a simple HTML email
    # "text" = mesajul de mai sus ca atare; "invitation" = șablonul de invitație
    # construit din datele site-ului, cu `body` drept introducere.
    template: str = "text"


class PreviewIn(CamelModel):
    body: str = ""
    template: str = "invitation"


class SubscriberOut(CamelModel):
    id: str
    email: str
    name: str
    date: str | None
    source: str


class ImportRow(CamelModel):
    name: str = ""
    email: str


class ImportIn(CamelModel):
    rows: list[ImportRow]
    source: str = "Import CSV"
    # Completează numele lipsă la abonații care există deja.
    update_names: bool = True


class ImportOut(CamelModel):
    added: int
    updated: int
    duplicates: int
    invalid: int
    # Primele adrese respinse, ca organizatorul să vadă ce a greșit.
    invalid_samples: list[str]


# --------------------------------------------------------------------- helpers
def _newsletter_footer(tenant: Tenant) -> str:
    return (
        f"\n\n—\nAi primit acest email pentru că ești abonat la "
        f"newsletter-ul {tenant.name}."
    )


def _get(session: Session, tenant_id: str) -> TenantEmailSettings | None:
    return session.get(TenantEmailSettings, tenant_id)


def _out(cfg: TenantEmailSettings | None) -> EmailSettingsOut:
    if not cfg:
        return EmailSettingsOut(
            smtp_host="", smtp_port=587, smtp_user="", from_name="",
            from_email="", use_tls=True, enabled=False,
            has_password=False, configured=False,
        )
    return EmailSettingsOut(
        smtp_host=cfg.smtp_host,
        smtp_port=cfg.smtp_port,
        smtp_user=cfg.smtp_user,
        from_name=cfg.from_name,
        from_email=cfg.from_email,
        use_tls=cfg.use_tls,
        enabled=cfg.enabled,
        has_password=bool(cfg.smtp_password_encrypted),
        configured=mail.is_configured(cfg),
    )


# --------------------------------------------------------------------- routes
@router.get("/email-settings", response_model=EmailSettingsOut)
def get_email_settings(
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    return _out(_get(session, tenant.id))


@router.put("/email-settings", response_model=EmailSettingsOut)
def put_email_settings(
    payload: EmailSettingsIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    cfg = _get(session, tenant.id) or TenantEmailSettings(tenant_id=tenant.id)
    cfg.smtp_host = payload.smtp_host.strip()
    cfg.smtp_port = payload.smtp_port or 587
    cfg.smtp_user = payload.smtp_user.strip()
    cfg.from_name = payload.from_name.strip()
    cfg.from_email = payload.from_email.strip()
    cfg.use_tls = payload.use_tls
    cfg.enabled = payload.enabled
    # Only overwrite the password when a new one is provided.
    if payload.smtp_password:
        cfg.smtp_password_encrypted = encrypt_field(payload.smtp_password)
    cfg.updated_at = utcnow()
    session.add(cfg)
    session.commit()
    session.refresh(cfg)
    return _out(cfg)


@router.post("/email-settings/test")
def test_email(
    payload: TestIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
) -> dict:
    cfg = _get(session, tenant.id)
    to = (payload.to or "").strip()
    if not to:
        return {"ok": False, "error": "Adaugă o adresă de email pentru test."}
    try:
        mail.send_one(
            cfg,
            to,
            f"Test — {tenant.name}",
            mail.html_from_plaintext(
                f"Acesta este un email de test de la {tenant.name}.\n\n"
                "Dacă îl vezi, configurarea SMTP funcționează."
            ),
            "Email de test. Configurarea SMTP funcționează.",
        )
        return {"ok": True}
    except mail.EmailNotConfigured as exc:
        return {"ok": False, "error": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": f"Trimiterea a eșuat: {exc}"}


@router.get("/subscribers", response_model=list[SubscriberOut])
def list_subscribers(
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(NewsletterSubscriber)
        .where(NewsletterSubscriber.tenant_id == tenant.id)
        .order_by(NewsletterSubscriber.created_at.desc())  # type: ignore[attr-defined]
    ).all()
    return [
        SubscriberOut(
            id=r.id,
            email=r.email,
            name=r.name,
            date=r.date.isoformat() if r.date else None,
            source=r.source,
        )
        for r in rows
    ]


@router.post("/subscribers/import", response_model=ImportOut)
def import_subscribers(
    payload: ImportIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
):
    """Adaugă abonați dintr-un CSV (nume + email), fără dubluri.

    Adresa e cheia: dacă există deja, rândul nu se adaugă a doua oară — doar îi
    completează numele, dacă lipsea.
    """
    existing = {
        r.email.strip().lower(): r
        for r in session.exec(
            select(NewsletterSubscriber).where(
                NewsletterSubscriber.tenant_id == tenant.id
            )
        ).all()
        if r.email
    }

    added = updated = duplicates = invalid = 0
    invalid_samples: list[str] = []
    seen: set[str] = set()
    today = utcnow().date()

    for row in payload.rows:
        email = (row.email or "").strip().lower()
        name = " ".join((row.name or "").split())
        if not EMAIL_RE.match(email):
            invalid += 1
            if len(invalid_samples) < 5 and (email or name):
                invalid_samples.append(email or name)
            continue
        if email in seen:
            duplicates += 1
            continue
        seen.add(email)

        current = existing.get(email)
        if current:
            duplicates += 1
            if payload.update_names and name and not current.name:
                current.name = name
                session.add(current)
                updated += 1
            continue

        session.add(
            NewsletterSubscriber(
                id=new_id("ns"),
                tenant_id=tenant.id,
                email=email,
                name=name,
                source=(payload.source or "Import CSV").strip() or "Import CSV",
                date=today,
            )
        )
        added += 1

    session.commit()
    return ImportOut(
        added=added,
        updated=updated,
        duplicates=duplicates,
        invalid=invalid,
        invalid_samples=invalid_samples,
    )


@router.post("/preview")
def preview_campaign(
    payload: PreviewIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
) -> dict:
    """HTML-ul campaniei, exact cum îl primește un abonat pe nume „Ana”."""
    if payload.template == "invitation":
        html, _text = invitation.build_invitation(session, tenant, payload.body or "")
    else:
        html = mail.html_from_plaintext(
            (payload.body or "") + _newsletter_footer(tenant)
        )
    return {"html": invitation.personalize(html, "Ana")}


@router.post("/send")
def send_campaign(
    payload: CampaignIn,
    tenant: Tenant = Depends(tenant_or_404),
    session: Session = Depends(get_session),
) -> dict:
    subject = (payload.subject or "").strip()
    body = (payload.body or "").strip()
    if not subject or not body:
        return {"ok": False, "error": "Completează subiectul și mesajul."}

    cfg = _get(session, tenant.id)
    if not mail.is_configured(cfg):
        return {
            "ok": False,
            "error": "SMTP nu este configurat/activat. Vezi tab-ul Configurare.",
        }

    # Câte un destinatar per adresă, cu numele lui (prima apariție câștigă).
    recipients: dict[str, str] = {}
    for row in session.exec(
        select(NewsletterSubscriber).where(
            NewsletterSubscriber.tenant_id == tenant.id
        )
    ).all():
        addr = (row.email or "").strip()
        if addr and addr.lower() not in recipients:
            recipients[addr.lower()] = row.name or ""
    if not recipients:
        return {"ok": False, "error": "Nu ai niciun abonat la newsletter.", "total": 0}

    if payload.template == "invitation":
        html_tpl, text_tpl = invitation.build_invitation(session, tenant, body)
    else:
        footer = _newsletter_footer(tenant)
        html_tpl = mail.html_from_plaintext(body + footer)
        text_tpl = body + footer

    # Personalizarea („Bună, Ana”) se face per destinatar, deci fiecare email
    # are corpul lui — de aici `send_bulk_each` în loc de `send_bulk`.
    messages = [
        (
            addr,
            invitation.personalize(html_tpl, name),
            invitation.personalize(text_tpl, name, html=False),
        )
        for addr, name in recipients.items()
    ]
    try:
        sent, failed, errors = mail.send_bulk_each(cfg, messages, subject)
    except mail.EmailNotConfigured as exc:
        return {"ok": False, "error": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": f"Trimiterea a eșuat: {exc}"}
    return {
        "ok": True,
        "sent": sent,
        "failed": failed,
        "total": len(recipients),
        "errors": errors,
    }
