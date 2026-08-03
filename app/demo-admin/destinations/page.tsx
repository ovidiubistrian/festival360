"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Star, BookOpen } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/admin/status-badge";
import { Field } from "@/components/admin/field";
import { Pager } from "@/components/admin/pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  toggleStatus,
  upsertItem,
  useAdminData,
  newId,
} from "@/lib/admin/store";
import type { Destination, PublishStatus } from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const PAGE_SIZE = 8;

function emptyDestination(): Destination {
  return {
    id: newId("de"),
    slug: "",
    name: "",
    region: "",
    county: "",
    shortDescription: "",
    description: "",
    coverImage: "",
    gallery: [],
    attractions: [],
    experiences: [],
    gastronomy: [],
    externalLink: "",
    featured: false,
    editorial: false,
    status: "draft",
  };
}

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

export default function DestinationsPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Destination>(emptyDestination);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.destinations.filter((d) => {
      const matchesQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.county.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || d.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [data.destinations, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  // Reset to the first page when filters change (adjusted during render, not
  // in an effect — avoids the set-state-in-effect anti-pattern).
  const filterSig = `${query}|${statusFilter}`;
  const [lastFilterSig, setLastFilterSig] = React.useState(filterSig);
  if (filterSig !== lastFilterSig) {
    setLastFilterSig(filterSig);
    setPage(1);
  }

  function openAdd() {
    setForm(emptyDestination());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Destination) {
    setForm({ ...item, externalLink: item.externalLink ?? "" });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Destination>(key: K, value: Destination[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.name.trim()) {
      toast.error("Numele destinației este obligatoriu.");
      return;
    }
    const item: Destination = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
      externalLink: form.externalLink?.trim() ? form.externalLink : undefined,
    };
    upsertItem("destinations", item);
    toast.success(isEdit ? "Destinație actualizată." : "Destinație adăugată.");
    setDialogOpen(false);
  }

  function remove(item: Destination) {
    deleteItem("destinations", item.id);
    toast.success("Destinație ștearsă.");
  }

  function onToggle(item: Destination) {
    toggleStatus("destinations", item.id);
    toast.success(
      item.status === "published"
        ? "Destinație trecută în ciornă."
        : "Destinație publicată."
    );
  }

  return (
    <AdminShell
      title="Destinații"
      description="Gestionează destinațiile turistice și poveștile editoriale."
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
        placeholder="Caută după nume, regiune..."
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
                <TableHead>Nume</TableHead>
                <TableHead>Regiune</TableHead>
                <TableHead>Județ</TableHead>
                <TableHead>Editorial</TableHead>
                <TableHead>Evidențiat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nicio destinație găsită pentru filtrele curente.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-foreground">
                      {d.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.region}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.county}
                    </TableCell>
                    <TableCell>
                      {d.editorial ? (
                        <BookOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {d.featured ? (
                        <Star className="h-4 w-4 fill-gold text-gold" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={d.status === "published"}
                          onCheckedChange={() => onToggle(d)}
                          aria-label="Comută statusul de publicare"
                        />
                        <StatusBadge status={d.status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(d)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={d.name}
                          onConfirm={() => remove(d)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editează destinație" : "Adaugă destinație"}
            </DialogTitle>
            <DialogDescription>
              Câmpurile cu liste acceptă câte un element pe linie.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Slug" hint="Lăsat gol → generat automat">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field label="Regiune">
              <Input
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </Field>
            <Field label="Județ">
              <Input
                value={form.county}
                onChange={(e) => set("county", e.target.value)}
              />
            </Field>
            <Field label="Imagine copertă (URL)">
              <Input
                value={form.coverImage}
                onChange={(e) => set("coverImage", e.target.value)}
                placeholder="https://..."
              />
            </Field>
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
            <Field label="Atracții (una pe linie)">
              <Textarea
                value={toLines(form.attractions)}
                onChange={(e) => set("attractions", fromLines(e.target.value))}
                rows={3}
              />
            </Field>
            <Field label="Experiențe (una pe linie)">
              <Textarea
                value={toLines(form.experiences)}
                onChange={(e) => set("experiences", fromLines(e.target.value))}
                rows={3}
              />
            </Field>
            <Field label="Gastronomie (una pe linie)">
              <Textarea
                value={toLines(form.gastronomy)}
                onChange={(e) => set("gastronomy", fromLines(e.target.value))}
                rows={3}
              />
            </Field>
            <Field label="Link extern (opțional)">
              <Input
                value={form.externalLink ?? ""}
                onChange={(e) => set("externalLink", e.target.value)}
                placeholder="https://..."
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
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => set("featured", v)}
                />
                <span className="text-sm font-medium">Evidențiat</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.editorial}
                  onCheckedChange={(v) => set("editorial", v)}
                />
                <span className="text-sm font-medium">Editorial</span>
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
