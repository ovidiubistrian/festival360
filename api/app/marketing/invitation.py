"""Șablonul de invitație pentru campaniile de email.

Un singur șablon, modern și minimalist, construit din datele tenantului — nimic
nu e scris de mână pentru un festival anume, deci merge la fel pentru toate
site-urile din familia „festival”: numele, perioada, locul, fotografiile din
edițiile trecute, cifrele și ce propunem la ediția care vine vin din baza de
date. Organizatorul scrie doar mesajul de introducere.

HTML de email, nu de web: tabele, stiluri inline, lățime fixă 600px și niciun
`flex`/`grid` — altfel Outlook și Gmail strică aranjarea. Imaginile au URL
absolut (clientul de mail nu are origin-ul site-ului).
"""

from __future__ import annotations

import datetime as dt
from html import escape
from typing import Any

from sqlmodel import Session, select

from app.core.config import settings
from app.models import Article, Exhibitor, FormDefinition, GalleryImage, ProgramEvent, Tenant

# Marcajul pe care organizatorul îl poate folosi în textul de introducere.
NAME_TOKEN = "{{nume}}"
# Ce punem în locul lui când abonatul n-are nume salvat.
NAME_FALLBACK = "prieteni"

_MONTHS = [
    "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
    "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
]


# ------------------------------------------------------------------- helpers
def site_origin(tenant: Tenant) -> str:
    """Originea publică a site-ului — domeniul propriu dacă e verificat."""
    if tenant.custom_domain and tenant.custom_domain_active:
        return f"https://{tenant.custom_domain}"
    return f"https://{settings.PLATFORM_DOMAIN}"


def site_url(tenant: Tenant) -> str:
    """Adresa paginii principale a tenantului."""
    origin = site_origin(tenant)
    if tenant.custom_domain and tenant.custom_domain_active:
        return origin
    return f"{origin}/{tenant.slug}"


def _abs(url: str, origin: str) -> str:
    """URL absolut pentru email: `/media/x.jpg` → `https://site/media/x.jpg`."""
    value = (url or "").strip()
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    if value.startswith("//"):
        return f"https:{value}"
    return f"{origin}/{value.lstrip('/')}"


def format_period(start: dt.date | None, end: dt.date | None) -> str:
    """„12 – 14 septembrie 2026”, comprimat când luna/anul coincid."""
    if not start and not end:
        return ""
    if start and not end:
        return f"{start.day} {_MONTHS[start.month - 1]} {start.year}"
    if end and not start:
        return f"{end.day} {_MONTHS[end.month - 1]} {end.year}"
    assert start and end
    if start == end:
        return f"{start.day} {_MONTHS[start.month - 1]} {start.year}"
    if start.year == end.year and start.month == end.month:
        return f"{start.day} – {end.day} {_MONTHS[start.month - 1]} {start.year}"
    if start.year == end.year:
        return (
            f"{start.day} {_MONTHS[start.month - 1]} – "
            f"{end.day} {_MONTHS[end.month - 1]} {start.year}"
        )
    return (
        f"{start.day} {_MONTHS[start.month - 1]} {start.year} – "
        f"{end.day} {_MONTHS[end.month - 1]} {end.year}"
    )


def _place(tenant: Tenant) -> str:
    return ", ".join(
        p for p in (tenant.location_name, tenant.city, tenant.county) if p
    )


def _clip(text: str, limit: int) -> str:
    value = " ".join((text or "").split())
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip(" ,.;:") + "…"


def _paragraphs(text: str, color: str) -> str:
    blocks = [p.strip() for p in (text or "").split("\n\n") if p.strip()]
    return "".join(
        f'<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:{color};">'
        f'{escape(p).replace(chr(10), "<br>")}</p>'
        for p in blocks
    )


