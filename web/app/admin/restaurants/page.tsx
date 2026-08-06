"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Utensils,
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
  moveItem,
  toggleStatus,
  upsertItem,
  useAdminData,
  newId,
} from "@/lib/admin/store";
import type { Restaurant, PublishStatus } from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const PAGE_SIZE = 8;

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

function emptyRestaurant(): Restaurant {
  return {
    id: newId("rst"),
    slug: "",
    name: "",
    cuisine: "",
    shortDescription: "",
    description: "",
    image: "",
    gallery: [],
    priceRange: "",
    hours: "",
    address: "",
    contactPhone: "",
    contactWebsite: "",
    menuUrl: "",
    bookingUrl: "",
    amenities: [],
    featured: false,
    status: "draft",
    sortOrder: 0,
  };
}

export default function RestaurantsPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [cuisineFilter, setCuisineFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Restaurant>(() => emptyRestaurant());

  const restaurants = React.useMemo(
    () => data.restaurants ?? [],
    [data.restaurants]
  );

  // Distinct cuisines present in the dataset, for the filter dropdown.
  const cuisines = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of restaurants) {
      const c = r.cuisine.trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ro"));
  }, [restaurants]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants.filter((r) => {
      const matchesQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q);
      const matchesCuisine =
        cuisineFilter === "all" || r.cuisine === cuisineFilter;
      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;
      return matchesQ && matchesCuisine && matchesStatus;
    });
  }, [restaurants, query, cuisineFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  // Reset to first page when filters change (during render, not in an effect).
  const filterSig = `${query}|${cuisineFilter}|${statusFilter}`;
  const [lastFilterSig, setLastFilterSig] = React.useState(filterSig);
  if (filterSig !== lastFilterSig) {
    setLastFilterSig(filterSig);
    setPage(1);
  }

  function openAdd() {
    setForm(emptyRestaurant());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Restaurant) {
    setForm({ ...item });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Restaurant>(key: K, value: Restaurant[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.name.trim()) {
      toast.error("Numele restaurantului este obligatoriu.");
      return;
    }
    const item: Restaurant = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
    };
    upsertItem("restaurants", item);
    toast.success(isEdit ? "Restaurant actualizat." : "Restaurant adăugat.");
    setDialogOpen(false);
  }

  function remove(item: Restaurant) {
    deleteItem("restaurants", item.id);
    toast.success("Restaurant șters.");
  }

  function onToggle(item: Restaurant) {
    toggleStatus("restaurants", item.id);
    toast.success(
      item.status === "published"
        ? "Restaurant trecut în ciornă."
        : "Restaurant publicat."
    );
  }

  function move(item: Restaurant, dir: -1 | 1) {
    moveItem("restaurants", item.id, dir);
  }

  return (
    <AdminShell
      title="Restaurante"
      description="Restaurantele și localurile afișate în secțiunea Restaurante de pe site și în paginile lor de detaliu (/restaurante)."
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
        placeholder="Caută după nume, adresă, bucătărie..."
        filter={
          <>
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger
                className="w-[190px]"
                aria-label="Filtru bucătărie"
              >
                <SelectValue placeholder="Bucătărie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate bucătăriile</SelectItem>
                {cuisines.map((c) => (
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
                <TableHead>Bucătărie</TableHead>
                <TableHead>Preț</TableHead>
                <TableHead>Program</TableHead>
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
                      <Utensils className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Niciun restaurant găsit pentru filtrele curente.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">
                      {r.name}
                    </TableCell>
                    <TableCell>
                      {r.cuisine ? (
                        <Badge variant="secondary">{r.cuisine}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.priceRange || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.hours || "—"}
                    </TableCell>
                    <TableCell>
                      {r.featured ? (
                        <Star className="h-4 w-4 fill-gold text-gold" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.status === "published"}
                          onCheckedChange={() => onToggle(r)}
                          aria-label="Comută statusul de publicare"
                        />
                        <StatusBadge status={r.status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(r, -1)}
                          disabled={idx === 0 && current === 1}
                          aria-label="Mută mai sus"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(r, 1)}
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
                          onClick={() => openEdit(r)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={r.name}
                          onConfirm={() => remove(r)}
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
              {isEdit ? "Editează restaurant" : "Adaugă restaurant"}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile restaurantului.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Hanul Domnesc"
              />
            </Field>
            <Field label="Slug" hint="Lăsat gol → generat automat din nume">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="hanul-domnesc"
              />
            </Field>
            <Field label="Bucătărie" hint="ex: Românească, Pește, Pizza">
              <Input
                value={form.cuisine}
                onChange={(e) => set("cuisine", e.target.value)}
                placeholder="Românească"
              />
            </Field>
            <MediaPicker
              label="Imagine principală"
              value={form.image}
              onChange={(url) => set("image", url)}
            />
            <Field label="Interval de preț" hint='ex: "$$" sau "80–150 RON / pers."'>
              <Input
                value={form.priceRange}
                onChange={(e) => set("priceRange", e.target.value)}
                placeholder="80–150 RON / persoană"
              />
            </Field>
            <Field label="Program" className="sm:col-span-2">
              <Input
                value={form.hours}
                onChange={(e) => set("hours", e.target.value)}
                placeholder="L–D 10:00–22:00"
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
            <Field
              label="Facilități (una pe linie)"
              hint="ex: terasă, parcare, wifi, live-music, family"
              className="sm:col-span-2"
            >
              <Textarea
                value={toLines(form.amenities)}
                onChange={(e) => set("amenities", fromLines(e.target.value))}
                rows={4}
              />
            </Field>
            <div className="sm:col-span-2">
              <GalleryManager
                images={form.gallery}
                onImagesChange={(next) => set("gallery", next)}
                cover={form.image}
                onCoverChange={(url) => set("image", url)}
              />
            </div>
            <Field label="Adresă" className="sm:col-span-2">
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Str. Principală 10, Poiana Mărului"
              />
            </Field>
            <Field label="Telefon">
              <Input
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="+40 700 000 000"
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.contactWebsite}
                onChange={(e) => set("contactWebsite", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Link meniu">
              <Input
                value={form.menuUrl}
                onChange={(e) => set("menuUrl", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Link rezervare">
              <Input
                value={form.bookingUrl}
                onChange={(e) => set("bookingUrl", e.target.value)}
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
