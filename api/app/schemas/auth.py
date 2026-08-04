from __future__ import annotations

from app.schemas.common import CamelModel


class LoginIn(CamelModel):
    email: str
    password: str


class UserOut(CamelModel):
    id: str
    email: str
    full_name: str
    tenant_id: str | None
    is_superuser: bool


class TokenOut(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
