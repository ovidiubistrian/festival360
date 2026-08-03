"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { Field } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import {
  deleteItem,
  moveItem,
  upsertItem,
  useAdminData,
  newId,
} from "@/lib/admin/store";
import type { GalleryImage, GalleryCategory } from "@/lib/tenants/types";
import { toast } from "sonner";

const CATEGORIES: GalleryCategory[] = [
  "Gastronomie",
  "Tradiții",
  "Concerte",
  "Produse",
  "Turism",
  "Ateliere",
];

const SPANS: GalleryImage["span"][] = ["normal", "wide", "tall"];
const SPAN_LABELS: Record<GalleryImage["span"], string> = {
  normal: "Normal",
  wide: "Lat",
  tall: "Înalt",
};

function emptyImage(): GalleryImage {
  return {
    id: newId("g"),
    src: "",
    alt: "",
    category: "Gastronomie",
    span: "normal",
  };
}

export default function GalleryPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<GalleryImage>(emptyImage);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.gallery.filter((g) => {
      const matchesQ = !q || g.alt.toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === "all" || g.category === categoryFilter;
      return matchesQ && matchesCat;
    });
  }, [data.gallery, query, categoryFilter]);

  function openAdd() {
    setForm(emptyImage());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: GalleryImage) {
    setForm({ ...item });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof GalleryImage>(key: K, value: GalleryImage[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.src.trim()) {
      toast.error("Adresa imaginii (URL) este obligatorie.");
      return;
    }
    upsertItem("gallery", form);
    toast.success(isEdit ? "Imagine actualizată." : "Imagine adăugată.");
    setDialogOpen(false);
  }

  function remove(item: GalleryImage) {
    deleteItem("gallery", item.id);
    toast.success("Imagine ștearsă.");
  }

  function move(item: GalleryImage, dir: -1 | 1) {
    moveItem("gallery", item.id, dir);
  }

  return (
    <AdminShell
      title="Galerie"
      description="Gestionează imaginile din galeria festivalului."
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
        placeholder="Caută după descriere (alt)..."
        filter={
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px]" aria-label="Filtru categorie">
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
        }
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nicio imagine găsită pentru filtrele curente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((g) => {
            const globalIndex = data.gallery.findIndex((x) => x.id === g.id);
            return (
              <Card key={g.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-secondary">
                  <ImageWithFallback
                    src={g.src}
                    alt={g.alt}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    fallbackLabel={g.alt || "Imagine"}
                  />
                  <div className="absolute left-2 top-2">
                    <Badge variant="gold">{g.category}</Badge>
                  </div>
                </div>
                <CardContent className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {g.alt || "Fără descriere"}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{SPAN_LABELS[g.span]}</Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={globalIndex <= 0}
                        onClick={() => move(g, -1)}
                        aria-label="Mută înainte"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={globalIndex >= data.gallery.length - 1}
                        onClick={() => move(g, 1)}
                        aria-label="Mută înapoi"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(g)}
                        aria-label="Editează"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete
                        itemLabel={g.alt || "această imagine"}
                        onConfirm={() => remove(g)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Șterge"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Afișez {filtered.length} din {data.gallery.length} imagini.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editează imaginea" : "Adaugă imagine"}
            </DialogTitle>
            <DialogDescription>
              Adaugă o imagine în galerie prin URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Adresă imagine (URL)">
              <Input
                value={form.src}
                onChange={(e) => set("src", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Descriere (alt)">
              <Input
                value={form.alt}
                onChange={(e) => set("alt", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Categorie">
                <Select
                  value={form.category}
                  onValueChange={(v) => set("category", v as GalleryCategory)}
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
              <Field label="Format">
                <Select
                  value={form.span}
                  onValueChange={(v) =>
                    set("span", v as GalleryImage["span"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPANS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SPAN_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {form.src ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary">
                <ImageWithFallback
                  src={form.src}
                  alt={form.alt}
                  fill
                  unoptimized
                  sizes="480px"
                  className="object-cover"
                  fallbackLabel="Previzualizare"
                />
              </div>
            ) : null}
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
