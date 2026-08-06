"use client";

import * as React from "react";
import Link from "next/link";
import {
  Upload,
  Loader2,
  Save,
  RotateCcw,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getLandingConfig,
  saveLandingConfig,
  uploadPlatformImage,
} from "@/lib/admin/platform";
import { isSuperadmin, useSession } from "@/lib/admin/session";
import type { LandingConfig } from "@/lib/api";
import { IMG } from "@/lib/tenants/prispa/images";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Editor defaults — MUST mirror the hardcoded fallbacks used by the public
 * landing hero (`web/app/page.tsx`), so the editor always shows the live
 * content even before anything is saved.
 */
const DEFAULTS = {
  heroBadge: "Platformă SaaS multi-tenant",
  heroTitle:
    "Construiește digital orice destinație, eveniment sau instituție.",
  heroTaglineEn: "Build your destination, event or institution digitally.",
  heroDescription:
    "Un singur loc pentru site, conținut, program, parteneri, produse, bilete și promovare. Alegi o verticală, iar terminologia, tema și structura se adaptează automat.",
  heroImage: IMG.hero,
  heroCtaPrimaryLabel: "Vezi un demo",
  heroCtaPrimaryHref: "/prispa",
  heroCtaSecondaryLabel: "Autentificare",
  heroCtaSecondaryHref: "/admin",
} as const;

type FormState = Record<keyof typeof DEFAULTS, string>;

/** Build the form state from a loaded config, falling back to the defaults. */
function toForm(config: LandingConfig): FormState {
  return {
    heroBadge: config.heroBadge ?? DEFAULTS.heroBadge,
    heroTitle: config.heroTitle ?? DEFAULTS.heroTitle,
    heroTaglineEn: config.heroTaglineEn ?? DEFAULTS.heroTaglineEn,
    heroDescription: config.heroDescription ?? DEFAULTS.heroDescription,
    heroImage: config.heroImage ?? DEFAULTS.heroImage,
    heroCtaPrimaryLabel:
      config.heroCtaPrimaryLabel ?? DEFAULTS.heroCtaPrimaryLabel,
    heroCtaPrimaryHref:
      config.heroCtaPrimaryHref ?? DEFAULTS.heroCtaPrimaryHref,
    heroCtaSecondaryLabel:
      config.heroCtaSecondaryLabel ?? DEFAULTS.heroCtaSecondaryLabel,
    heroCtaSecondaryHref:
      config.heroCtaSecondaryHref ?? DEFAULTS.heroCtaSecondaryHref,
  };
}

