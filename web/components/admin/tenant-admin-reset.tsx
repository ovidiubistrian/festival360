"use client";

import * as React from "react";
import {
  Loader2,
  KeyRound,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetTenantAdminPassword } from "@/lib/admin/platform";
import { toast } from "sonner";

export interface TenantAdminResetProps {
  slug: string;
  tenantName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResetResult = {
  email: string;
  password: string | null;
  generated: boolean;
};

/** Small copy-to-clipboard button that swaps to a checkmark briefly. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copiat");
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("clipboard write failed", err);
      toast.error("Copierea a eșuat.");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      aria-label={label}
      onClick={() => void copy()}
    >
      {copied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Super-admin action: reset (or generate) a tenant's admin password to recover
 * a locked-out site. A controlled dialog that resets its transient state when it
 * opens (via a render-phase guard, not a mount effect, to respect the repo's
 * set-state-in-effect rule). On success it shows the resulting credentials with
 * copy buttons — the generated password is only shown once.
 */
export function TenantAdminReset({
  slug,
  tenantName,
  open,
  onOpenChange,
}: TenantAdminResetProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ResetResult | null>(null);

  // Reset transient state whenever the dialog opens (or switches tenant),
  // driven from render behind a guard rather than a mount effect.
  const [openedSlug, setOpenedSlug] = React.useState<string | null>(null);
  if (open && slug && openedSlug !== slug) {
    setOpenedSlug(slug);
    setEmail("");
    setPassword("");
    setError(null);
    setResult(null);
  } else if (!open && openedSlug !== null) {
    setOpenedSlug(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const input: { email?: string; password?: string } = {};
    if (email.trim()) input.email = email.trim();
    if (password.trim()) input.password = password.trim();
    const res = await resetTenantAdminPassword(slug, input);
    setSubmitting(false);
    if (!res.ok) {
      const msg = res.error ?? "Resetarea parolei a eșuat.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setResult({
      email: res.email ?? email.trim(),
      password: res.password ?? null,
      generated: res.generated ?? false,
    });
    toast.success("Parola adminului a fost resetată.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary [&_svg]:size-4">
              <KeyRound />
            </span>
            Resetează parola admin
          </DialogTitle>
          <DialogDescription>
            Recuperează accesul pentru administratorul site-ului{" "}
            <span className="font-medium text-foreground">{tenantName}</span>.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          /* ---------- State: credentials issued ---------- */
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Email
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-foreground">
                    {result.email}
                  </code>
                  <CopyButton value={result.email} label="Copiază emailul" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Parolă
                </p>
                {result.password ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-foreground">
                      {result.password}
                    </code>
                    <CopyButton
                      value={result.password}
                      label="Copiază parola"
                    />
                  </div>
                ) : (
                  <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                    Parola aleasă de tine a fost setată (nu este afișată).
                  </p>
                )}
              </div>
            </div>

            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
              Trimite-le adminului site-ului; parola nu mai poate fi văzută după
              ce închizi.
            </p>

            <div className="flex justify-end border-t border-border pt-4">
              <Button variant="gold" onClick={() => onOpenChange(false)}>
                Am notat, închide
              </Button>
            </div>
          </div>
        ) : (
          /* ---------- State: form ---------- */
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email admin (opțional)</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`admin@${slug}`}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Lasă gol pentru a folosi adminul existent al site-ului.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-password">Parolă nouă (opțional)</Label>
              <Input
                id="reset-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lasă gol pentru a genera una sigură"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Dacă o lași goală, generăm o parolă puternică și ți-o arătăm o
                singură dată.
              </p>
            </div>

            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end border-t border-border pt-4">
              <Button
                variant="gold"
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {submitting ? "Se resetează…" : "Resetează / Generează"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
