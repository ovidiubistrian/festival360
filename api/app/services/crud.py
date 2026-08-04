from __future__ import annotations

from typing import Any, TypeVar

from sqlalchemy import func
from sqlmodel import Session, select

from app.models.base import new_id, utcnow

T = TypeVar("T")


def get_owned(session: Session, model: type[T], item_id: str, tenant_id: str) -> T | None:
    obj = session.get(model, item_id)
    if obj is not None and getattr(obj, "tenant_id", None) == tenant_id:
        return obj
    return None


def create(
    session: Session, model: type[T], kwargs: dict[str, Any], id_prefix: str
) -> T:
    tenant_id = kwargs["tenant_id"]
    max_order = session.exec(
        select(func.max(model.sort_order)).where(  # type: ignore[attr-defined]
            model.tenant_id == tenant_id  # type: ignore[attr-defined]
        )
    ).one()
    next_order = (max_order or 0) + 1
    obj = model(id=new_id(id_prefix), sort_order=next_order, **kwargs)  # type: ignore[call-arg]
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def update(session: Session, obj: Any, kwargs: dict[str, Any]) -> Any:
    kwargs = {k: v for k, v in kwargs.items() if k != "tenant_id"}
    for k, v in kwargs.items():
        setattr(obj, k, v)
    if hasattr(obj, "updated_at"):
        obj.updated_at = utcnow()
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def delete(session: Session, obj: Any) -> None:
    session.delete(obj)
    session.commit()


def toggle_status(session: Session, obj: Any) -> Any:
    obj.status = "draft" if obj.status == "published" else "published"
    if hasattr(obj, "updated_at"):
        obj.updated_at = utcnow()
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def move(
    session: Session, model: type[Any], tenant_id: str, item_id: str, direction: int
) -> bool:
    """Swap sort_order with the neighbour in the given direction (-1 up, 1 down)."""
    items = list(
        session.exec(
            select(model)
            .where(model.tenant_id == tenant_id)  # type: ignore[attr-defined]
            .order_by(model.sort_order)  # type: ignore[attr-defined]
        ).all()
    )
    idx = next((i for i, x in enumerate(items) if x.id == item_id), -1)
    target = idx + direction
    if idx < 0 or target < 0 or target >= len(items):
        return False
    a, b = items[idx], items[target]
    a.sort_order, b.sort_order = b.sort_order, a.sort_order
    session.add(a)
    session.add(b)
    session.commit()
    return True
