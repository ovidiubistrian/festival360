"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  getDomain,
  setDomain,
  verifyDomain,
  removeDomain,
  type DomainStatus,
} from "@/lib/admin/platform";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DomainManagerProps {
  slug: string;
  tenantName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: called after any change (add / verify / remove) so a parent can refresh. */
  onChanged?: () => void;
}

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

/** A labelled monospace DNS value row with a copy button. */
function DnsRow({
  caption,
  value,
  copyLabel,
}: {
  caption: string;
  value: string;
  copyLabel: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{caption}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
        <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-foreground">
          {value}
        </code>
        <CopyButton value={value} label={copyLabel} />
      </div>
    </div>
  );
}

/**
 * Per-tenant custom-domain manager. A controlled dialog that loads the domain
 * status when it opens (via the onOpenChange event — not a mount effect — to
 * respect the repo's set-state-in-effect rule) and walks the operator through
 * add → DNS instructions → verify → active.
 */
export function DomainManager({
  slug,
  tenantName,
  open,
  onOpenChange,
  onChanged,
}: DomainManagerProps) {
  const [status, setStatus] = React.useState<DomainStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Set when the backend returns 402 (plan doesn't include custom_domain).
  const [upsell, setUpsell] = React.useState(false);

  // Tracks the slug we've already loaded for the current open session. When the
  // dialog opens (or switches tenant) this differs from `slug`, so we (re)load
  // and reset transient state — driven from render behind a guard, not a mount
  // effect, to respect the repo's set-state-in-effect rule.
  const [openedSlug, setOpenedSlug] = React.useState<string | null>(null);

  async function load(target: string) {
    setLoading(true);
    const next = await getDomain(target);
    setStatus(next);
    setLoading(false);
  }

  if (open && slug && openedSlug !== slug) {
    setOpenedSlug(slug);
    setDraft("");
    setError(null);
    setUpsell(false);
    setStatus(null);
    void load(slug);
  } else if (!open && openedSlug !== null) {
    setOpenedSlug(null);
  }

  async function handleAdd() {
    const domain = draft.trim();
    if (!domain) return;
    setSubmitting(true);
    setError(null);
    setUpsell(false);
    const res = await setDomain(slug, domain);
    setSubmitting(false);
    if (!res.ok || !res.status) {
      // Heuristic: the plan gate (402) message mentions the Pro plan; show the
      // dedicated upsell note in that case instead of an inline input error.
      const msg = res.error ?? "Setarea domeniului a eșuat.";
      if (/plan/i.test(msg)) {
        setUpsell(true);
      } else {
        setError(msg);
      }
      return;
    }
    setStatus(res.status);
    toast.success("Domeniu adăugat. Urmează pașii DNS.");
    onChanged?.();
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    const res = await verifyDomain(slug);
    setVerifying(false);
    if (!res.ok || !res.status) {
      const msg = res.error ?? "Verificarea a eșuat.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setStatus(res.status);
    if (res.status.active) {
      toast.success("Domeniu verificat și activ!");
    } else {
      toast.message("Domeniu actualizat.");
    }
    onChanged?.();
  }

  async function handleRemove() {
    const ok = await removeDomain(slug);
    if (!ok) {
      toast.error("Nu s-a putut șterge domeniul.");
      return;
    }
    setStatus(null);
    setDraft("");
    setError(null);
    setUpsell(false);
    toast.success("Domeniul a fost șters.");
    onChanged?.();
  }

  const hasDomain = Boolean(status?.domain);
  const isActive = Boolean(status?.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary [&_svg]:size-4">
              <Globe />
            </span>
            Domeniu propriu
          </DialogTitle>
          <DialogDescription>
            Conectează un domeniu propriu pentru site-ul{" "}
            <span className="font-medium text-foreground">{tenantName}</span>.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !hasDomain ? (
          /* ---------- State: no domain ---------- */
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="domain-input">
                Domeniul tău (ex. festivalulmeu.ro)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="domain-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="festivalulmeu.ro"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !submitting && draft.trim()) {
                      e.preventDefault();
                      void handleAdd();
                    }
                  }}
                />
                <Button
                  variant="gold"
                  onClick={() => void handleAdd()}
                  disabled={submitting || !draft.trim()}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {submitting ? "Se adaugă…" : "Adaugă"}
                </Button>
              </div>
            </div>

            {upsell ? (
              <div className="space-y-2 rounded-xl border border-terracotta/30 bg-terracotta/5 p-4">
                <p className="text-sm font-medium text-terracotta">
                  Domeniul propriu e disponibil din planul Pro în sus.
                </p>
                <p className="text-sm text-muted-foreground">
                  Fă upgrade planului pentru a conecta un domeniu propriu.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/subscriptions">
                    Vezi planurile
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        ) : isActive ? (
          /* ---------- State: active ---------- */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Activ
              </Badge>
              <span className="text-sm text-muted-foreground">
                Domeniul este conectat și live.
              </span>
            </div>

            <a
              href={`https://${status?.domain}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 transition-colors hover:border-primary"
            >
              <span className="min-w-0 break-all font-serif text-base font-semibold text-primary">
                https://{status?.domain}
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>

            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              Certificatul HTTPS este emis și reînnoit automat.
            </p>

            <div className="flex justify-end border-t border-border pt-4">
              <ConfirmDelete
                itemLabel={`domeniul „${status?.domain}”`}
                onConfirm={() => void handleRemove()}
                trigger={
                  <Button variant="ghost" className="text-destructive">
                    Șterge domeniul
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          /* ---------- State: added, not yet verified ---------- */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">Neverificat</Badge>
              <span className="min-w-0 break-all font-serif text-base font-semibold text-primary">
                {status?.domain}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  1. Adaugă un record <span className="font-mono">TXT</span>:
                </p>
                {status ? (
                  <>
                    <DnsRow
                      caption="Nume (host)"
                      value={status.verifyRecordName}
                      copyLabel="Copiază numele record-ului TXT"
                    />
                    <DnsRow
                      caption="Valoare"
                      value={status.verifyRecordValue}
                      copyLabel="Copiază valoarea record-ului TXT"
                    />
                  </>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-sm font-medium text-foreground">
                  2. Pointează domeniul către server:
                </p>
                {status ? (
                  <DnsRow
                    caption="Record A / ALIAS"
                    value={status.dnsTargetHint}
                    copyLabel="Copiază ținta DNS"
                  />
                ) : null}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              După ce salvezi record-urile la registrarul tău, propagarea DNS
              poate dura câteva minute.
            </p>

            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <ConfirmDelete
                itemLabel={`domeniul „${status?.domain}”`}
                onConfirm={() => void handleRemove()}
                trigger={
                  <Button variant="ghost" className="text-destructive">
                    Șterge domeniul
                  </Button>
                }
              />
              <Button
                variant="gold"
                onClick={() => void handleVerify()}
                disabled={verifying}
                className={cn(verifying && "pointer-events-none")}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {verifying ? "Se verifică…" : "Am adăugat, verifică"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