# --------------------------------------------------------------- data lookup
def _stats(session: Session, tenant: Tenant) -> list[tuple[str, str]]:
    """Cifrele de la edițiile trecute: cele din admin, altfel din conținut."""
    picked: list[tuple[str, str]] = []
    for item in tenant.stats or []:
        if not isinstance(item, dict):
            continue
        value = str(item.get("value") or "").strip()
        label = str(item.get("label") or "").strip()
        if value and label:
            picked.append((value, label))
    if picked:
        return picked[:3]

    # Fără cifre completate în admin, numărăm ce există deja în site.
    def count(model: Any) -> int:
        return len(
            session.exec(select(model).where(model.tenant_id == tenant.id)).all()
        )

    fallback = [
        (count(Exhibitor), "expozanți"),
        (count(ProgramEvent), "evenimente în program"),
        (count(GalleryImage), "fotografii din edițiile trecute"),
    ]
    return [(str(n), label) for n, label in fallback if n]


def _gallery(session: Session, tenant: Tenant, origin: str) -> list[tuple[str, str]]:
    """Până la trei fotografii din edițiile trecute (src absolut, alt)."""
    rows = session.exec(
        select(GalleryImage)
        .where(GalleryImage.tenant_id == tenant.id)
        .order_by(GalleryImage.sort_order)  # type: ignore[arg-type]
    ).all()
    out: list[tuple[str, str]] = []
    for row in rows:
        src = _abs(row.src, origin)
        if src:
            out.append((src, row.alt or tenant.name))
        if len(out) == 3:
            break
    return out


def _offer(session: Session, tenant: Tenant, origin: str) -> list[dict[str, str]]:
    """„Ce propunem”: experiențele din admin; altfel programul ediției."""
    items: list[dict[str, str]] = []
    for item in tenant.experiences or []:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        if not title:
            continue
        items.append(
            {
                "title": title,
                "text": _clip(str(item.get("description") or ""), 180),
                "image": _abs(str(item.get("image") or ""), origin),
            }
        )
        if len(items) == 3:
            break
    if items:
        return items

    events = session.exec(
        select(ProgramEvent)
        .where(ProgramEvent.tenant_id == tenant.id)
        .order_by(ProgramEvent.day, ProgramEvent.start_time)  # type: ignore[arg-type]
    ).all()
    for event in events[:3]:
        when = " · ".join(p for p in (event.stage, event.start_time) if p)
        items.append(
            {
                "title": event.title or "",
                "text": _clip(event.description or when, 180),
                "image": "",
            }
        )
    if items:
        return [i for i in items if i["title"]]

    # Ultima plasă: știrile publicate spun și ele ce pregătim.
    articles = session.exec(
        select(Article)
        .where(Article.tenant_id == tenant.id)
        .where(Article.status == "published")
        .order_by(Article.sort_order)  # type: ignore[arg-type]
    ).all()
    return [
        {
            "title": a.title,
            "text": _clip(a.excerpt, 180),
            "image": _abs(a.cover_image, origin),
        }
        for a in articles[:3]
    ]


def _signup_form(session: Session, tenant: Tenant) -> FormDefinition | None:
    """Primul formular publicat — devine butonul „Completează cererea”."""
    return session.exec(
        select(FormDefinition)
        .where(FormDefinition.tenant_id == tenant.id)
        .where(FormDefinition.status == "published")
        .order_by(FormDefinition.sort_order)  # type: ignore[arg-type]
    ).first()


# ------------------------------------------------------------------ template
def _button(label: str, url: str, bg: str, fg: str) -> str:
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:0 auto;"><tr><td align="center" bgcolor="{bg}" '
        f'style="border-radius:999px;">'
        f'<a href="{escape(url)}" style="display:inline-block;padding:14px 30px;'
        f'font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;'
        f'color:{fg};text-decoration:none;letter-spacing:.02em;">{escape(label)}</a>'
        f"</td></tr></table>"
    )


