"""Form definitions + submissions: listing, validation and answer snapshots.

The organiser builds a form from the admin (JSON field list); the public site
posts a `{fieldId: value}` map back. Everything a submission needs to stay
readable — labels, chosen option labels, prices — is resolved here, against the
definition as it looked at submit time.
"""

from __future__ import annotations

import re
from typing import Any

from sqlmodel import Session, select

from app.models import FormDefinition, FormSubmission

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# Field types that carry no answer — they only structure the page.
LAYOUT_TYPES = {"section", "info"}
# Field types whose value is a list of picked options.
MULTI_TYPES = {"checkboxGroup"}
# Field types whose value must match one of the declared options.
CHOICE_TYPES = {"select", "radio"}


class ValidationError(Exception):
    """Raised when a submission doesn't satisfy the form definition."""


def forms_for(session: Session, tenant_id: str) -> list[FormDefinition]:
    return list(
        session.exec(
            select(FormDefinition)
            .where(FormDefinition.tenant_id == tenant_id)
            .order_by(FormDefinition.sort_order)
        ).all()
    )


def published_forms_for(session: Session, tenant_id: str) -> list[FormDefinition]:
    return [f for f in forms_for(session, tenant_id) if f.status == "published"]


def form_by_slug(
    session: Session, tenant_id: str, slug: str
) -> FormDefinition | None:
    return session.exec(
        select(FormDefinition)
        .where(FormDefinition.tenant_id == tenant_id)
        .where(FormDefinition.slug == slug)
    ).first()


def submissions_for(
    session: Session, tenant_id: str, form_id: str | None = None
) -> list[FormSubmission]:
    query = select(FormSubmission).where(FormSubmission.tenant_id == tenant_id)
    if form_id:
        query = query.where(FormSubmission.form_id == form_id)
    return list(
        session.exec(
            query.order_by(FormSubmission.created_at.desc())  # type: ignore[union-attr]
        ).all()
    )


def submission_counts(session: Session, tenant_id: str) -> dict[str, tuple[int, int]]:
    """`form_id → (total, unread)` for the whole tenant, in one query."""
    counts: dict[str, tuple[int, int]] = {}
    for sub in submissions_for(session, tenant_id):
        total, unread = counts.get(sub.form_id, (0, 0))
        counts[sub.form_id] = (total + 1, unread + (0 if sub.read else 1))
    return counts


def _option_label(option: dict[str, Any]) -> str:
    return str(option.get("label") or option.get("value") or "").strip()


def _price(option: dict[str, Any]) -> float:
    try:
        return float(option.get("price") or 0)
    except (TypeError, ValueError):
        return 0.0


def _display(value: Any) -> str:
    if isinstance(value, bool):
        return "Da" if value else "Nu"
    if isinstance(value, list):
        return ", ".join(str(v).strip() for v in value if str(v).strip())
    return str(value if value is not None else "").strip()


def build_answers(
    form: FormDefinition, values: dict[str, Any]
) -> tuple[list[dict[str, Any]], float, str, str]:
    """Validate `values` against the form and snapshot them.

    Returns `(answers, total, summary, email)`. Raises `ValidationError` with a
    Romanian message listing every problem, so the visitor fixes them at once.
    """
    answers: list[dict[str, Any]] = []
    errors: list[str] = []
    total = 0.0
    summary = ""
    email = ""

    for field in form.fields or []:
        ftype = str(field.get("type") or "text")
        if ftype in LAYOUT_TYPES:
            continue
        fid = str(field.get("id") or "")
        label = str(field.get("label") or "").strip() or fid
        required = bool(field.get("required"))
        options = [o for o in (field.get("options") or []) if isinstance(o, dict)]
        raw = values.get(fid)

        if ftype in MULTI_TYPES:
            picked = [str(v).strip() for v in (raw or []) if str(v).strip()] \
                if isinstance(raw, list) else []
            allowed = {_option_label(o) for o in options}
            unknown = [p for p in picked if p not in allowed]
            if unknown:
                errors.append(f"„{label}”: opțiune necunoscută ({unknown[0]}).")
                picked = [p for p in picked if p in allowed]
            if required and not picked:
                errors.append(f"„{label}” este obligatoriu.")
            for option in options:
                if _option_label(option) in picked:
                    total += _price(option)
            value_text = ", ".join(picked)
        elif ftype in CHOICE_TYPES:
            value_text = _display(raw)
            allowed = {_option_label(o) for o in options}
            if value_text and value_text not in allowed:
                errors.append(f"„{label}”: opțiune necunoscută.")
                value_text = ""
            if required and not value_text:
                errors.append(f"„{label}” este obligatoriu.")
            for option in options:
                if _option_label(option) == value_text:
                    total += _price(option)
        elif ftype == "checkbox":
            checked = bool(raw)
            if required and not checked:
                errors.append(f"„{label}” trebuie bifat.")
            value_text = _display(checked)
        else:
            value_text = _display(raw)
            if required and not value_text:
                errors.append(f"„{label}” este obligatoriu.")
            if ftype == "email" and value_text and not EMAIL_RE.match(value_text):
                errors.append(f"„{label}”: adresa de email nu pare validă.")

        answers.append(
            {"id": fid, "label": label, "type": ftype, "value": value_text}
        )
        if ftype == "email" and value_text and not email:
            email = value_text
        if not summary and ftype in {"text", "textarea"} and value_text:
            summary = value_text[:120]

    if errors:
        raise ValidationError(" ".join(errors))

    return answers, total, summary, email


def notification_body(form: FormDefinition, sub: FormSubmission) -> str:
    """Plain-text email body for a new submission."""
    lines = [f"Cerere nouă prin formularul „{form.title}”.", ""]
    for answer in sub.answers:
        lines.append(f"{answer.get('label')}: {answer.get('value') or '—'}")
    if sub.total:
        lines += ["", f"Total estimat: {sub.total:g} lei"]
    return "\n".join(lines)
