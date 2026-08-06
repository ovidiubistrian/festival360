"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  BedDouble,
  Tent,
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
import type {
  Accommodation,
  AccommodationType,
  PublishStatus,
} from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

/** Which dataset this manager instance is scoped to. */
export type AccommodationScope = "lodging" | "camping";

const TYPE_LABELS: Record<AccommodationType, string> = {
  hotel: "Hotel",
  pensiune: "Pensiune",
  cabana: "Cabană",
  apartament: "Apartament",
  camping: "Camping",
  vila: "Vilă",
  other: "Altul",
};

/** All lodging types (everything except camping) — used by the lodging scope. */
const LODGING_TYPES: AccommodationType[] = [
  "hotel",
  "pensiune",
  "cabana",
  "apartament",
  "vila",
  "other",
];

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const PAGE_SIZE = 8;

/** Per-scope terminology and empty-state configuration. */
const SCOPE_COPY: Record<
  AccommodationScope,
  {
    title: string;
    description: string;
    addLabel: string;
    dialogAdd: string;
    dialogEdit: string;
    dialogDescription: string;
    emptyList: string;
    nameRequired: string;
    createdToast: string;
    updatedToast: string;
    deletedToast: string;
    draftToast: string;
    publishedToast: string;
    namePlaceholder: string;
  }
> = {
  lodging: {
    title: "Cazări",
    description:
      "Unitățile de cazare afișate în secțiunea Cazări de pe site și în paginile lor de detaliu (/cazari).",
    addLabel: "Adaugă cazare",
    dialogAdd: "Adaugă cazare",
    dialogEdit: "Editează cazare",
    dialogDescription: "Completează detaliile unității de cazare.",
    emptyList: "Nicio cazare găsită pentru filtrele curente.",
    nameRequired: "Numele cazării este obligatoriu.",
    createdToast: "Cazare adăugată.",
    updatedToast: "Cazare actualizată.",
    deletedToast: "Cazare ștearsă.",
    draftToast: "Cazare trecută în ciornă.",
    publishedToast: "Cazare publicată.",
    namePlaceholder: "Cabana Zâna Munților",
  },
  camping: {
    title: "Campinguri",
    description:
      "Locurile de camping afișate în secțiunea Campinguri de pe site și în paginile lor de detaliu (/campinguri).",
    addLabel: "Adaugă camping",
    dialogAdd: "Adaugă camping",
    dialogEdit: "Editează camping",
    dialogDescription: "Completează detaliile locului de camping.",
    emptyList: "Niciun camping găsit pentru filtrele curente.",
    nameRequired: "Numele campingului este obligatoriu.",
    createdToast: "Camping adăugat.",
    updatedToast: "Camping actualizat.",
    deletedToast: "Camping șters.",
    draftToast: "Camping trecut în ciornă.",
    publishedToast: "Camping publicat.",
    namePlaceholder: "Camping Valea Cerbului",
  },
};

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

function typeLabel(type: string): string {
  return TYPE_LABELS[type as AccommodationType] ?? type ?? "Altul";
}

function emptyAccommodation(scope: AccommodationScope): Accommodation {
  return {
    id: newId("acc"),
    slug: "",
    name: "",
    type: scope === "camping" ? "camping" : "pensiune",
    shortDescription: "",
    description: "",
    image: "",
    gallery: [],
    priceFrom: "",
    capacity: 0,
    rooms: 0,
    amenities: [],
    address: "",
    contactPhone: "",
    contactWebsite: "",
    bookingUrl: "",
    featured: false,
    status: "draft",
    sortOrder: 0,
  };
}

