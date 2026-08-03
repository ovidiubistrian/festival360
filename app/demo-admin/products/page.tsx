"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
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
  Product,
  ProductCategory,
  PublishStatus,
} from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES: ProductCategory[] = [
  "Lactate",
  "Panificație",
  "Miere",
  "Dulcețuri",
  "Siropuri",
  "Ceramică",
  "Băuturi",
  "Afumături",
];

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const PAGE_SIZE = 8;

function emptyProduct(): Product {
  return {
    id: newId("pr"),
    slug: "",
    name: "",
    producer: "",
    exhibitorId: "",
    region: "",
    category: "Lactate",
    shortDescription: "",
    story: "",
    image: "",
    gallery: [],
    price: "",
    featured: false,
    status: "draft",
  };
}

export default function ProductsPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Product>(emptyProduct);

  const exhibitorName = React.useCallback(
    (id: string) =>
      data.exhibitors.find((e) => e.id === id)?.name ?? "—",
    [data.exhibitors]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.products.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.producer.toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === "all" || p.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;
      return matchesQ && matchesCat && matchesStatus;
    });
  }, [data.products, query, categoryFilter, statusFilter]);

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
    setForm(emptyProduct());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Product) {
    setForm({ ...item, price: item.price ?? "" });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.name.trim()) {
      toast.error("Numele produsului este obligatoriu.");
      return;
    }
    const item: Product = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
      price: form.price?.trim() ? form.price : undefined,
    };
    upsertItem("products", item);
    toast.success(isEdit ? "Produs actualizat." : "Produs adăugat.");
    setDialogOpen(false);
  }

  function remove(item: Product) {
    deleteItem("products", item.id);
    toast.success("Produs șters.");
  }

  function onToggle(item: Product) {
    toggleStatus("products", item.id);
    toast.success(
      item.status === "published" ? "Produs trecut în ciornă." : "Produs publicat."
    );
  }

  return (
    <AdminShell
      title="Produse"
      description="Gestionează produsele tradiționale prezentate la festival."
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
        placeholder="Caută după nume, producător..."
        filter={
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]" aria-label="Filtru categorie">
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
                <TableHead>Producător</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Preț</TableHead>
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
                      Niciun produs găsit pentru filtrele curente.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">
                      {p.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.producer || exhibitorName(p.exhibitorId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.price || "—"}
                    </TableCell>
                    <TableCell>
                      {p.featured ? (
                        <Star className="h-4 w-4 fill-gold text-gold" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.status === "published"}
                          onCheckedChange={() => onToggle(p)}
                          aria-label="Comută statusul de publicare"
                        />
                        <StatusBadge status={p.status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={p.name}
                          onConfirm={() => remove(p)}
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
              {isEdit ? "Editează produs" : "Adaugă produs"}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile produsului. Modificările se salvează în
              browser (demo).
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
            <Field label="Producător">
              <Input
                value={form.producer}
                onChange={(e) => set("producer", e.target.value)}
              />
            </Field>
            <Field label="Expozant">
              <Select
                value={form.exhibitorId || "none"}
                onValueChange={(v) =>
                  set("exhibitorId", v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alege expozant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Fără expozant —</SelectItem>
                  {data.exhibitors.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Categorie">
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as ProductCategory)}
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
            <Field label="Regiune">
              <Input
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </Field>
            <Field label="Preț (opțional)">
              <Input
                value={form.price ?? ""}
                onChange={(e) => set("price", e.target.value)}
                placeholder="25 lei / kg"
              />
            </Field>
            <Field label="Imagine (URL)">
              <Input
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
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
            <Field label="Poveste" className="sm:col-span-2">
              <Textarea
                value={form.story}
                onChange={(e) => set("story", e.target.value)}
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
            <label className="flex items-end gap-2">
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => set("featured", v)}
              />
              <span className="pb-2.5 text-sm font-medium">Evidențiat</span>
            </label>
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
