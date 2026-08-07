"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Field } from "@/components/admin/field";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import {
  updateOrganization,
  updateSeo,
  updateSettings,
  useAdminData,
  type AdminSettings,
} from "@/lib/admin/store";
import type { OrganizationInfo, SeoConfig } from "@/lib/tenants/types";
import { toast } from "sonner";

const PLATFORM_DOMAIN =
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "siteora.ro";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
          aria-label={`${label} — selector culoare`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const data = useAdminData();
  const isResort = data.eventType === "resort";
  // Vertical-aware wording (resort speaks about a "stațiune", not a "festival").
  const noun = isResort ? "stațiunii" : "festivalului";
  const nameLabel = isResort ? "Nume stațiune" : "Nume festival";
  const [form, setForm] = React.useState<AdminSettings>(data.settings);
  // Resync the form when the stored settings reference changes (e.g. after a
  // demo reset), adjusted during render instead of in a set-state effect.
  const [syncedSettings, setSyncedSettings] = React.useState(data.settings);
  if (data.settings !== syncedSettings) {
    setSyncedSettings(data.settings);
    setForm(data.settings);
  }

  // Datele organizatorului — sincronizate la fel ca SEO.
  const [orgForm, setOrgForm] = React.useState<OrganizationInfo>(
    data.organization
  );
  const [syncedOrg, setSyncedOrg] = React.useState(data.organization);
  if (data.organization !== syncedOrg) {
    setSyncedOrg(data.organization);
    setOrgForm(data.organization);
  }

  // SEO form — synced against the stored `seo` reference the same way.
  const [seoForm, setSeoForm] = React.useState<SeoConfig>(data.seo);
  const [syncedSeo, setSyncedSeo] = React.useState(data.seo);
  if (data.seo !== syncedSeo) {
    setSyncedSeo(data.seo);
    setSeoForm(data.seo);
  }

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setSeo<K extends keyof SeoConfig>(key: K, value: SeoConfig[K]) {
    setSeoForm((f) => ({ ...f, [key]: value }));
  }

  function setOrg<K extends keyof OrganizationInfo>(
    key: K,
    value: OrganizationInfo[K]
  ) {
    setOrgForm((f) => ({ ...f, [key]: value }));
  }

  function saveOrganization() {
    updateOrganization(orgForm);
    toast.success("Datele organizatorului au fost salvate.");
  }

  function saveSeo() {
    updateSeo(seoForm);
    toast.success("Setările SEO au fost salvate.");
  }

  // Live Google-result preview values (with the same fallbacks the site uses).
  const previewTitle =
    seoForm.title?.trim() ||
    (form.name && form.tagline
      ? `${form.name} — ${form.tagline}`
      : form.name || "Titlul site-ului");
  const previewDescription =
    seoForm.description?.trim() ||
    form.shortDescription ||
    "Descrierea site-ului apare aici, sub titlu, în rezultatele căutării.";

  function saveSection(keys: (keyof AdminSettings)[], message: string) {
    const patch: Partial<AdminSettings> = {};
    for (const k of keys) {
      patch[k] = form[k];
    }
    updateSettings(patch);
    toast.success(message);
  }

  return (
    <AdminShell
      title="Setări"
      description={`Informațiile globale ale ${noun} (nume, contact, social) și identitatea vizuală — logo, culori și imaginea hero.`}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact & social</TabsTrigger>
          <TabsTrigger value="brand">Identitate vizuală</TabsTrigger>
          <TabsTrigger value="organizer">Organizator</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informații generale</CardTitle>
              <CardDescription>
                Numele, descrierea și {isResort ? "locația" : "datele"}{" "}
                {noun}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={nameLabel}>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
                <Field label="Text logo">
                  <Input
                    value={form.logoText}
                    onChange={(e) => set("logoText", e.target.value)}
                  />
                </Field>
                <Field label="Slogan" className="sm:col-span-2">
                  <Input
                    value={form.tagline}
                    onChange={(e) => set("tagline", e.target.value)}
                  />
                </Field>
                <Field label="Descriere scurtă" className="sm:col-span-2">
                  <Textarea
                    value={form.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    rows={3}
                  />
                </Field>
                {!isResort && (
                  <>
                    <Field label="Data început">
                      <Input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set("startDate", e.target.value)}
                      />
                    </Field>
                    <Field label="Data sfârșit">
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => set("endDate", e.target.value)}
                      />
                    </Field>
                  </>
                )}
                <Field label="Locație">
                  <Input
                    value={form.locationName}
                    onChange={(e) => set("locationName", e.target.value)}
                  />
                </Field>
                <Field label="Oraș">
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <Field label="Județ">
                  <Input
                    value={form.county}
                    onChange={(e) => set("county", e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="gold"
                  onClick={() =>
                    saveSection(
                      [
                        "name",
                        "logoText",
                        "tagline",
                        "shortDescription",
                        "startDate",
                        "endDate",
                        "locationName",
                        "city",
                        "county",
                      ],
                      "Informațiile generale au fost salvate."
                    )
                  }
                >
                  <Save className="h-4 w-4" />
                  Salvează
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact & social */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact & rețele sociale</CardTitle>
              <CardDescription>
                Datele de contact și linkurile către rețelele sociale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Telefon">
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="Facebook">
                  <Input
                    value={form.facebook}
                    onChange={(e) => set("facebook", e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </Field>
                <Field label="Instagram">
                  <Input
                    value={form.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </Field>
                <Field label="YouTube" className="sm:col-span-2">
                  <Input
                    value={form.youtube}
                    onChange={(e) => set("youtube", e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="gold"
                  onClick={() =>
                    saveSection(
                      ["email", "phone", "facebook", "instagram", "youtube"],
                      "Datele de contact au fost salvate."
                    )
                  }
                >
                  <Save className="h-4 w-4" />
                  Salvează
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand */}
        <TabsContent value="brand">
          <Card>
            <CardHeader>
              <CardTitle>Identitate vizuală</CardTitle>
              <CardDescription>
                Culorile temei și imaginea principală (hero).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <ColorField
                  label="Culoare primară"
                  value={form.primaryColor}
                  onChange={(v) => set("primaryColor", v)}
                />
                <ColorField
                  label="Culoare secundară"
                  value={form.secondaryColor}
                  onChange={(v) => set("secondaryColor", v)}
                />
                <ColorField
                  label="Culoare auriu"
                  value={form.goldColor}
                  onChange={(v) => set("goldColor", v)}
                />
              </div>
              <div className="space-y-2">
                <MediaPicker
                  label="Logo (imagine)"
                  value={form.logoImage}
                  onChange={(url) => set("logoImage", url)}
                />
                <p className="text-xs text-muted-foreground">
                  Opțional. Când e setat, se afișează în antet în locul textului
                  „{form.logoText || "logo"}”. PNG cu fundal transparent, ideal.
                </p>
                {form.logoImage ? (
                  <div className="inline-flex items-center rounded-xl border border-border bg-primary p-4">
                    <ImageWithFallback
                      src={form.logoImage}
                      alt="Previzualizare logo"
                      width={160}
                      height={48}
                      unoptimized
                      className="h-12 w-auto object-contain"
                      fallbackLabel="Logo"
                    />
                  </div>
                ) : null}
              </div>
              <MediaPicker
                label="Imagine hero"
                value={form.heroImage}
                onChange={(url) => set("heroImage", url)}
              />
              {form.heroImage ? (
                <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl bg-secondary">
                  <ImageWithFallback
                    src={form.heroImage}
                    alt="Previzualizare imagine hero"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                    fallbackLabel="Previzualizare hero"
                  />
                </div>
              ) : null}
              <div className="flex justify-end">
                <Button
                  variant="gold"
                  onClick={() =>
                    saveSection(
                      [
                        "primaryColor",
                        "secondaryColor",
                        "goldColor",
                        "logoImage",
                        "heroImage",
                      ],
                      "Identitatea vizuală a fost salvată."
                    )
                  }
                >
                  <Save className="h-4 w-4" />
                  Salvează
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizator (datele juridice folosite în formulare) */}
        <TabsContent value="organizer">
          <Card>
            <CardHeader>
              <CardTitle>Datele organizatorului</CardTitle>
              <CardDescription>
                Entitatea juridică din spatele evenimentului (asociație,
                fundație, primărie). Se completează o singură dată și apare ca
                subsol în fiecare formular publicat — cerere de înscriere,
                parteneriat și așa mai departe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Denumire" className="sm:col-span-2">
                  <Input
                    value={orgForm.name ?? ""}
                    onChange={(e) => setOrg("name", e.target.value)}
                    placeholder="ex. Asociația Construim o Țară"
                  />
                </Field>
                <Field label="CIF / CUI">
                  <Input
                    value={orgForm.cif ?? ""}
                    onChange={(e) => setOrg("cif", e.target.value)}
                    placeholder="ex. 50649579"
                  />
                </Field>
                <Field label="Nr. Reg. Com. / Reg. asociații">
                  <Input
                    value={orgForm.regCom ?? ""}
                    onChange={(e) => setOrg("regCom", e.target.value)}
                  />
                </Field>
                <Field label="Adresă" className="sm:col-span-2">
                  <Input
                    value={orgForm.address ?? ""}
                    onChange={(e) => setOrg("address", e.target.value)}
                    placeholder="ex. Str. Mr. Ion Racoțeanu nr. 10, Sector 3"
                  />
                </Field>
                <Field label="Localitate">
                  <Input
                    value={orgForm.city ?? ""}
                    onChange={(e) => setOrg("city", e.target.value)}
                    placeholder="ex. București"
                  />
                </Field>
                <Field label="Județ">
                  <Input
                    value={orgForm.county ?? ""}
                    onChange={(e) => setOrg("county", e.target.value)}
                  />
                </Field>
                <Field label="IBAN">
                  <Input
                    value={orgForm.iban ?? ""}
                    onChange={(e) => setOrg("iban", e.target.value)}
                    placeholder="RO70BREL0002004727700100"
                  />
                </Field>
                <Field label="Bancă">
                  <Input
                    value={orgForm.bank ?? ""}
                    onChange={(e) => setOrg("bank", e.target.value)}
                    placeholder="ex. Libra Bank"
                  />
                </Field>
                <Field label="Email de contact">
                  <Input
                    type="email"
                    value={orgForm.email ?? ""}
                    onChange={(e) => setOrg("email", e.target.value)}
                    placeholder="office@exemplu.ro"
                  />
                </Field>
                <Field label="Telefon">
                  <Input
                    value={orgForm.phone ?? ""}
                    onChange={(e) => setOrg("phone", e.target.value)}
                  />
                </Field>
                <Field
                  label="Mențiuni suplimentare"
                  className="sm:col-span-2"
                  hint="Rând liber sub restul datelor (cod TVA, mențiuni legale)."
                >
                  <Textarea
                    rows={2}
                    value={orgForm.note ?? ""}
                    onChange={(e) => setOrg("note", e.target.value)}
                  />
                </Field>
              </div>

              {/* Previzualizarea subsolului, exact cum apare în formulare */}
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Așa apare în subsolul formularelor
                </p>
                <p className="text-sm text-charcoal/80">
                  {[
                    orgForm.name,
                    [orgForm.address, orgForm.city, orgForm.county]
                      .filter(Boolean)
                      .join(", "),
                    orgForm.cif ? `CIF: ${orgForm.cif}` : "",
                    orgForm.regCom,
                    [orgForm.iban, orgForm.bank].filter(Boolean).join(" – "),
                    orgForm.email,
                    orgForm.phone,
                    orgForm.note,
                  ]
                    .filter((part) => part && String(part).trim())
                    .join(" | ") || "Completează datele de mai sus."}
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="gold" onClick={saveOrganization}>
                  <Save className="h-4 w-4" />
                  Salvează
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Optimizare pentru motoarele de căutare</CardTitle>
              <CardDescription>
                Controlează cum apare site-ul în Google și în distribuirile pe
                rețelele sociale. Câmpurile lăsate goale folosesc valori
                implicite bune (nume, slogan, descriere scurtă, imagine hero).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Google-result preview */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Previzualizare în Google
                </p>
                <div className="max-w-xl">
                  <p className="truncate text-sm text-[#1a0dab]">
                    {previewTitle}
                  </p>
                  <p className="truncate text-xs text-[#006621]">
                    {PLATFORM_DOMAIN}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-charcoal/70">
                    {previewDescription}
                  </p>
                </div>
              </div>

              <Field
                label="Titlu SEO"
                hint={`~60 de caractere. ${(seoForm.title ?? "").length}/60 folosite. Gol → „Nume — Slogan”.`}
              >
                <Input
                  value={seoForm.title ?? ""}
                  onChange={(e) => setSeo("title", e.target.value)}
                  placeholder={
                    form.name && form.tagline
                      ? `${form.name} — ${form.tagline}`
                      : "Titlul afișat în tab și în rezultate"
                  }
                />
              </Field>

              <Field
                label="Descriere SEO"
                hint={`~155 de caractere. ${(seoForm.description ?? "").length}/155 folosite. Gol → descrierea scurtă.`}
              >
                <Textarea
                  value={seoForm.description ?? ""}
                  onChange={(e) => setSeo("description", e.target.value)}
                  rows={3}
                  placeholder={
                    form.shortDescription ||
                    "Un rezumat scurt care apare sub titlu în rezultatele căutării."
                  }
                />
              </Field>

              <Field
                label="Cuvinte cheie"
                hint="Separate prin virgulă, ex: „cazare Brașov, pensiune munte, sejur”."
              >
                <Input
                  value={seoForm.keywords ?? ""}
                  onChange={(e) => setSeo("keywords", e.target.value)}
                  placeholder="cuvânt cheie 1, cuvânt cheie 2, …"
                />
              </Field>

              <div className="space-y-2">
                <MediaPicker
                  label="Imagine pentru share (Open Graph)"
                  value={seoForm.ogImage ?? ""}
                  onChange={(url) => setSeo("ogImage", url)}
                />
                <p className="text-xs text-muted-foreground">
                  Apare când site-ul e distribuit pe Facebook, WhatsApp sau
                  LinkedIn. Ideal 1200×630 px. Gol → imaginea hero.
                </p>
              </div>

              <Field
                label="Cod verificare Google Search Console"
                hint="Doar conținutul din meta „google-site-verification” (fără tag)."
              >
                <Input
                  value={seoForm.googleSiteVerification ?? ""}
                  onChange={(e) =>
                    setSeo("googleSiteVerification", e.target.value)
                  }
                  placeholder="ex: aBcD1234…"
                />
              </Field>

              <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="seo-noindex">
                    Ascunde de motoarele de căutare
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Când e activ, site-ul nu este indexat de Google (noindex).
                    Folosește doar pentru site-uri în lucru.
                  </p>
                </div>
                <Switch
                  id="seo-noindex"
                  checked={seoForm.noindex ?? false}
                  onCheckedChange={(checked) => setSeo("noindex", checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button variant="gold" onClick={saveSeo}>
                  <Save className="h-4 w-4" />
                  Salvează
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