export default function LandingEditorPage() {
  // Subscribe so the role resolves after client mount.
  useSession();

  // Client-mount flag without a mount effect (avoids the set-state-in-effect
  // anti-pattern the repo lints as an error).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const superadmin = mounted && isSuperadmin();

  const [form, setForm] = React.useState<FormState>(() => toForm({}));
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Load the current config once, on first client render for super-admins —
  // via a render-phase guard, never a setState-in-effect.
  if (mounted && superadmin && !started) {
    setStarted(true);
    void (async () => {
      setLoading(true);
      const config = await getLandingConfig();
      setForm(toForm(config));
      setLoaded(true);
      setLoading(false);
    })();
  }

  function update(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const url = await uploadPlatformImage(file);
    setUploading(false);
    if (!url) {
      toast.error("Încărcarea imaginii a eșuat.");
      return;
    }
    update("heroImage", url);
    toast.success("Imagine încărcată.");
  }

  async function handleSave() {
    setSaving(true);
    const payload: LandingConfig = {
      heroBadge: form.heroBadge.trim(),
      heroTitle: form.heroTitle.trim(),
      heroTaglineEn: form.heroTaglineEn.trim(),
      heroDescription: form.heroDescription.trim(),
      heroImage: form.heroImage.trim(),
      heroCtaPrimaryLabel: form.heroCtaPrimaryLabel.trim(),
      heroCtaPrimaryHref: form.heroCtaPrimaryHref.trim(),
      heroCtaSecondaryLabel: form.heroCtaSecondaryLabel.trim(),
      heroCtaSecondaryHref: form.heroCtaSecondaryHref.trim(),
    };
    const ok = await saveLandingConfig(payload);
    setSaving(false);
    if (!ok) {
      toast.error("Salvarea a eșuat. Încearcă din nou.");
      return;
    }
    toast.success("Pagina principală a fost salvată.");
  }

  async function handleReset() {
    setResetting(true);
    const ok = await saveLandingConfig({});
    setResetting(false);
    if (!ok) {
      toast.error("Resetarea a eșuat. Încearcă din nou.");
      return;
    }
    setForm(toForm({}));
    toast.success("Pagina principală a revenit la valorile implicite.");
  }

  const busy = saving || resetting;
  const previewImage = form.heroImage.trim() || DEFAULTS.heroImage;

  return (
    <AdminShell
      title="Pagina principală"
      description="Configurează hero-ul de pe siteora.ro (imagine + texte)."
      actions={
        <Button asChild variant="outline" size="sm">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Vezi pagina
          </a>
        </Button>
      }
    >
      {loading && !loaded ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero image */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h2 className="font-serif text-lg font-semibold text-primary">
                  Imagine hero
                </h2>
                <p className="text-sm text-muted-foreground">
                  Fotografia de fundal din zona de hero. Încarcă una nouă sau
                  lipește un URL.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage}
                  alt="Previzualizare imagine hero"
                  loading="lazy"
                  className="h-52 w-full object-cover"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
                    uploading && "pointer-events-none opacity-70"
                  )}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Se încarcă…" : "Încarcă imagine"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      void handleUpload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-image-url">sau lipește un URL</Label>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    id="hero-image-url"
                    value={form.heroImage}
                    onChange={(e) => update("heroImage", e.target.value)}
                    placeholder="https://... sau /media/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Texts */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1">
                <h2 className="font-serif text-lg font-semibold text-primary">
                  Texte
                </h2>
                <p className="text-sm text-muted-foreground">
                  Titlul, descrierea și etichetele afișate în hero.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-badge">Badge</Label>
                <Input
                  id="hero-badge"
                  value={form.heroBadge}
                  onChange={(e) => update("heroBadge", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-title">Titlu (H1)</Label>
                <Textarea
                  id="hero-title"
                  value={form.heroTitle}
                  onChange={(e) => update("heroTitle", e.target.value)}
                  className="min-h-[70px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-tagline">Tagline (EN)</Label>
                <Input
                  id="hero-tagline"
                  value={form.heroTaglineEn}
                  onChange={(e) => update("heroTaglineEn", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hero-description">Descriere</Label>
                <Textarea
                  id="hero-description"
                  value={form.heroDescription}
                  onChange={(e) => update("heroDescription", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* CTAs */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-1">
                <h2 className="font-serif text-lg font-semibold text-primary">
                  Butoane (CTA)
                </h2>
                <p className="text-sm text-muted-foreground">
                  Textul și adresa fiecărui buton din hero.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cta-primary-label">
                    Buton primar — text
                  </Label>
                  <Input
                    id="cta-primary-label"
                    value={form.heroCtaPrimaryLabel}
                    onChange={(e) =>
                      update("heroCtaPrimaryLabel", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cta-primary-href">
                    Buton primar — adresă
                  </Label>
                  <Input
                    id="cta-primary-href"
                    value={form.heroCtaPrimaryHref}
                    onChange={(e) =>
                      update("heroCtaPrimaryHref", e.target.value)
                    }
                    placeholder="/prispa"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cta-secondary-label">
                    Buton secundar — text
                  </Label>
                  <Input
                    id="cta-secondary-label"
                    value={form.heroCtaSecondaryLabel}
                    onChange={(e) =>
                      update("heroCtaSecondaryLabel", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cta-secondary-href">
                    Buton secundar — adresă
                  </Label>
                  <Input
                    id="cta-secondary-href"
                    value={form.heroCtaSecondaryHref}
                    onChange={(e) =>
                      update("heroCtaSecondaryHref", e.target.value)
                    }
                    placeholder="/admin"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={() => void handleReset()}
              disabled={busy}
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Resetează la implicit
            </Button>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost">
                <Link href="/" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Vezi pagina
                </Link>
              </Button>
              <Button
                variant="gold"
                onClick={() => void handleSave()}
                disabled={busy}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvează
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