export function AccommodationsManager({
  scope,
}: {
  scope: AccommodationScope;
}) {
  const isCamping = scope === "camping";
  const copy = SCOPE_COPY[scope];
  const EmptyIcon = isCamping ? Tent : BedDouble;

  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Accommodation>(() =>
    emptyAccommodation(scope)
  );

  // Deep-link support: `?nou=<type>` opens the create form with the type
  // pre-filled (used by the custom "Campinguri" section button). Read from the
  // URL directly (client-only) to avoid a Suspense boundary.
  const nouParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("nou")
      : null;
  const [deepLinkHandled, setDeepLinkHandled] = React.useState(false);

  // Scope the dataset: camping shows only `type === "camping"`, lodging shows
  // everything else. All other filters compose on top.
  const scoped = React.useMemo(
    () =>
      data.accommodations.filter((a) =>
        isCamping ? a.type === "camping" : a.type !== "camping"
      ),
    [data.accommodations, isCamping]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((a) => {
      const matchesQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q);
      const matchesType =
        isCamping || typeFilter === "all" || a.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || a.status === statusFilter;
      return matchesQ && matchesType && matchesStatus;
    });
  }, [scoped, query, typeFilter, statusFilter, isCamping]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  // Reset to first page when filters change (during render, not in an effect).
  const filterSig = `${query}|${typeFilter}|${statusFilter}`;
  const [lastFilterSig, setLastFilterSig] = React.useState(filterSig);
  if (filterSig !== lastFilterSig) {
    setLastFilterSig(filterSig);
    setPage(1);
  }

  // Open the create dialog pre-filled when arriving via ?nou=<type> (once).
  if (nouParam && !deepLinkHandled) {
    setDeepLinkHandled(true);
    const draft = emptyAccommodation(scope);
    // In the camping scope the type is always "camping"; in lodging honor a
    // valid non-camping type hint from the deep-link.
    if (!isCamping && nouParam in TYPE_LABELS && nouParam !== "camping") {
      draft.type = nouParam as AccommodationType;
    }
    setForm(draft);
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openAdd() {
    setForm(emptyAccommodation(scope));
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Accommodation) {
    setForm({ ...item });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Accommodation>(
    key: K,
    value: Accommodation[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.name.trim()) {
      toast.error(copy.nameRequired);
      return;
    }
    const item: Accommodation = {
      ...form,
      // Camping scope always persists as `type: "camping"`.
      type: isCamping ? "camping" : form.type,
      slug: form.slug.trim() || slugify(form.name),
      capacity: Number.isFinite(form.capacity) ? form.capacity : 0,
      rooms: Number.isFinite(form.rooms) ? form.rooms : 0,
    };
    upsertItem("accommodations", item);
    toast.success(isEdit ? copy.updatedToast : copy.createdToast);
    setDialogOpen(false);
  }

  function remove(item: Accommodation) {
    deleteItem("accommodations", item.id);
    toast.success(copy.deletedToast);
  }

  function onToggle(item: Accommodation) {
    toggleStatus("accommodations", item.id);
    toast.success(
      item.status === "published" ? copy.draftToast : copy.publishedToast
    );
  }

  function move(item: Accommodation, dir: -1 | 1) {
    moveItem("accommodations", item.id, dir);
  }

  return (
    <AdminShell
      title={copy.title}
      description={copy.description}
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
        placeholder="Caută după nume, adresă..."
        filter={
          <>
            {isCamping ? null : (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[170px]" aria-label="Filtru tip">
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  {LODGING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                <TableHead>Tip</TableHead>
                <TableHead>Preț</TableHead>
                <TableHead>Capacitate</TableHead>
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
                      <EmptyIcon className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {copy.emptyList}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((a, idx) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-foreground">
                      {a.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typeLabel(a.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.priceFrom || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.capacity > 0 ? `${a.capacity} pers.` : "—"}
                    </TableCell>
                    <TableCell>
                      {a.featured ? (
                        <Star className="h-4 w-4 fill-gold text-gold" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={a.status === "published"}
                          onCheckedChange={() => onToggle(a)}
                          aria-label="Comută statusul de publicare"
                        />
                        <StatusBadge status={a.status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(a, -1)}
                          disabled={idx === 0 && current === 1}
                          aria-label="Mută mai sus"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => move(a, 1)}
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
                          onClick={() => openEdit(a)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={a.name}
                          onConfirm={() => remove(a)}
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
              {isEdit ? copy.dialogEdit : copy.dialogAdd}
            </DialogTitle>
            <DialogDescription>{copy.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={copy.namePlaceholder}
              />
            </Field>
            <Field label="Slug" hint="Lăsat gol → generat automat din nume">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="cabana-zana-muntilor"
              />
            </Field>
            {isCamping ? (
              <Field label="Tip">
                <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                  <Tent className="h-4 w-4" />
                  Camping
                </div>
              </Field>
            ) : (
              <Field label="Tip">
                <Select
                  value={form.type}
                  onValueChange={(v) => set("type", v as AccommodationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LODGING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <MediaPicker
              label="Imagine principală"
              value={form.image}
              onChange={(url) => set("image", url)}
            />
            <Field label="Preț de la">
              <Input
                value={form.priceFrom}
                onChange={(e) => set("priceFrom", e.target.value)}
                placeholder="de la 250 RON/noapte"
              />
            </Field>
            <Field label="Capacitate (persoane)">
              <Input
                type="number"
                min={0}
                value={form.capacity ? String(form.capacity) : ""}
                onChange={(e) =>
                  set("capacity", Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="0"
              />
            </Field>
            <Field label="Camere">
              <Input
                type="number"
                min={0}
                value={form.rooms ? String(form.rooms) : ""}
                onChange={(e) =>
                  set("rooms", Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="0"
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
              hint="ex: wifi, parcare, mic-dejun, piscină"
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
            <Field label="Link rezervare" className="sm:col-span-2">
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
