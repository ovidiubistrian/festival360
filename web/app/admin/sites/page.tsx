"use client";

import * as React from "react";
import {
  Plus,
  Loader2,
  ExternalLink,
  Trash2,
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Globe,
  KeyRound,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DomainManager } from "@/components/admin/domain-manager";
import { TenantAdminReset } from "@/components/admin/tenant-admin-reset";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listPresets,
  listTenants,
  createTenant,
  deleteTenant,
  type Preset,
  type TenantSummary,
} from "@/lib/admin/platform";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Protected tenants that cannot be deleted (the demo's own site). */
const PROTECTED_SLUGS = new Set(["prispa"]);

/**
 * Slugify: lowercase, strip diacritics (NFD), collapse non-alphanumerics into
 * single hyphens, trim leading/trailing hyphens. Produces a value matching the
 * backend rule `^[a-z0-9]+(?:-[a-z0-9]+)*$` (when non-empty).
 */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Human labels for the known event types. */
const EVENT_TYPE_LABEL: Record<string, string> = {
  festival: "Festival",
  resort: "Stațiune",
  museum: "Muzeu",
  conference: "Conferință",
};

function eventTypeLabel(eventType: string): string {
  return EVENT_TYPE_LABEL[eventType] ?? eventType;
}

export default function SitesPage() {
  const [tenants, setTenants] = React.useState<TenantSummary[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [highlightSlug, setHighlightSlug] = React.useState<string | null>(null);

  // Custom-domain dialog. `domainTarget` stays set through the close animation
  // while `domainOpen` drives visibility.
  const [domainTarget, setDomainTarget] =
    React.useState<TenantSummary | null>(null);
  const [domainOpen, setDomainOpen] = React.useState(false);

  function openDomain(tenant: TenantSummary) {
    setDomainTarget(tenant);
    setDomainOpen(true);
  }

  // Reset-admin-password dialog. `resetTarget` stays set through the close
  // animation while `resetOpen` drives visibility.
  const [resetTarget, setResetTarget] =
    React.useState<TenantSummary | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);

  function openReset(tenant: TenantSummary) {
    setResetTarget(tenant);
    setResetOpen(true);
  }

  // Wizard state.
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [presetsLoaded, setPresetsLoaded] = React.useState(false);
  const [presetsLoading, setPresetsLoading] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [selectedPreset, setSelectedPreset] = React.useState<Preset | null>(
    null
  );
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load the tenant list once, on first client render — without a mount effect
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
      setLoading(true);
      const items = await listTenants();
      setTenants(items);
      setLoaded(true);
      setLoading(false);
    })();
  }

  async function refresh() {
    const items = await listTenants();
    setTenants(items);
    setLoaded(true);
  }

  async function loadPresets() {
    setPresetsLoading(true);
    const items = await listPresets();
    setPresets(items);
    setPresetsLoaded(true);
    setPresetsLoading(false);
  }

  function handleWizardOpenChange(next: boolean) {
    setWizardOpen(next);
    if (next) {
      // Reset the wizard form each time it opens (driven by this event, not an
      // effect). Presets stay cached across opens.
      setStep(1);
      setSelectedPreset(null);
      setName("");
      setSlug("");
      setSlugEdited(false);
      setError(null);
      if (!presetsLoaded && !presetsLoading) {
        void loadPresets();
      }
    }
  }

  function choosePreset(preset: Preset) {
    setSelectedPreset(preset);
    setError(null);
    setStep(2);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(value);
  }

  const finalSlug = slugify(slug);
  const canCreate = name.trim().length > 0 && finalSlug.length > 0;

  async function handleCreate() {
    if (!selectedPreset || !canCreate) return;
    setCreating(true);
    setError(null);
    const res = await createTenant({
      name: name.trim(),
      slug: finalSlug,
      eventType: selectedPreset.key,
    });
    setCreating(false);
    if (!res.ok || !res.tenant) {
      const msg = res.error ?? "Crearea site-ului a eșuat.";
      setError(msg);
      toast.error(msg);
      return;
    }
    const created = res.tenant;
    setWizardOpen(false);
    setHighlightSlug(created.slug);
    toast.success(`Site-ul „${created.name}” a fost creat.`, {
      action: {
        label: "Vezi site-ul",
        onClick: () => window.open(`/${created.slug}`, "_blank", "noreferrer"),
      },
    });
    await refresh();
  }

  async function remove(tenant: TenantSummary) {
    const ok = await deleteTenant(tenant.slug);
    if (!ok) {
      toast.error(
        `Nu s-a putut șterge „${tenant.name}”. Unele site-uri sunt protejate.`
      );
      return;
    }
    setTenants((prev) => prev.filter((t) => t.slug !== tenant.slug));
    toast.success(`Site-ul „${tenant.name}” a fost șters.`);
  }

  return (
    <AdminShell
      title="Site-uri"
      description="Creează și gestionează site-urile (tenant) din platformă — fiecare cu tipul, terminologia și tema lui."
      actions={
        <Dialog open={wizardOpen} onOpenChange={handleWizardOpenChange}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm">
              <Plus className="h-4 w-4" />
              Creează site nou
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            {step === 1 ? (
              <>
                <DialogHeader>
                  <DialogTitle>Pasul 1 — Tipul site-ului</DialogTitle>
                  <DialogDescription>
                    Alege un tip. Se aplică automat terminologia, tema și
                    structura potrivite.
                  </DialogDescription>
                </DialogHeader>

                {presetsLoading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : presets.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    Nu s-au putut încărca tipurile de site.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {presets.map((preset) => {
                      const swatches = [
                        preset.theme.primary,
                        preset.theme.secondary,
                        preset.theme.terracotta,
                        preset.theme.gold,
                        preset.theme.charcoal,
                        preset.theme.background,
                      ];
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => choosePreset(preset)}
                          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-secondary/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-serif text-base font-semibold text-primary">
                              {preset.name}
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {preset.description}
                          </p>
                          <div className="flex items-center gap-1.5 pt-1">
                            {swatches.map((color, i) => (
                              <span
                                key={i}
                                className="h-4 w-4 rounded-full border border-border"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Pasul 2 — Detalii</DialogTitle>
                  <DialogDescription>
                    {selectedPreset ? (
                      <>
                        Tip ales:{" "}
                        <span className="font-medium text-foreground">
                          {selectedPreset.name}
                        </span>
                        . Dă un nume site-ului.
                      </>
                    ) : (
                      "Dă un nume site-ului."
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="site-name">Numele site-ului</Label>
                    <Input
                      id="site-name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="ex. Festivalul Satului"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="site-slug">Adresă (slug)</Label>
                    <Input
                      id="site-slug"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="festivalul-satului"
                    />
                    <p className="text-xs text-muted-foreground">
                      Site-ul va fi disponibil la{" "}
                      <span className="font-medium text-foreground">
                        /{finalSlug || "…"}
                      </span>
                    </p>
                  </div>

                  {error ? (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    disabled={creating}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Înapoi
                  </Button>
                  <Button
                    variant="gold"
                    onClick={() => void handleCreate()}
                    disabled={!canCreate || creating}
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {creating ? "Se creează…" : "Creează"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      {/* Explainer: this is the multi-tenant engine. */}
      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[color:var(--gold-600)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Motorul multi-tenant al platformei
            </p>
            <p className="text-sm text-muted-foreground">
              Alegi tipul → se aplică automat terminologia, tema și structura.
              Site-ul e live imediat; adaugi conținutul din celelalte module.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading && !loaded ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Niciun site încă. Apasă „Creează site nou” pentru a începe.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => {
            const protectedSite = PROTECTED_SLUGS.has(tenant.slug);
            const highlighted = tenant.slug === highlightSlug;
            return (
              <Card
                key={tenant.slug}
                className={cn(
                  "transition-colors",
                  highlighted && "border-primary ring-2 ring-primary/25"
                )}
              >
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="mt-1 h-4 w-4 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: tenant.themePrimary }}
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-base font-semibold text-primary">
                          {tenant.name}
                        </h3>
                        <Badge variant="secondary">
                          {eventTypeLabel(tenant.eventType)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          /{tenant.slug}
                        </span>
                      </div>
                      {tenant.tagline ? (
                        <p className="truncate text-sm text-muted-foreground">
                          {tenant.tagline}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`/${tenant.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Vezi site-ul
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDomain(tenant)}
                    >
                      <Globe className="h-4 w-4" />
                      Domeniu
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => openReset(tenant)}
                      aria-label={`Resetează parola admin pentru ${tenant.name}`}
                      title="Resetează parola admin"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {protectedSite ? null : (
                      <ConfirmDelete
                        itemLabel={`site-ul „${tenant.name}” (/${tenant.slug}) și tot conținutul lui`}
                        onConfirm={() => void remove(tenant)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            aria-label={`Șterge ${tenant.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tenants.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {tenants.length} site-uri în platformă.
        </p>
      ) : null}

      <DomainManager
        slug={domainTarget?.slug ?? ""}
        tenantName={domainTarget?.name ?? ""}
        open={domainOpen}
        onOpenChange={setDomainOpen}
      />

      <TenantAdminReset
        slug={resetTarget?.slug ?? ""}
        tenantName={resetTarget?.name ?? ""}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
    </AdminShell>
  );
}
