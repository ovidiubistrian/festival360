"use client";

import * as React from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Loader2,
  Save,
  Upload,
  ImageIcon,
  Plus,
  Trash2,
  ArrowRight,
  Info,
  FileUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon, ICON_OPTIONS } from "@/components/shared/icon";
import { apiUpdateSettings } from "@/lib/admin/api";
import {
  addSection,
  refresh,
  updateSection,
  useAdminData,
} from "@/lib/admin/store";
import { uploadGpx, uploadMedia } from "@/lib/admin/media";
import { GalleryManager } from "@/components/admin/gallery-manager";
import type {
  ConditionMetric,
  CustomSectionSource,
  Experience,
  SectionConfig,
  Trail,
  TrailDifficulty,
} from "@/lib/tenants/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Per-section configuration entry point shown on `/admin/pages`. Each homepage
 * zone gets a "Configurează" button that opens the right editor:
 *  - hero / about / experiences → inline editors that save via the settings API.
 *  - content-backed zones (program, expozanți, …) → a short dialog that links to
 *    the module that manages that content.
 *
 * All dialogs prefill from the live admin store using a render-phase guard
 * (never a setState-in-effect) to respect the repo's strict hooks lint.
 */

const INLINE_EDITORS = new Set([
  "hero",
  "about",
  "experiences",
  "conditions",
  "trails",
]);

/** Content-backed zones → the admin module that manages their content. */
const MODULE_LINKS: Record<
  string,
  { href: string; cta: string; explanation: string }
> = {
  program: {
    href: "/admin/program",
    cta: "Gestionează programul",
    explanation:
      "Această secțiune afișează programul pe zile. Evenimentele se adaugă și se editează din modulul Program.",
  },
  exhibitors: {
    href: "/admin/exhibitors",
    cta: "Gestionează expozanții",
    explanation:
      "Această secțiune afișează selecția de expozanți. Producătorii și meșteșugarii se administrează din modulul Expozanți.",
  },
  accommodations: {
    href: "/admin/accommodations",
    cta: "Gestionează cazările",
    explanation:
      "Această secțiune afișează cazările disponibile. Ele se administrează din modulul Cazări.",
  },
  restaurants: {
    href: "/admin/restaurants",
    cta: "Gestionează restaurantele",
    explanation:
      "Această secțiune afișează restaurantele și localurile. Ele se administrează din modulul Restaurante.",
  },
  events: {
    href: "/admin/events",
    cta: "Gestionează evenimentele",
    explanation:
      "Această secțiune afișează evenimentele din stațiune. Ele se administrează din modulul Evenimente.",
  },
  products: {
    href: "/admin/products",
    cta: "Gestionează produsele",
    explanation:
      "Această secțiune afișează selecția de produse locale. Ele se administrează din modulul Produse.",
  },
  destinations: {
    href: "/admin/destinations",
    cta: "Gestionează destinațiile",
    explanation:
      "Această secțiune afișează destinațiile turistice. Ele se administrează din modulul Destinații.",
  },
  partners: {
    href: "/admin/partners",
    cta: "Gestionează partenerii",
    explanation:
      "Această secțiune afișează logourile partenerilor și sponsorilor. Ei se administrează din modulul Parteneri.",
  },
  gallery: {
    href: "/admin/gallery",
    cta: "Gestionează galeria",
    explanation:
      "Această secțiune afișează galeria foto. Imaginile se administrează din modulul Galerie.",
  },
  news: {
    href: "/admin/news",
    cta: "Gestionează noutățile",
    explanation:
      "Această secțiune afișează ultimele articole. Ele se administrează din modulul Noutăți.",
  },
  newsletter: {
    href: "/admin/newsletter",
    cta: "Gestionează abonații",
    explanation:
      "Această secțiune afișează formularul de abonare la newsletter. Abonații se administrează din modulul Newsletter.",
  },
};

/** Reusable image field: upload (uploadMedia) + paste-URL + live preview. */
function ImageField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const asset = await uploadMedia(file);
    setUploading(false);
    if (!asset) {
      toast.error("Încărcarea imaginii a eșuat.");
      return;
    }
    onChange(asset.url);
    toast.success("Imagine încărcată.");
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {value.trim() ? (
        <div className="overflow-hidden rounded-xl border border-border bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Previzualizare"
            loading="lazy"
            className="h-40 w-full object-cover"
          />
        </div>
      ) : null}
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
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... sau /media/..."
        />
      </div>
    </div>
  );
}

/** Footer with a spinner-aware "Salvează" button, shared by inline editors. */
function SaveFooter({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <DialogFooter>
      <Button variant="ghost" onClick={onCancel} disabled={saving}>
        Anulează
      </Button>
      <Button variant="gold" onClick={onSave} disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Se salvează…" : "Salvează"}
      </Button>
    </DialogFooter>
  );
}

