"""Payment gateway abstraction. Stripe uses Hosted Checkout with INLINE
price_data (no Stripe Product/Price catalog); the link to our internal order is
`order_ref` + session metadata. A second provider can be added behind the same
shape without touching callers.
"""

from __future__ import annotations

from typing import Any

import stripe

# Canonical event types (provider-agnostic).
EVENT_COMPLETED = "checkout.completed"
EVENT_EXPIRED = "checkout.expired"
EVENT_FAILED = "checkout.failed"

_STRIPE_EVENT_MAP = {
    "checkout.session.completed": EVENT_COMPLETED,
    "checkout.session.async_payment_succeeded": EVENT_COMPLETED,
    "checkout.session.expired": EVENT_EXPIRED,
    "payment_intent.payment_failed": EVENT_FAILED,
}


class StripeGateway:
    def __init__(self, secret_key: str, webhook_secret: str) -> None:
        self._client = stripe.StripeClient(secret_key)
        self._webhook_secret = webhook_secret

    def create_checkout_session(
        self,
        *,
        amount_minor: int,
        currency: str,
        description: str,
        success_url: str,
        cancel_url: str,
        order_ref: str,
        metadata: dict[str, str],
    ) -> tuple[str, str]:
        """Return (session_id, checkout_url)."""
        session = self._client.checkout.sessions.create(
            params={
                "mode": "payment",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "client_reference_id": order_ref,
                "metadata": {**metadata, "order_ref": order_ref},
                "line_items": [
                    {
                        "quantity": 1,
                        "price_data": {
                            "currency": currency.lower(),
                            "unit_amount": amount_minor,
                            "product_data": {"name": description},
                        },
                    }
                ],
            }
        )
        return session.id, session.url or ""

    def verify_webhook(self, payload: bytes, signature: str) -> dict[str, Any] | None:
        """Verify the Stripe signature and return a canonical event, or None."""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self._webhook_secret
            )
        except (ValueError, stripe.SignatureVerificationError):
            return None
        canonical = _STRIPE_EVENT_MAP.get(event["type"])
        if not canonical:
            return {"type": None, "raw_type": event["type"]}
        obj = event["data"]["object"]
        return {
            "type": canonical,
            "raw_type": event["type"],
            "session_id": obj.get("id"),
            "order_ref": (obj.get("metadata") or {}).get("order_ref"),
            "metadata": obj.get("metadata") or {},
        }
