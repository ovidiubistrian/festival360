from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.config import settings
from app.core.db import get_session
from app.core.security import decode_access_token
from app.models import AdminUser, Tenant
from app.services import tenant_service

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=True
)


def tenant_or_404(slug: str, session: Session = Depends(get_session)) -> Tenant:
    tenant = tenant_service.get_tenant(session, slug)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Festivalul '{slug}' nu a fost găsit.",
        )
    return tenant


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> AdminUser:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autentificare invalidă.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise credentials_exc
    user = session.get(AdminUser, payload["sub"])
    if not user or not user.is_active:
        raise credentials_exc
    return user


def get_current_superuser(
    user: AdminUser = Depends(get_current_user),
) -> AdminUser:
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Necesită drepturi de administrator de platformă.",
        )
    return user


def require_tenant_admin(
    slug: str,
    user: AdminUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Tenant:
    """Allow a super-admin to manage any tenant; a tenant admin only their own."""
    tenant = tenant_service.get_tenant(session, slug)
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site inexistent.")
    if not user.is_superuser and user.tenant_id != tenant.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nu ai acces la acest site.",
        )
    return tenant
