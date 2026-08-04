"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, BadgeCheck, Star } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/admin/status-badge";
import { Field } from "@/components/admin/field";
import { MediaPicker } from "@/components/admin/media-picker";
import { Pager } from "@/components/admin/pager";
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
import type {
  Exhibitor,
  ExhibitorCategory,
  PublishStatus,
} from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES: ExhibitorCategory[] = [
  "Brânzeturi",
  "Panificație",
  "Miere & Apicultură",
  "Ceramică & Meșteșuguri",
  "Dulcețuri & Siropuri",
  "Vinuri & Băuturi",
  "Turism & Ospitalitate",
  "Carne & Afumături",
];

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const PAGE_SIZE = 8;

function emptyExhibitor(): Exhibitor {
  return {
    id: newId("ex"),
    slug: "",
    name: "",
    category: "Brânzeturi",
    town: "",
    county: "",
    region: "",
    shortDescription: "",
    description: "",
    image: "",
    gallery: [],
    certified: false,
    featured: false,
    productIds: [],
    status: "draft",
  };
}

export default function ExhibitorsPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Exhibitor>(emptyExhibitor);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.exhibitors.filter((e) => {
      const matchesQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.town.toLowerCase().includes(q) ||
        e.county.toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === "all" || e.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      return matchesQ && matchesCat && matchesStatus;
    });
  }, [data.exhibitors, query, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  // Reset to the first page when filters change (adjusted during render, not
  // in an effect — avoids the set-state-in-effect anti-pattern).
  const filterSig = `${query}|${categoryFilter}|${statusFilter}`;
  const [lastFilterSig, setLastFilterSig] = React.useState(filterSig);
  if (filterSig !== lastFilterSig) {
    setLastFilterSig(filterSig);
    setPage(1);
  }

  function openAdd() {
    setForm(emptyExhibitor());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Exhibitor) {
    setForm({ ...item });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Exhibitor>(key: K, value: Exhibitor[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.name.trim()) {
      toast.error("Numele expozantului este obligatoriu.");
      return;
    }
    const item: Exhibitor = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
    };
    upsertItem("exhibitors", item);
    toast.success(
      isEdit ? "Expozant actualizat." : "Expozant adăugat."
    );
    setDialogOpen(false);
  }

  function remove(item: Exhibitor) {
    deleteItem("exhibitors", item.id);
    toast.success("Expozant șters.");
  }

  function onToggle(item: Exhibitor) {
    toggleStatus("exhibitors", item.id);
    toast.success(
      item.status === "published"
        ? "Expozant trecut în ciornă."
        : "Expozant publicat."
    );
  }

  return (
    <AdminShell
      title="Expozanți"
      description="Producătorii și meșteșugarii afișați în secțiunea Expozanți de pe site și în paginile lor de detaliu (/prispa/expozanti)."
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
        placeholder="Caută după nume, localitate..."
        filter={
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" aria-label="Filtru categorie">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate categoriile</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Localitate</TableHead>
                <TableHead>Certificat</TableHead>
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
                      Niciun expozant găsit pentru filtrele curente.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-foreground">
                      {e.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.town}
                      {e.county ? `, ${e.county}` : ""}
                    </TableCell>
                    <TableCell>
                      {e.certified ? (
                        <BadgeCheck className="h-4 w-4 text-emerald-600" />
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
                          onClick={() => openEdit(e)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={e.name}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editează expozant" : "Adaugă expozant"}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile expozantului. Modificările se salvează în
              browser (demo).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ferma Bunicii"
              />
            </Field>
            <Field label="Slug" hint="Lăsat gol → generat automat din nume">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="ferma-bunicii"
              />
            </Field>
            <Field label="Categorie">
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as ExhibitorCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Localitate">
              <Input
                value={form.town}
                onChange={(e) => set("town", e.target.value)}
              />
            </Field>
            <Field label="Județ">
              <Input
                value={form.county}
                onChange={(e) => set("county", e.target.value)}
              />
            </Field>
            <Field label="Regiune">
              <Input
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </Field>
            <MediaPicker
              label="Imagine principală"
              value={form.image}
              onChange={(url) => set("image", url)}
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
                  checked={form.certified}
                  onCheckedChange={(v) => set("certified", v)}
                />
                <span className="text-sm font-medium">Certificat</span>
              </label>
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
