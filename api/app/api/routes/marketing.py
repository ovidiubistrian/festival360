"""Per-tenant marketing: SMTP settings, test send, and newsletter campaigns."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.api.deps import require_tenant_admin, tenant_or_404
from app.core.crypto import encrypt_field
from app.core.db import get_session
from app.marketing import email as mail
from app.models import NewsletterSubscriber, Tenant, TenantEmailSettings
from app.models.base import utcnow
from app.schemas.common import CamelModel

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


class SubscriberOut(CamelModel):
    id: str
    email: str
    date: str | None
    source: str


# --------------------------------------------------------------------- helpers
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
            date=r.date.isoformat() if r.date else None,
            source=r.source,
        )
        for r in rows
    ]


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

    emails = [
        r.email.strip()
        for r in session.exec(
            select(NewsletterSubscriber).where(
                NewsletterSubscriber.tenant_id == tenant.id
            )
        ).all()
        if r.email and r.email.strip()
    ]
    # De-duplicate while preserving order.
    recipients = list(dict.fromkeys(emails))
    if not recipients:
        return {"ok": False, "error": "Nu ai niciun abonat la newsletter.", "total": 0}

    footer = (
        f"\n\n—\nAi primit acest email pentru că ești abonat la "
        f"newsletter-ul {tenant.name}."
    )
    html = mail.html_from_plaintext(body + footer)
    try:
        sent, failed, errors = mail.send_bulk(
            cfg, recipients, subject, html, body + footer
        )
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