/** PUT the patch, refresh the store, toast, and close on success. */
async function persist(
  patch: Record<string, unknown>,
  onSuccess: () => void
): Promise<boolean> {
  const ok = await apiUpdateSettings(patch);
  if (!ok) {
    toast.error("Salvarea a eșuat. Încearcă din nou.");
    return false;
  }
  await refresh();
  toast.success("Modificările au fost salvate.");
  onSuccess();
  return true;
}

// ---------------------------------------------------------------- Hero editor

interface HeroForm {
  heroBadge: string;
  tagline: string;
  shortDescription: string;
  heroImage: string;
}

function HeroEditor({ onClose }: { onClose: () => void }) {
  const data = useAdminData();
  const [form, setForm] = React.useState<HeroForm>(() => ({
    heroBadge: data.settings.heroBadge,
    tagline: data.settings.tagline,
    shortDescription: data.settings.shortDescription,
    heroImage: data.settings.heroImage,
  }));
  const [saving, setSaving] = React.useState(false);

  function set<K extends keyof HeroForm>(key: K, value: HeroForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await persist(
      {
        heroBadge: form.heroBadge.trim(),
        tagline: form.tagline.trim(),
        shortDescription: form.shortDescription.trim(),
        heroImage: form.heroImage.trim(),
      },
      onClose
    );
    setSaving(false);
  }

  return (
    <>
      <div className="space-y-5 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="hero-badge">Etichetă (badge)</Label>
          <Input
            id="hero-badge"
            value={form.heroBadge}
            onChange={(e) => set("heroBadge", e.target.value)}
            placeholder="Tradiții • Gastronomie • Turism"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-tagline">Titlu principal (H1)</Label>
          <Textarea
            id="hero-tagline"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            className="min-h-[70px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-subtitle">Subtitlu</Label>
          <Textarea
            id="hero-subtitle"
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
        </div>
        <ImageField
          id="hero-image"
          label="Imagine hero"
          value={form.heroImage}
          onChange={(url) => set("heroImage", url)}
        />
      </div>
      <SaveFooter
        saving={saving}
        onCancel={onClose}
        onSave={() => void handleSave()}
      />
    </>
  );
}

// --------------------------------------------------------------- About editor

interface StatRow {
  value: string;
  label: string;
  icon: string;
}

