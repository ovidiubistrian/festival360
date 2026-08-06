"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Ticket,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/admin/status-badge";
import { Field } from "@/components/admin/field";
import { MediaPicker } from "@/components/admin/media-picker";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { Pager } from "@/components/admin/pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteItem,
  moveItem,
  toggleStatus,
  upsertItem,
  useAdminData,
  newId,
} from "@/lib/admin/store";
import type { Event, EventProgramItem, PublishStatus } from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const PAGE_SIZE = 8;

/** Compact Romanian date for the table, ex: "14 aug. 2026". Empty → "—". */
function shortDate(iso: string): string {
  const v = iso?.trim();
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function tableDate(event: Event): string {
  const start = shortDate(event.startDate);
  const end = shortDate(event.endDate);
  if (start && end && event.startDate !== event.endDate) {
    return `${start} – ${end}`;
  }
  return start || end || "—";
}

function emptyEvent(): Event {
  return {
    id: newId("ev"),
    slug: "",
    title: "",
    coverImage: "",
    gallery: [],
    shortDescription: "",
    description: "",
    startDate: "",
    endDate: "",
    timeLabel: "",
    location: "",
    program: [],
    ticketUrl: "",
    ticketLabel: "",
    featured: false,
    status: "draft",
    sortOrder: 0,
  };
}

export default function EventsPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Event>(() => emptyEvent());

  const events = React.useMemo(() => data.events ?? [], [data.events]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      const matchesQ =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [events, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  // Reset to first page when filters change (during render, not in an effect).
  const filterSig = `${query}|${statusFilter}`;
  const [lastFilterSig, setLastFilterSig] = React.useState(filterSig);
  if (filterSig !== lastFilterSig) {
    setLastFilterSig(filterSig);
    setPage(1);
  }

  function openAdd() {
    setForm(emptyEvent());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Event) {
    setForm({ ...item, program: item.program.map((p) => ({ ...p })) });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Event>(key: K, value: Event[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // --- Program editor helpers -------------------------------------------------
  function addProgramRow() {
    setForm((f) => ({
      ...f,
      program: [...f.program, { time: "", title: "", description: "" }],
    }));
  }
  function updateProgramRow(index: number, patch: Partial<EventProgramItem>) {
    setForm((f) => ({
      ...f,
      program: f.program.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }
  function removeProgramRow(index: number) {
    setForm((f) => ({
      ...f,
      program: f.program.filter((_, i) => i !== index),
    }));
  }
  function moveProgramRow(index: number, dir: -1 | 1) {
    setForm((f) => {
      const next = index + dir;
      if (next < 0 || next >= f.program.length) return f;
      const copy = f.program.map((p) => ({ ...p }));
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return { ...f, program: copy };
    });
  }

  function save() {
    if (!form.title.trim()) {
      toast.error("Titlul evenimentului este obligatoriu.");
      return;
    }
    const item: Event = {
      ...form,
      slug: form.slug.trim() || slugify(form.title),
      program: form.program
        .filter((p) => p.time.trim() || p.title.trim() || p.description.trim())
        .map((p) => ({
          time: p.time.trim(),
          title: p.title.trim(),
          description: p.description.trim(),
        })),
    };
    upsertItem("events", item);
    toast.success(isEdit ? "Eveniment actualizat." : "Eveniment adăugat.");
    setDialogOpen(false);
  }

  function remove(item: Event) {
    deleteItem("events", item.id);
    toast.success("Eveniment șters.");
  }

  function onToggle(item: Event) {
    toggleStatus("events", item.id);
    toast.success(
      item.status === "published"
        ? "Eveniment trecut în ciornă."
        : "Eveniment publicat."
    );
  }

  function move(item: Event, dir: -1 | 1) {
    moveItem("events", item.id, dir);
  }

  return (
    <AdminShell
      title="Evenimente"
      description="Evenimentele afișate în secțiunea Evenimente de pe site și în paginile lor de detaliu (/evenimente)."
      actions={
        <Button variant="gold" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Adaugă
        </Button>
      }
    >
      <DataToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Caută după titlu sau locație..."
        filter={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" aria-label="Filtru status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titlu</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Locație</TableHead>
                <TableHead>Bilete</TableHead>
                <TableHead>Evidențiat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Ticket className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Niciun eveniment găsit pentru filtrele curente.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((e, idx) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-foreground">
                      {e.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tableDate(e)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.location || "—"}
                    </TableCell>
                    <TableCell>
                      {e.ticketUrl.trim() ? (
                        <Ticket className="h-4 w-4 text-terracotta" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {e.featured ? (
                        <Star className="h-4 w-4 fill-gold text-gold" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={e.status === "published"}
                          onCheckedChange={() => onToggle(e)}
                          aria-label="Comută statusul de publicare"
                        />
                        <StatusBadge status={e.status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(e, -1)}
                          disabled={idx === 0 && current === 1}
                          aria-label="Mută mai sus"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(e, 1)}
                          disabled={
                            current === totalPages &&
                            idx === pageItems.length - 1
                          }
                          aria-label="Mută mai jos"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(e)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={e.title}
                          onConfirm={() => remove(e)}
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

      <Pager
        page={current}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPage={setPage}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editează eveniment" : "Adaugă eveniment"}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile evenimentului.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titlu" className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Serile de jazz la lac"
              />
            </Field>
            <Field label="Slug" hint="Lăsat gol → generat automat din titlu">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="serile-de-jazz-la-lac"
              />
            </Field>
            <Field label="Locație" hint="ex: Terasa lacului, Amfiteatru">
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Terasa lacului"
              />
            </Field>
            <Field label="Data început">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
            <Field label="Data sfârșit" hint="Lasă gol pentru un eveniment de o zi">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </Field>
            <Field label="Interval orar" hint='ex: "18:00–23:00"'>
              <Input
                value={form.timeLabel}
                onChange={(e) => set("timeLabel", e.target.value)}
                placeholder="18:00–23:00"
              />
            </Field>
            <MediaPicker
              label="Imagine principală"
              value={form.coverImage}
              onChange={(url) => set("coverImage", url)}
            />
            <Field label="Descriere scurtă" className="sm:col-span-2">
              <Textarea
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                rows={2}
              />
            </Field>
            <Field label="Descriere completă" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
              />
            </Field>

            {/* Program editor */}
            <div className="space-y-3 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Program</Label>
                  <p className="text-xs text-muted-foreground">
                    Momentele evenimentului, afișate ca timeline pe pagina de
                    detaliu.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addProgramRow}>
                  <Plus className="h-4 w-4" />
                  Adaugă moment
                </Button>
              </div>
              {form.program.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  Niciun moment adăugat încă.
                </p>
              ) : (
                <ul className="space-y-3">
                  {form.program.map((p, i) => (
                    <li
                      key={i}
                      className="space-y-3 rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Momentul {i + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={i === 0}
                            onClick={() => moveProgramRow(i, -1)}
                            aria-label="Mută mai sus"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={i === form.program.length - 1}
                            onClick={() => moveProgramRow(i, 1)}
                            aria-label="Mută mai jos"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeProgramRow(i)}
                            aria-label="Șterge momentul"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[130px_1fr]">
                        <div className="space-y-1.5">
                          <Label htmlFor={`prog-time-${i}`}>Ora</Label>
                          <Input
                            id={`prog-time-${i}`}
                            value={p.time}
                            onChange={(e) =>
                              updateProgramRow(i, { time: e.target.value })
                            }
                            placeholder="18:00"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`prog-title-${i}`}>Titlu</Label>
                          <Input
                            id={`prog-title-${i}`}
                            value={p.title}
                            onChange={(e) =>
                              updateProgramRow(i, { title: e.target.value })
                            }
                            placeholder="Recital de deschidere"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`prog-desc-${i}`}>Descriere</Label>
                        <Textarea
                          id={`prog-desc-${i}`}
                          value={p.description}
                          onChange={(e) =>
                            updateProgramRow(i, { description: e.target.value })
                          }
                          rows={2}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sm:col-span-2">
              <GalleryManager
                images={form.gallery}
                onImagesChange={(next) => set("gallery", next)}
                cover={form.coverImage}
                onCoverChange={(url) => set("coverImage", url)}
              />
            </div>

            <Field
              label="Link bilete"
              hint="link extern — Eventbrite, iaBilet…"
            >
              <Input
                value={form.ticketUrl}
                onChange={(e) => set("ticketUrl", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field
              label="Text buton bilete"
              hint='Gol → „Cumpără bilete”'
            >
              <Input
                value={form.ticketLabel}
                onChange={(e) => set("ticketLabel", e.target.value)}
                placeholder="Cumpără bilete"
              />
            </Field>

            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as PublishStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => set("featured", v)}
                />
                <span className="text-sm font-medium">Evidențiat</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Renunță
            </Button>
            <Button variant="gold" onClick={save}>
              {isEdit ? "Salvează" : "Adaugă"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