def build_invitation(
    session: Session,
    tenant: Tenant,
    intro: str,
    *,
    cta_label: str = "",
    cta_url: str = "",
) -> tuple[str, str]:
    """Construiește invitația → `(html, text)`, cu `{{nume}}` nerezolvat încă."""
    origin = site_origin(tenant)
    url = site_url(tenant)
    primary = tenant.theme_primary or "#183C32"
    gold = tenant.theme_gold or "#C99A45"
    charcoal = tenant.theme_charcoal or "#202522"
    paper = tenant.theme_background or "#FCFAF6"
    muted = "#6B6F6C"

    period = format_period(tenant.start_date, tenant.end_date)
    place = _place(tenant)
    eyebrow = " · ".join(p for p in (period, place) if p)
    hero = _abs(tenant.hero_image, origin)
    logo = _abs(tenant.logo_image, origin)

    stats = _stats(session, tenant)
    photos = _gallery(session, tenant, origin)
    offer = _offer(session, tenant, origin)

    form = _signup_form(session, tenant)
    if not cta_url:
        cta_url = f"{url}/formular/{form.slug}" if form else url
    if not cta_label:
        cta_label = "Completează cererea de înscriere" if form else "Vezi detaliile"

    head = f"""\
<tr><td style="padding:26px 32px 18px;" align="center">
  {f'<img src="{escape(logo)}" alt="{escape(tenant.name)}" width="132" style="display:block;border:0;max-width:132px;height:auto;margin:0 auto 10px;">' if logo else ''}
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.16em;
              text-transform:uppercase;color:{muted};">
    {escape(tenant.logo_text or tenant.name)}
  </div>
</td></tr>"""

    hero_block = (
        f"""<tr><td style="padding:0;">
  <img src="{escape(hero)}" alt="{escape(tenant.name)}" width="600"
       style="display:block;width:100%;max-width:600px;height:auto;border:0;">
</td></tr>"""
        if hero
        else ""
    )

    title_block = f"""\
<tr><td style="padding:34px 40px 8px;" align="center">
  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;
             line-height:1.2;font-weight:normal;color:{primary};">
    {escape(tenant.name)}
  </h1>
  {f'<p style="margin:12px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:{muted};">{escape(tenant.tagline)}</p>' if tenant.tagline else ''}
  {f'<p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:{gold};">{escape(eyebrow)}</p>' if eyebrow else ''}
</td></tr>"""

    intro_html = _paragraphs(intro, charcoal)
    intro_block = f"""\
<tr><td style="padding:22px 40px 6px;font-family:Helvetica,Arial,sans-serif;">
  <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:{charcoal};">Bună, {NAME_TOKEN},</p>
  {intro_html}
</td></tr>"""

    # Zona „ediții trecute”: fotografii pe un rând + cifrele dedesubt.
    past_photos = ""
    if photos:
        width = 528 // len(photos)
        cells = "".join(
            f'<td width="{width}" style="padding:0 4px;">'
            f'<img src="{escape(src)}" alt="{escape(alt)}" width="{width - 8}" '
            f'style="display:block;width:100%;height:auto;border:0;border-radius:8px;">'
            f"</td>"
            for src, alt in photos
        )
        past_photos = (
            f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
            f'border="0" style="margin:0 0 18px;"><tr>{cells}</tr></table>'
        )

    past_stats = ""
    if stats:
        cells = "".join(
            f'<td align="center" style="padding:0 8px;font-family:Helvetica,Arial,sans-serif;">'
            f'<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:26px;'
            f'color:{primary};">{escape(value)}</div>'
            f'<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;'
            f'color:{muted};padding-top:4px;">{escape(label)}</div></td>'
            for value, label in stats
        )
        past_stats = (
            f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
            f'border="0"><tr>{cells}</tr></table>'
        )

    past_block = ""
    if past_photos or past_stats:
        past_block = f"""\
<tr><td style="padding:12px 36px 6px;">
  <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:12px;
            letter-spacing:.16em;text-transform:uppercase;color:{gold};">Edițiile trecute</p>
  {past_photos}
  {past_stats}
</td></tr>"""

    # Zona „ce propunem”: câte un rând per experiență, cu miniatură la stânga.
    offer_rows = ""
    for item in offer:
        image_cell = (
            f'<td width="132" valign="top" style="padding:0 16px 0 0;">'
            f'<img src="{escape(item["image"])}" alt="" width="132" '
            f'style="display:block;width:132px;height:auto;border:0;border-radius:8px;"></td>'
            if item["image"]
            else ""
        )
        offer_rows += f"""\
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="margin:0 0 18px;"><tr>{image_cell}
  <td valign="top" style="font-family:Helvetica,Arial,sans-serif;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:{primary};">
      {escape(item["title"])}
    </div>
    {f'<div style="font-size:14px;line-height:1.6;color:{muted};padding-top:6px;">{escape(item["text"])}</div>' if item["text"] else ''}
  </td></tr></table>"""

    offer_block = ""
    if offer_rows:
        offer_block = f"""\
<tr><td style="padding:18px 36px 0;">
  <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:12px;
            letter-spacing:.16em;text-transform:uppercase;color:{gold};">Ce propunem anul acesta</p>
  {offer_rows}
</td></tr>"""

    cta_block = f"""\
<tr><td style="padding:16px 40px 34px;" align="center">
  {_button(cta_label, cta_url, primary, "#FFFFFF")}
  <p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:{muted};">
    Sau vezi tot programul pe <a href="{escape(url)}" style="color:{primary};">{escape(url.replace("https://", ""))}</a>
  </p>
</td></tr>"""

    org = tenant.organization or {}
    org_line = " | ".join(
        str(part).strip()
        for part in (
            ", ".join(
                p for p in (org.get("address"), org.get("city"), org.get("county")) if p
            ),
            f"CIF: {org.get('cif')}" if org.get("cif") else "",
            org.get("regCom") or "",
            org.get("email") or tenant.contact_email,
            org.get("phone") or tenant.contact_phone,
        )
        if part and str(part).strip()
    )
    socials = [
        (label, link)
        for label, link in (
            ("Facebook", tenant.social_facebook),
            ("Instagram", tenant.social_instagram),
            ("YouTube", tenant.social_youtube),
        )
        if link
    ]
    social_html = " · ".join(
        f'<a href="{escape(link)}" style="color:{muted};text-decoration:underline;">{label}</a>'
        for label, link in socials
    )

    footer_block = f"""\
<tr><td style="padding:22px 40px 30px;background-color:{paper};
               font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:{muted};"
        align="center">
  {f'<div style="font-weight:bold;color:{charcoal};">{escape(str(org.get("name") or tenant.name))}</div>' if (org.get("name") or tenant.name) else ''}
  {f'<div style="padding-top:4px;">{escape(org_line)}</div>' if org_line else ''}
  {f'<div style="padding-top:8px;">{social_html}</div>' if social_html else ''}
  <div style="padding-top:10px;">
    Primești acest email pentru că ești abonat la newsletterul {escape(tenant.name)}.
  </div>
</td></tr>"""

    preheader = escape(_clip(intro or tenant.short_description or tenant.tagline, 110))
    html = f"""<!doctype html>
<html lang="ro"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(tenant.name)}</title></head>
<body style="margin:0;padding:0;background-color:#EFEDE8;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:#EFEDE8;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
           style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:14px;
                  overflow:hidden;">
      {head}
      {hero_block}
      {title_block}
      {intro_block}
      {past_block}
      {offer_block}
      {cta_block}
      {footer_block}
    </table>
  </td></tr>
</table>
</body></html>"""

    # Varianta text, pentru clienții care nu afișează HTML.
    lines = [f"Bună, {NAME_TOKEN},", ""]
    if intro.strip():
        lines += [intro.strip(), ""]
    lines += [tenant.name]
    if eyebrow:
        lines += [eyebrow]
    if stats:
        lines += [
            "",
            "Edițiile trecute: " + ", ".join(f"{v} {lbl}" for v, lbl in stats),
        ]
    if offer:
        lines += ["", "Ce propunem:"]
        lines += [f"- {i['title']}" + (f" — {i['text']}" if i["text"] else "") for i in offer]
    lines += ["", f"{cta_label}: {cta_url}", "", url]
    if org.get("name") or org_line:
        lines += ["", "—", str(org.get("name") or tenant.name)]
        if org_line:
            lines += [org_line]
    lines += [
        "",
        f"Primești acest email pentru că ești abonat la newsletterul {tenant.name}.",
    ]
    return html, "\n".join(lines)


def personalize(content: str, name: str, *, html: bool = True) -> str:
    """Înlocuiește `{{nume}}` cu numele abonatului (sau o formulă generică).

    `html=False` pentru varianta text a emailului: acolo `&` trebuie să rămână
    `&`, nu `&amp;`.
    """
    value = (name or "").strip() or NAME_FALLBACK
    if html:
        value = escape(value)
    return content.replace(NAME_TOKEN, value).replace("{{name}}", value)