function AboutEditor({ onClose }: { onClose: () => void }) {
  const data = useAdminData();
  const [longDescription, setLongDescription] = React.useState(
    () => data.settings.longDescription
  );
  const [aboutImage, setAboutImage] = React.useState(
    () => data.settings.aboutImage
  );
  const [aboutImage2, setAboutImage2] = React.useState(
    () => data.settings.aboutImage2
  );
  const [stats, setStats] = React.useState<StatRow[]>(() =>
    data.stats.map((s) => ({
      value: s.value,
      label: s.label,
      icon: s.icon ?? "",
    }))
  );
  const [saving, setSaving] = React.useState(false);

  function updateStat(index: number, patch: Partial<StatRow>) {
    setStats((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }
  function addStat() {
    setStats((prev) => [...prev, { value: "", label: "", icon: "" }]);
  }
  function removeStat(index: number) {
    setStats((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    await persist(
      {
        longDescription: longDescription.trim(),
        aboutImage: aboutImage.trim(),
        aboutImage2: aboutImage2.trim(),
        stats: stats
          .filter((s) => s.value.trim() || s.label.trim())
          .map((s) => ({
            value: s.value.trim(),
            label: s.label.trim(),
            icon: s.icon.trim(),
          })),
      },
      onClose
    );
    setSaving(false);
  }

  return (
    <>
      <div className="space-y-5 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="about-text">Text „Despre”</Label>
          <Textarea
            id="about-text"
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            id="about-image"
            label="Imagine principală"
            value={aboutImage}
            onChange={setAboutImage}
          />
          <ImageField
            id="about-image-2"
            label="Imagine secundară (mică)"
            value={aboutImage2}
            onChange={setAboutImage2}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Cifre principale</Label>
            <Button variant="outline" size="sm" onClick={addStat}>
              <Plus className="h-4 w-4" />
              Adaugă
            </Button>
          </div>
          {stats.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              Nicio cifră adăugată încă.
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.map((s, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-end gap-2 rounded-xl border border-border p-3 sm:flex-nowrap"
                >
                  <div className="w-full space-y-1 sm:w-28">
                    <Label
                      htmlFor={`stat-value-${i}`}
                      className="text-xs text-muted-foreground"
                    >
                      Valoare
                    </Label>
                    <Input
                      id={`stat-value-${i}`}
                      value={s.value}
                      onChange={(e) => updateStat(i, { value: e.target.value })}
                      placeholder="100+"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label
                      htmlFor={`stat-label-${i}`}
                      className="text-xs text-muted-foreground"
                    >
                      Etichetă
                    </Label>
                    <Input
                      id={`stat-label-${i}`}
                      value={s.label}
                      onChange={(e) => updateStat(i, { label: e.target.value })}
                      placeholder="Expozanți"
                    />
                  </div>
                  <div className="w-full space-y-1 sm:w-36">
                    <Label
                      htmlFor={`stat-icon-${i}`}
                      className="text-xs text-muted-foreground"
                    >
                      Icon (lucide)
                    </Label>
                    <Input
                      id={`stat-icon-${i}`}
                      value={s.icon}
                      onChange={(e) => updateStat(i, { icon: e.target.value })}
                      placeholder="Store"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStat(i)}
                    aria-label="Șterge cifra"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <SaveFooter
        saving={saving}
        onCancel={onClose}
        onSave={() => void handleSave()}
      />
    </>
  );
}

// --------------------------------------------------------- Experiences editor

function ExperiencesEditor({ onClose }: { onClose: () => void }) {
  const data = useAdminData();
  const [items, setItems] = React.useState<Experience[]>(() =>
    data.experiences.map((e) => ({ ...e }))
  );
  const [saving, setSaving] = React.useState(false);

  function updateItem(index: number, patch: Partial<Experience>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  }
  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: `exp-${Date.now().toString(36)}`,
        title: "",
        description: "",
        icon: "",
        image: "",
        gallery: [],
      },
    ]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }

  async function handleSave() {
    setSaving(true);
    await persist(
      {
        experiences: items
          .filter((it) => it.title.trim() || it.description.trim())
          .map((it) => ({
            title: it.title.trim(),
            description: it.description.trim(),
            icon: it.icon.trim(),
            image: it.image.trim(),
            gallery: (it.gallery ?? [])
              .map((g) => g.trim())
              .filter(Boolean),
            link: it.link?.trim() || "",
            ctaLabel: it.ctaLabel?.trim() || "",
          })),
      },
      onClose
    );
    setSaving(false);
  }

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Fiecare card afișează un titlu, o descriere, un icon și un mic
            carusel foto (poza principală + galerie).
          </p>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Adaugă
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Nicio experiență adăugată încă.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((it, i) => (
              <li
                key={it.id}
                className="space-y-3 rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary [&_svg]:size-4">
                      <Icon name={it.icon} />
                    </span>
                    Experiența {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      aria-label="Mută mai sus"
                    >
                      <ArrowRight className="h-4 w-4 -rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={i === items.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label="Mută mai jos"
                    >
                      <ArrowRight className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(i)}
                      aria-label="Șterge experiența"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-title-${i}`}>Titlu</Label>
                    <Input
                      id={`exp-title-${i}`}
                      value={it.title}
                      onChange={(e) => updateItem(i, { title: e.target.value })}
                      placeholder="Gastronomie locală"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-icon-${i}`}>Iconiță</Label>
                    <Select
                      value={
                        ICON_OPTIONS.some((o) => o.value === it.icon)
                          ? it.icon
                          : undefined
                      }
                      onValueChange={(v) => updateItem(i, { icon: v })}
                    >
                      <SelectTrigger id={`exp-icon-${i}`}>
                        <SelectValue placeholder="Alege o iconiță" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {ICON_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            <span className="flex items-center gap-2">
                              <Icon name={o.value} className="h-4 w-4" />
                              {o.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`exp-desc-${i}`}>Descriere</Label>
                  <Textarea
                    id={`exp-desc-${i}`}
                    value={it.description}
                    onChange={(e) =>
                      updateItem(i, { description: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-link-${i}`}>Link (opțional)</Label>
                    <Input
                      id={`exp-link-${i}`}
                      value={it.link ?? ""}
                      onChange={(e) => updateItem(i, { link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-cta-${i}`}>Text buton (CTA)</Label>
                    <Input
                      id={`exp-cta-${i}`}
                      value={it.ctaLabel ?? ""}
                      onChange={(e) =>
                        updateItem(i, { ctaLabel: e.target.value })
                      }
                      placeholder="Află mai multe"
                    />
                  </div>
                </div>
                <ImageField
                  id={`exp-image-${i}`}
                  label="Imagine principală (profil)"
                  value={it.image}
                  onChange={(url) => updateItem(i, { image: url })}
                />
                <GalleryManager
                  images={it.gallery ?? []}
                  onImagesChange={(next) => updateItem(i, { gallery: next })}
                  cover={it.image}
                  onCoverChange={(url) => updateItem(i, { image: url })}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <SaveFooter
        saving={saving}
        onCancel={onClose}
        onSave={() => void handleSave()}
      />
    </>
  );
}

// ----------------------------------------------------------- Conditions editor

type SeasonKey = "winter" | "summer";

const CONDITION_DEFAULTS: Record<
  SeasonKey,
  { headline: string; metrics: ConditionMetric[] }
> = {
  winter: {
    headline: "Condiții de iarnă",
    metrics: [
      { label: "Temperatură", value: "-3°C" },
      { label: "Strat de zăpadă", value: "45 cm" },
      { label: "Stare pârtii", value: "Pârtii deschise" },
    ],
  },
  summer: {
    headline: "Condiții de vară",
    metrics: [
      { label: "Temperatură", value: "21°C" },
      { label: "Temperatura apei lacului", value: "18°C" },
      { label: "Stare trasee", value: "Trasee deschise" },
    ],
  },
};

const CONDITION_DEFAULT_NOTE = "Date orientative, cu titlu demonstrativ.";

interface SeasonForm {
  headline: string;
  metrics: ConditionMetric[];
}

function MetricsEditor({
  season,
  form,
  onChange,
}: {
  season: SeasonKey;
  form: SeasonForm;
  onChange: (patch: Partial<SeasonForm>) => void;
}) {
  function updateMetric(index: number, patch: Partial<ConditionMetric>) {
    onChange({
      metrics: form.metrics.map((m, i) =>
        i === index ? { ...m, ...patch } : m
      ),
    });
  }
  function addMetric() {
    onChange({ metrics: [...form.metrics, { label: "", value: "" }] });
  }
  function removeMetric(index: number) {
    onChange({ metrics: form.metrics.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="space-y-1.5">
        <Label htmlFor={`cond-headline-${season}`}>Titlu sezon</Label>
        <Input
          id={`cond-headline-${season}`}
          value={form.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          placeholder={CONDITION_DEFAULTS[season].headline}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Indicatori</Label>
        <Button variant="outline" size="sm" onClick={addMetric}>
          <Plus className="h-4 w-4" />
          Adaugă
        </Button>
      </div>
      {form.metrics.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          Niciun indicator. Sezonul nu va afișa carduri.
        </p>
      ) : (
        <ul className="space-y-2">
          {form.metrics.map((m, i) => (
            <li
              key={i}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3 sm:flex-nowrap"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor={`cond-${season}-label-${i}`}
                  className="text-xs text-muted-foreground"
                >
                  Etichetă
                </Label>
                <Input
                  id={`cond-${season}-label-${i}`}
                  value={m.label}
                  onChange={(e) => updateMetric(i, { label: e.target.value })}
                  placeholder="Temperatură"
                />
              </div>
              <div className="w-full space-y-1 sm:w-40">
                <Label
                  htmlFor={`cond-${season}-value-${i}`}
                  className="text-xs text-muted-foreground"
                >
                  Valoare
                </Label>
                <Input
                  id={`cond-${season}-value-${i}`}
                  value={m.value}
                  onChange={(e) => updateMetric(i, { value: e.target.value })}
                  placeholder="-3°C"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeMetric(i)}
                aria-label="Șterge indicatorul"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConditionsEditor({ onClose }: { onClose: () => void }) {
  const data = useAdminData();
  const config = data.conditions;
  const configured =
    !!config && (config.seasons || config.winter || config.summer || config.note);

  const [seasons, setSeasons] = React.useState<SeasonKey[]>(() =>
    config?.seasons && config.seasons.length > 0
      ? config.seasons
      : ["winter", "summer"]
  );
  const [winter, setWinter] = React.useState<SeasonForm>(() => ({
    headline: config?.winter?.headline ?? CONDITION_DEFAULTS.winter.headline,
    metrics: config?.winter?.metrics ?? CONDITION_DEFAULTS.winter.metrics,
  }));
  const [summer, setSummer] = React.useState<SeasonForm>(() => ({
    headline: config?.summer?.headline ?? CONDITION_DEFAULTS.summer.headline,
    metrics: config?.summer?.metrics ?? CONDITION_DEFAULTS.summer.metrics,
  }));
  const [note, setNote] = React.useState<string>(() =>
    configured ? config?.note ?? "" : CONDITION_DEFAULT_NOTE
  );
  const [saving, setSaving] = React.useState(false);

  function toggleSeason(key: SeasonKey) {
    setSeasons((prev) => {
      if (prev.includes(key)) {
        // Keep at least one season enabled.
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== key);
      }
      // Preserve winter-before-summer order.
      return key === "winter" ? ["winter", ...prev] : [...prev, "summer"];
    });
  }

  async function handleSave() {
    setSaving(true);
    const clean = (form: SeasonForm) => ({
      headline: form.headline.trim(),
      metrics: form.metrics
        .filter((m) => m.label.trim() || m.value.trim())
        .map((m) => ({ label: m.label.trim(), value: m.value.trim() })),
    });
    await persist(
      {
        conditions: {
          seasons,
          winter: clean(winter),
          summer: clean(summer),
          note: note.trim(),
        },
      },
      onClose
    );
    setSaving(false);
  }

  return (
    <>
      <div className="space-y-5 py-2">
        <div className="space-y-2">
          <Label>Sezoane afișate</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={seasons.includes("winter") ? "gold" : "outline"}
              size="sm"
              onClick={() => toggleSeason("winter")}
              aria-pressed={seasons.includes("winter")}
            >
              Iarnă
            </Button>
            <Button
              variant={seasons.includes("summer") ? "gold" : "outline"}
              size="sm"
              onClick={() => toggleSeason("summer")}
              aria-pressed={seasons.includes("summer")}
            >
              Vară
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cel puțin un sezon rămâne activ. Butonul de comutare din pagină apare
            doar când sunt afișate ambele.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Iarnă</p>
          <MetricsEditor
            season="winter"
            form={winter}
            onChange={(patch) => setWinter((prev) => ({ ...prev, ...patch }))}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Vară</p>
          <MetricsEditor
            season="summer"
            form={summer}
            onChange={(patch) => setSummer((prev) => ({ ...prev, ...patch }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cond-note">Notă (opțional)</Label>
          <Input
            id="cond-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={CONDITION_DEFAULT_NOTE}
          />
        </div>
      </div>
      <SaveFooter
        saving={saving}
        onCancel={onClose}
        onSave={() => void handleSave()}
      />
    </>
  );
}

// --------------------------------------------------------------- Trails editor

const TRAIL_DIFFICULTIES: TrailDifficulty[] = ["Ușor", "Mediu", "Dificil"];

const TRAIL_DEFAULTS: {
  eyebrow: string;
  title: string;
  description: string;
  mapQuery: string;
  items: Trail[];
} = {
  eyebrow: "Explorează zona",
  title: "Trasee & hartă",
  description:
    "Descoperă potecile din jurul stațiunii — de la plimbări ușoare pe malul lacului până la ture montane pentru cei experimentați.",
  mapQuery: "Poiana Mărului",
  items: [
    {
      name: "Traseul Lacului Verde",
      difficulty: "Ușor",
      length: "4,2 km",
      elevation: "120 m",
      duration: "1h 30m",
    },
    {
      name: "Creasta Muntele Mic",
      difficulty: "Mediu",
      length: "9,5 km",
      elevation: "540 m",
      duration: "3h 30m",
    },
  ],
};

/** Basename of a /media/xxx.gpx URL, for display next to the remove button. */
function gpxFilename(url: string): string {
  try {
    return decodeURIComponent(url.split("/").pop() || url);
  } catch {
    return url;
  }
}

function GpxField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const [uploading, setUploading] = React.useState(false);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const url = await uploadGpx(file);
    setUploading(false);
    if (!url) {
      toast.error("Încărcarea traseului GPX a eșuat.");
      return;
    }
    onChange(url);
    toast.success("Traseu GPX încărcat.");
  }

  return (
    <div className="space-y-1.5">
      <Label>Traseu GPX (opțional)</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <FileUp className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
            {gpxFilename(value)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(undefined)}
            aria-label="Elimină traseul GPX"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
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
          {uploading ? "Se încarcă…" : "Încarcă GPX"}
          <input
            type="file"
            accept=".gpx,application/gpx+xml,application/xml,text/xml"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              void handleUpload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      <p className="text-xs text-muted-foreground">
        Traseul se desenează pe hartă, colorat după dificultate.
      </p>
    </div>
  );
}

interface TrailsForm {
  eyebrow: string;
  title: string;
  description: string;
  mapQuery: string;
  items: Trail[];
}

function TrailsEditor({ onClose }: { onClose: () => void }) {
  const data = useAdminData();
  const config = data.trails;
  const [form, setForm] = React.useState<TrailsForm>(() => ({
    eyebrow: config?.eyebrow ?? TRAIL_DEFAULTS.eyebrow,
    title: config?.title ?? TRAIL_DEFAULTS.title,
    description: config?.description ?? TRAIL_DEFAULTS.description,
    mapQuery: config?.mapQuery ?? TRAIL_DEFAULTS.mapQuery,
    items:
      config?.items && config.items.length > 0
        ? config.items.map((t) => ({ ...t }))
        : TRAIL_DEFAULTS.items.map((t) => ({ ...t })),
  }));
  const [saving, setSaving] = React.useState(false);

  function set<K extends keyof TrailsForm>(key: K, value: TrailsForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function updateItem(index: number, patch: Partial<Trail>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, ...patch } : it
      ),
    }));
  }
  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          difficulty: "Ușor",
          length: "",
          elevation: "",
          duration: "",
        },
      ],
    }));
  }
  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    await persist(
      {
        trails: {
          eyebrow: form.eyebrow.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          mapQuery: form.mapQuery.trim(),
          items: form.items
            .filter((t) => t.name.trim())
            .map((t) => ({
              name: t.name.trim(),
              difficulty: t.difficulty,
              length: t.length.trim(),
              elevation: t.elevation.trim(),
              duration: t.duration.trim(),
              gpx: t.gpx || undefined,
              description: t.description?.trim() || undefined,
              gallery: (t.gallery ?? []).map((g) => g.trim()).filter(Boolean),
            })),
        },
      },
      onClose
    );
    setSaving(false);
  }

  return (
    <>
      <div className="space-y-5 py-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="trails-eyebrow">Etichetă</Label>
            <Input
              id="trails-eyebrow"
              value={form.eyebrow}
              onChange={(e) => set("eyebrow", e.target.value)}
              placeholder={TRAIL_DEFAULTS.eyebrow}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trails-title">Titlu</Label>
            <Input
              id="trails-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={TRAIL_DEFAULTS.title}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trails-description">Descriere</Label>
          <Textarea
            id="trails-description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trails-mapquery">Localitate hartă (fallback)</Label>
          <Input
            id="trails-mapquery"
            value={form.mapQuery}
            onChange={(e) => set("mapQuery", e.target.value)}
            placeholder={TRAIL_DEFAULTS.mapQuery}
          />
          <p className="text-xs text-muted-foreground">
            Centrează harta când niciun traseu nu are fișier GPX încărcat.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Trasee</Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Adaugă
          </Button>
        </div>

        {form.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Niciun traseu adăugat încă.
          </p>
        ) : (
          <ul className="space-y-4">
            {form.items.map((it, i) => (
              <li
                key={i}
                className="space-y-3 rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Traseul {i + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(i)}
                    aria-label="Șterge traseul"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`trail-name-${i}`}>Nume</Label>
                    <Input
                      id={`trail-name-${i}`}
                      value={it.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Traseul Lacului Verde"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`trail-diff-${i}`}>Dificultate</Label>
                    <Select
                      value={it.difficulty}
                      onValueChange={(v) =>
                        updateItem(i, { difficulty: v as TrailDifficulty })
                      }
                    >
                      <SelectTrigger id={`trail-diff-${i}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRAIL_DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`trail-length-${i}`}>Lungime</Label>
                    <Input
                      id={`trail-length-${i}`}
                      value={it.length}
                      onChange={(e) =>
                        updateItem(i, { length: e.target.value })
                      }
                      placeholder="4,2 km"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`trail-elev-${i}`}>Diferență nivel</Label>
                    <Input
                      id={`trail-elev-${i}`}
                      value={it.elevation}
                      onChange={(e) =>
                        updateItem(i, { elevation: e.target.value })
                      }
                      placeholder="540 m"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`trail-duration-${i}`}>Durată</Label>
                    <Input
                      id={`trail-duration-${i}`}
                      value={it.duration}
                      onChange={(e) =>
                        updateItem(i, { duration: e.target.value })
                      }
                      placeholder="1h 30m"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`trail-desc-${i}`}>Descriere (opțional)</Label>
                  <Textarea
                    id={`trail-desc-${i}`}
                    value={it.description ?? ""}
                    onChange={(e) =>
                      updateItem(i, { description: e.target.value })
                    }
                    placeholder="O scurtă descriere a traseului, afișată la „Detalii”."
                  />
                </div>
                <GpxField
                  value={it.gpx}
                  onChange={(url) => updateItem(i, { gpx: url })}
                />
                <GalleryManager
                  images={it.gallery ?? []}
                  onImagesChange={(next) => updateItem(i, { gallery: next })}
                  cover={it.gallery?.[0] ?? ""}
                  onCoverChange={(url) =>
                    updateItem(i, {
                      gallery: [
                        url,
                        ...(it.gallery ?? []).filter((g) => g !== url),
                      ],
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <SaveFooter
        saving={saving}
        onCancel={onClose}
        onSave={() => void handleSave()}
      />
    </>
  );
}

// -------------------------------------------------- Content-backed / generic

function ContentBackedBody({
  sectionId,
  onClose,
}: {
  sectionId: string;
  onClose: () => void;
}) {
  const data = useAdminData();
  // On a resort the "exhibitors" homepage zone shows real accommodations, so
  // point its manager button at the Cazări module instead of Expozanți.
  const resolvedId =
    sectionId === "exhibitors" && data.eventType === "resort"
      ? "accommodations"
      : sectionId;
  const link = MODULE_LINKS[resolvedId];
  return (
    <>
      <p className="flex items-start gap-2 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {link
          ? link.explanation
          : "Această secțiune afișează conținut din modulele tale."}
      </p>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Închide
        </Button>
        {link ? (
          <Button asChild variant="gold" onClick={onClose}>
            <Link href={link.href}>
              {link.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}

// ------------------------------------------------ Custom section editor

/** Picker sources for admin-created sections (program is intentionally omitted). */
const CUSTOM_SOURCES: {
  value: CustomSectionSource;
  label: string;
  defaultHref: string;
}[] = [
  { value: "accommodations", label: "Cazări", defaultHref: "cazari" },
  { value: "restaurants", label: "Restaurante", defaultHref: "restaurante" },
  { value: "events", label: "Evenimente", defaultHref: "evenimente" },
  { value: "products", label: "Produse", defaultHref: "produse" },
  { value: "destinations", label: "Atracții", defaultHref: "destinatii" },
  { value: "exhibitors", label: "Expozanți", defaultHref: "expozanti" },
  { value: "gallery", label: "Galerie", defaultHref: "galerie" },
  { value: "news", label: "Noutăți", defaultHref: "noutati" },
];

/** Accommodation-type filter values (sentinel "all" = no filter). */
const ACCOMMODATION_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "Toate" },
  { value: "camping", label: "Camping" },
  { value: "cabana", label: "Cabană" },
  { value: "pensiune", label: "Pensiune" },
  { value: "hotel", label: "Hotel" },
  { value: "apartament", label: "Apartament" },
  { value: "vila", label: "Vilă" },
];

function defaultHrefFor(source: CustomSectionSource): string {
  return CUSTOM_SOURCES.find((s) => s.value === source)?.defaultHref ?? "";
}

/**
 * Auto-suggested hrefs for the accommodations source. Camping has its own public
 * page (`campinguri`); every other accommodation type lists under `cazari`.
 * These are the values we may safely overwrite when the source/type changes —
 * a user-customized href is never one of these, so it stays untouched.
 */
const AUTO_ACCOMMODATION_HREFS = new Set(["cazari", "campinguri"]);

function suggestedHref(source: CustomSectionSource, accType: string): string {
  if (source === "accommodations" && accType === "camping") return "campinguri";
  return defaultHrefFor(source);
}

interface CustomForm {
  source: CustomSectionSource;
  /** Sentinel "all" or an AccommodationType value. */
  accType: string;
  productCategory: string;
  title: string;
  eyebrow: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

function initCustomForm(section?: SectionConfig): CustomForm {
  const source = section?.source ?? "accommodations";
  return {
    source,
    accType:
      section?.source === "accommodations"
        ? section.filterValue || "all"
        : "all",
    productCategory:
      section?.source === "products" ? section.filterValue || "" : "",
    title: section?.title ?? section?.label ?? "",
    eyebrow: section?.eyebrow ?? "",
    description: section?.description ?? "",
    ctaLabel: section?.ctaLabel ?? "",
    ctaHref: section?.ctaHref ?? (section ? "" : defaultHrefFor(source)),
  };
}

/**
 * Create/edit form for an admin-created section. When `section` is provided the
 * form is prefilled for editing; otherwise it creates a new custom section.
 * State is seeded once via a lazy initializer (render-phase prefill — no
 * setState-in-effect), so the parent must remount it per-open with a key.
 */
function CustomSectionEditor({
  section,
  onClose,
}: {
  section?: SectionConfig;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<CustomForm>(() =>
    initCustomForm(section)
  );
  const [saving, setSaving] = React.useState(false);

  function set<K extends keyof CustomForm>(key: K, value: CustomForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function changeSource(next: CustomSectionSource) {
    setForm((prev) => ({
      ...prev,
      source: next,
      accType: "all",
      productCategory: "",
      ctaHref: suggestedHref(next, "all"),
    }));
  }

  // Switching the accommodation type re-suggests the "Vezi tot" href (camping →
  // `campinguri`, otherwise `cazari`) but never clobbers a user-customized link.
  function changeAccType(next: string) {
    setForm((prev) => {
      const ctaHref =
        prev.ctaHref.trim() === "" ||
        AUTO_ACCOMMODATION_HREFS.has(prev.ctaHref.trim())
          ? suggestedHref(prev.source, next)
          : prev.ctaHref;
      return { ...prev, accType: next, ctaHref };
    });
  }

  function handleSave() {
    const title = form.title.trim();
    if (!title) {
      toast.error("Adaugă un titlu pentru secțiune.");
      return;
    }

    let filterField: string | undefined;
    let filterValue: string | undefined;
    if (form.source === "accommodations" && form.accType !== "all") {
      filterField = "type";
      filterValue = form.accType;
    } else if (form.source === "products" && form.productCategory.trim()) {
      filterField = "category";
      filterValue = form.productCategory.trim();
    }

    const shared = {
      label: title,
      title,
      source: form.source,
      filterField,
      filterValue,
      eyebrow: form.eyebrow.trim() || undefined,
      description: form.description.trim() || undefined,
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaHref: form.ctaHref.trim() || undefined,
      limit: 6,
    };

    setSaving(true);
    if (section) {
      updateSection(section.id, shared);
      toast.success("Secțiunea a fost actualizată.");
    } else {
      const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
      addSection({ id, visible: true, custom: true, ...shared });
      toast.success("Secțiunea a fost adăugată.");
    }
    setSaving(false);
    onClose();
  }

  return (
    <>
      <div className="space-y-5 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="cs-source">Sursă</Label>
          <Select
            value={form.source}
            onValueChange={(v) => changeSource(v as CustomSectionSource)}
          >
            <SelectTrigger id="cs-source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOM_SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Conținutul afișat provine din acest modul.
          </p>
        </div>

        {form.source === "accommodations" ? (
          <div className="space-y-1.5">
            <Label htmlFor="cs-acc-type">Tip cazare</Label>
            <Select value={form.accType} onValueChange={changeAccType}>
              <SelectTrigger id="cs-acc-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOMMODATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {form.source === "products" ? (
          <div className="space-y-1.5">
            <Label htmlFor="cs-product-cat">Categorie (opțional)</Label>
            <Input
              id="cs-product-cat"
              value={form.productCategory}
              onChange={(e) => set("productCategory", e.target.value)}
              placeholder="Ex: Miere"
            />
          </div>
        ) : null}

        {MODULE_LINKS[form.source]
          ? (() => {
              const typedAcc =
                form.source === "accommodations" && form.accType !== "all";
              const typeLabel = typedAcc
                ? ACCOMMODATION_TYPES.find((t) => t.value === form.accType)
                    ?.label ?? form.accType
                : "";
              // Deep-link straight into the create form with the type prefilled.
              // Camping is managed in its own module (Campinguri); other
              // accommodation types stay in the Cazări module.
              const manageHref =
                form.accType === "camping"
                  ? "/admin/campinguri?nou=camping"
                  : typedAcc
                    ? `${MODULE_LINKS.accommodations.href}?nou=${form.accType}`
                    : MODULE_LINKS[form.source].href;
              const manageCta = typedAcc
                ? `Adaugă ${typeLabel.toLowerCase()}`
                : MODULE_LINKS[form.source].cta;
              return (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    {typedAcc
                      ? `„${typeLabel}” este un tip de cazare. Butonul deschide direct formularul cu tipul „${typeLabel}” pre-completat.`
                      : "Adaugi conținutul în această secțiune din modulul respectiv."}
                  </p>
                  <Button asChild variant="outline" size="sm" onClick={onClose}>
                    <Link href={manageHref}>
                      {manageCta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })()
          : null}

        <div className="space-y-1.5">
          <Label htmlFor="cs-title">Titlu</Label>
          <Input
            id="cs-title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex: Campinguri"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cs-eyebrow">Etichetă (opțional)</Label>
          <Input
            id="cs-eyebrow"
            value={form.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
            placeholder="Ex: Natură & aventură"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cs-description">Descriere (opțional)</Label>
          <Textarea
            id="cs-description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Un scurt text de introducere pentru secțiune."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cs-cta-label">Buton „Vezi tot” (opțional)</Label>
            <Input
              id="cs-cta-label"
              value={form.ctaLabel}
              onChange={(e) => set("ctaLabel", e.target.value)}
              placeholder="Vezi tot"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-cta-href">Link buton (opțional)</Label>
            <Input
              id="cs-cta-href"
              value={form.ctaHref}
              onChange={(e) => set("ctaHref", e.target.value)}
              placeholder="cazari"
            />
          </div>
        </div>
      </div>
      <SaveFooter saving={saving} onCancel={onClose} onSave={handleSave} />
    </>
  );
}

/** "Adaugă secțiune" button + its create dialog for a new custom section. */
export function AddSectionButton() {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <>
      <Button variant="gold" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Adaugă secțiune
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adaugă o secțiune personalizată</DialogTitle>
            <DialogDescription>
              Afișează o selecție filtrată din conținutul tău pe pagina
              principală.
            </DialogDescription>
          </DialogHeader>
          {open ? <CustomSectionEditor key="create" onClose={close} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ------------------------------------------------------------------- Wrapper

/**
 * "Configurează" button + its dialog for a single homepage section. Keeps its
 * own open state; the dialog remounts its editor each time it opens so the form
 * always reflects the latest store snapshot (no setState-in-effect needed).
 */
export function SectionConfigButton({ section }: { section: SectionConfig }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const inline = INLINE_EDITORS.has(section.id);
  const isCustom = section.custom === true;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Configurează secțiunea ${section.label}`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Configurează
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "max-h-[85vh] overflow-y-auto",
            inline ? "max-w-2xl" : "max-w-lg"
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {isCustom
                ? `Editează: ${section.label}`
                : `Configurează: ${section.label}`}
            </DialogTitle>
            <DialogDescription>
              {isCustom
                ? "Editează sursa, filtrul și textele acestei secțiuni personalizate."
                : inline
                  ? "Setează conținutul afișat în această zonă a paginii principale."
                  : "Detalii despre această zonă și unde se administrează conținutul ei."}
            </DialogDescription>
          </DialogHeader>

          {/* Remount the editor per-open via the `open` key so it re-reads the
              store snapshot on each open — a render-phase prefill, not an effect. */}
          {open ? (
            isCustom ? (
              <CustomSectionEditor key="custom" section={section} onClose={close} />
            ) : section.id === "hero" ? (
              <HeroEditor key="hero" onClose={close} />
            ) : section.id === "about" ? (
              <AboutEditor key="about" onClose={close} />
            ) : section.id === "experiences" ? (
              <ExperiencesEditor key="experiences" onClose={close} />
            ) : section.id === "conditions" ? (
              <ConditionsEditor key="conditions" onClose={close} />
            ) : section.id === "trails" ? (
              <TrailsEditor key="trails" onClose={close} />
            ) : (
              <ContentBackedBody sectionId={section.id} onClose={close} />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
