"use client";

import * as React from "react";
import {
  Loader2,
  Wallet,
  ShieldCheck,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStripeStatus, setStripeConfig } from "@/lib/admin/platform";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WEBHOOK_URL = "https://api.siteora.ro/api/v1/platform/stripe/webhook";

export default function BillingPage() {
  const [configured, setConfigured] = React.useState(false);
  const [statusLoaded, setStatusLoaded] = React.useState(false);

  const [secretKey, setSecretKey] = React.useState("");
  const [webhookSecret, setWebhookSecret] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Load the Stripe status once on first client render — without a mount effect
  // that sets state directly (repo enforces react-hooks/set-state-in-effect).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [started, setStarted] = React.useState(false);
  if (mounted && !started) {
    setStarted(true);
    void (async () => {
      const status = await getStripeStatus();
      setConfigured(status.configured);
      setStatusLoaded(true);
    })();
  }

  async function refreshStatus() {
    const status = await getStripeStatus();
    setConfigured(status.configured);
    setStatusLoaded(true);
  }

  async function handleSave() {
    setError(null);
    const sk = secretKey.trim();
    const wh = webhookSecret.trim();
    if (!sk || !wh) {
      setError("Completează ambele câmpuri.");
      return;
    }
    setSaving(true);
    const res = await setStripeConfig(sk, wh);
    setSaving(false);
    if (!res.ok) {
      const msg = res.error ?? "Salvarea cheilor Stripe a eșuat.";
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Cheile Stripe au fost salvate. Plățile sunt active.");
    setSecretKey("");
    setWebhookSecret("");
    await refreshStatus();
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      toast.success("Adresă webhook copiată.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nu s-a putut copia adresa.");
    }
  }

  return (
    <AdminShell
      title="Plăți (Stripe)"
      description="Conectează contul Stripe al platformei pentru a încasa abonamente."
    >
      {/* Status card */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <Wallet className="h-4 w-4" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Stripe</p>
              <p className="text-sm text-muted-foreground">
                Starea conexiunii de plată a platformei.
              </p>
            </div>
          </div>
          <div>
            {!statusLoaded ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se verifică…
              </span>
            ) : configured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                <Check className="h-4 w-4" />
                Configurat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                Neconfigurat
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration form */}
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Chei API Stripe
            </h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stripe-secret">Secret key</Label>
            <Input
              id="stripe-secret"
              type="password"
              autoComplete="off"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stripe-webhook">Webhook secret</Label>
            <Input
              id="stripe-webhook"
              type="password"
              autoComplete="off"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_…"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              variant="gold"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Se salvează…" : "Salvează"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook endpoint + notes */}
      <Card className="border-dashed">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              Endpoint webhook
            </p>
            <p className="text-sm text-muted-foreground">
              Înregistrează această adresă în Stripe (Developers → Webhooks)
              pentru a primi confirmările de plată:
            </p>
            <div className="flex items-center gap-2">
              <code
                className={cn(
                  "flex-1 truncate rounded-lg bg-secondary px-3 py-2 text-xs text-foreground"
                )}
              >
                {WEBHOOK_URL}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void copyWebhook()}
                aria-label="Copiază adresa webhook"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiat" : "Copiază"}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p>
                Cheile sunt stocate criptat. Până când Stripe este configurat,
                încercările de upgrade afișează{" "}
                <span className="font-medium text-foreground">
                  „plăți indisponibile”
                </span>
                .
              </p>
              <p className="text-amber-700">
                Acesta este un mediu demonstrativ — nu introduce chei reale
                „live”.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
