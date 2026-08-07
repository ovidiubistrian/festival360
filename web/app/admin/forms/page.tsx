"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/admin/status-badge";
import { Field } from "@/components/admin/field";
import { FormBuilder } from "@/components/admin/form-builder";
import { FormSubmissionsDialog } from "@/components/admin/form-submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteForm,
  listForms,
  moveForm,
  saveForm,
  toggleFormStatus,
  type FormPatch,
} from "@/lib/admin/forms";
import { FORM_TEMPLATES } from "@/lib/admin/form-templates";
import { getCurrentTenant, useSession } from "@/lib/admin/session";
import type { FormDefinition } from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

/** Linkul public al formularului, gata de trimis expozanților. */
function publicUrl(tenant: string | null, slug: string): string {
  if (!tenant || !slug) return "";
  const origin =
    typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/${tenant}/formular/${slug}`;
}

export default function FormsPage() {
  // Subscribe so tenant-switch / role changes re-render this page.
  useSession();

  // Client-mount flag without a mount effect (repo lints set-state-in-effect).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const activeTenant = mounted ? getCurrentTenant() : null;

  const [forms, setForms] = React.useState<FormDefinition[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadedTenant, setLoadedTenant] = React.useState<string | null>(null);

  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<FormPatch | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [submissionsFor, setSubmissionsFor] =
    React.useState<FormDefinition | null>(null);

  // Load the tenant's forms — render-phase guard keyed on the tenant, so a
  // super-admin switching sites reloads automatically.
  if (activeTenant && activeTenant !== loadedTenant) {
    setLoadedTenant(activeTenant);
    setLoading(true);
    void (async () => {
      setForms(await listForms());
      setLoading(false);
    })();
  }

  async function reload() {
    setForms(await listForms());
  }

  function startFromTemplate(key: string) {
    const template = FORM_TEMPLATES.find((t) => t.key === key);
    if (!template) return;
    setDraft(template.build());
    setEditingId(null);
    setTemplateOpen(false);
    setEditorOpen(true);
  }

  function openEdit(form: FormDefinition) {
    setDraft({
      slug: form.slug,
      title: form.title,
      description: form.description,
      fields: form.fields ?? [],
      submitLabel: form.submitLabel,
      successMessage: form.successMessage,
      showOrganization: form.showOrganization,
      status: form.status,
      notifyEmail: form.notifyEmail ?? "",
    });
    setEditingId(form.id);
    setEditorOpen(true);
  }

  function setDraftValue<K extends keyof FormPatch>(
    key: K,
    value: FormPatch[K]
  ) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function save() {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      toast.error("Formularul are nevoie de un titlu.");
      return;
    }
    const empty = draft.fields.find((f) => !f.label.trim());
    if (empty) {
      toast.error("Fiecare câmp are nevoie de o etichetă.");
      return;
    }
    const patch: FormPatch = {
      ...draft,
      title,
      slug: draft.slug.trim() || slugify(title),
    };
    setSaving(true);
    const result = await saveForm(patch, editingId ?? undefined);
    setSaving(false);
    if (!result.form) {
      toast.error(result.error ?? "Salvarea formularului a eșuat.");
      return;
    }
    await reload();
    setEditorOpen(false);
    toast.success(editingId ? "Formular actualizat." : "Formular creat.");
  }

  async function remove(form: FormDefinition) {
    const ok = await deleteForm(form.id);
    if (!ok) {
      toast.error("Nu am putut șterge formularul.");
      return;
    }
    await reload();
    toast.success("Formular șters, împreună cu cererile lui.");
  }

  async function onToggleStatus(form: FormDefinition) {
    const published = form.status === "published";
    setForms((list) =>
      list.map((f) =>
        f.id === form.id
          ? { ...f, status: published ? "draft" : "published" }
          : f
      )
    );
    const ok = await toggleFormStatus(form.id);
    if (!ok) {
      toast.error("Nu am putut schimba starea formularului.");
    } else {
      toast.success(
        published
          ? "Formular trecut în ciornă — linkul nu mai funcționează."
          : "Formular publicat — linkul e activ."
      );
    }
    await reload();
  }

  async function move(form: FormDefinition, dir: -1 | 1) {
    await moveForm(form.id, dir);
    await reload();
  }

  async function copyLink(form: FormDefinition) {
    const url = publicUrl(activeTenant, form.slug);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Linkul formularului a fost copiat.");
    } catch {
      toast.error("Nu am putut copia linkul.", { description: url });
    }
  }

  return (
    <AdminShell
      title="Formulare"
      description="Construiește formulare proprii (cerere de înscriere expozant, solicitare parteneriat…) și trimite-le ca link. Cererile primite ajung aici, nu pe email-ul personal. Datele asociației se completează o dată, în Setări → Organizator, și apar în subsolul fiecărui formular."
      actions={
        <Button
          variant="gold"
          size="sm"
          onClick={() => setTemplateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Adaugă
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordine</TableHead>
                <TableHead>Formular</TableHead>
                <TableHead>Link public</TableHead>
                <TableHead>Cereri</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Se încarcă formularele…
                    </span>
                  </TableCell>
                </TableRow>
              ) : forms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Niciun formular încă. Pornește de la șablonul „Cerere de
                      înscriere expozant” și modifică-l cum ai nevoie.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                forms.map((form, index) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0}
                          onClick={() => void move(form, -1)}
                          aria-label="Mută mai sus"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === forms.length - 1}
                          onClick={() => void move(form, 1)}
                          aria-label="Mută mai jos"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {form.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {form.fields?.length ?? 0} câmpuri
                      </p>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs text-muted-foreground">
                          /{activeTenant}/formular/{form.slug}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => void copyLink(form)}
                          aria-label="Copiază linkul"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {form.status === "published" ? (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                          >
                            <a
                              href={`/${activeTenant}/formular/${form.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Deschide formularul"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSubmissionsFor(form)}
                        className="inline-flex items-center gap-2"
                      >
                        <Badge
                          variant={
                            (form.unreadCount ?? 0) > 0 ? "terracotta" : "muted"
                          }
                        >
                          {form.submissionCount ?? 0}
                        </Badge>
                        {(form.unreadCount ?? 0) > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {form.unreadCount} noi
                          </span>
                        ) : null}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={form.status === "published"}
                          onCheckedChange={() => void onToggleStatus(form)}
                          aria-label="Publică formularul"
                        />
                        <StatusBadge status={form.status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSubmissionsFor(form)}
                          aria-label="Vezi cererile"
                        >
                          <Inbox className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(form)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={`formularul „${form.title}” și cererile primite`}
                          onConfirm={() => void remove(form)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Șterge"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alegerea șablonului */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>De unde pornim?</DialogTitle>
            <DialogDescription>
              Un șablon e doar un punct de plecare — poți adăuga, edita sau
              șterge orice câmp după aceea.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {FORM_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => startFromTemplate(template.key)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50"
              >
                <p className="font-medium text-foreground">{template.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Constructorul de formular */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editează formularul" : "Formular nou"}
            </DialogTitle>
            <DialogDescription>
              Titlul, textul introductiv și câmpurile pe care le completează
              solicitantul. Linkul public se construiește din adresă.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Titlu" className="sm:col-span-2">
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraftValue("title", e.target.value)}
                    placeholder="ex. Cerere de înscriere expozant"
                  />
                </Field>
                <Field
                  label="Adresă (link)"
                  hint={
                    activeTenant
                      ? `/${activeTenant}/formular/${draft.slug || slugify(draft.title) || "…"}`
                      : "Lăsat gol → generat din titlu"
                  }
                  className="sm:col-span-2"
                >
                  <Input
                    value={draft.slug}
                    onChange={(e) => setDraftValue("slug", e.target.value)}
                    placeholder="cerere-inscriere-expozant"
                  />
                </Field>
                <Field label="Text introductiv" className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={draft.description}
                    onChange={(e) =>
                      setDraftValue("description", e.target.value)
                    }
                    placeholder="Apare sub titlu, pe pagina publică."
                  />
                </Field>
                <Field
                  label="Notifică pe email"
                  hint="Adresa care primește o înștiințare la fiecare cerere. Necesită SMTP configurat în Marketing."
                >
                  <Input
                    type="email"
                    value={draft.notifyEmail ?? ""}
                    onChange={(e) =>
                      setDraftValue("notifyEmail", e.target.value)
                    }
                    placeholder="office@exemplu.ro"
                  />
                </Field>
                <Field label="Text buton" hint="Gol → „Trimite cererea”">
                  <Input
                    value={draft.submitLabel}
                    onChange={(e) =>
                      setDraftValue("submitLabel", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Mesaj după trimitere"
                  className="sm:col-span-2"
                  hint="Ce vede solicitantul după ce trimite cererea."
                >
                  <Input
                    value={draft.successMessage}
                    onChange={(e) =>
                      setDraftValue("successMessage", e.target.value)
                    }
                    placeholder="Am primit cererea ta. Revenim cu confirmarea pe email."
                  />
                </Field>
                <label className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 sm:col-span-2">
                  <Switch
                    checked={draft.showOrganization}
                    onCheckedChange={(v) =>
                      setDraftValue("showOrganization", v)
                    }
                  />
                  <span className="text-sm">
                    Arată datele organizatorului în subsolul formularului
                    <span className="block text-xs text-muted-foreground">
                      Denumire, CIF, adresă, IBAN — se editează în Setări →
                      Organizator.
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Câmpurile formularului
                </p>
                <FormBuilder
                  fields={draft.fields}
                  onChange={(fields) => setDraftValue("fields", fields)}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Renunță
            </Button>
            <Button variant="gold" onClick={() => void save()} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {editingId ? "Salvează" : "Creează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormSubmissionsDialog
        form={submissionsFor}
        open={!!submissionsFor}
        onOpenChange={(open) => !open && setSubmissionsFor(null)}
        onChanged={() => void reload()}
      />
    </AdminShell>
  );
}
