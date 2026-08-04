"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
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
  Article,
  ArticleCategory,
  PublishStatus,
} from "@/lib/tenants/types";
import { formatDate, slugify } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES: ArticleCategory[] = [
  "Festival",
  "Producători",
  "Regiuni",
  "Interviuri",
  "Ghid",
];

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const PAGE_SIZE = 8;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyArticle(): Article {
  return {
    id: newId("ar"),
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    category: "Festival",
    author: "",
    date: todayISO(),
    readingMinutes: 3,
    coverImage: "",
    featured: false,
    status: "draft",
  };
}

export default function NewsPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Article>(emptyArticle);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.articles.filter((a) => {
      const matchesQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === "all" || a.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || a.status === statusFilter;
      return matchesQ && matchesCat && matchesStatus;
    });
  }, [data.articles, query, categoryFilter, statusFilter]);

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
    setForm(emptyArticle());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Article) {
    setForm({ ...item });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Article>(key: K, value: Article[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.title.trim()) {
      toast.error("Titlul articolului este obligatoriu.");
      return;
    }
    const item: Article = {
      ...form,
      slug: form.slug.trim() || slugify(form.title),
    };
    upsertItem("articles", item);
    toast.success(isEdit ? "Articol actualizat." : "Articol adăugat.");
    setDialogOpen(false);
  }

  function remove(item: Article) {
    deleteItem("articles", item.id);
    toast.success("Articol șters.");
  }

  function onToggle(item: Article) {
    toggleStatus("articles", item.id);
    toast.success(
      item.status === "published"
        ? "Articol trecut în ciornă."
        : "Articol publicat."
    );
  }

  return (
    <AdminShell
      title="Noutăți"
      description="Articolele din secțiunea Noutăți de pe site și paginile lor de detaliu."
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
        placeholder="Caută după titlu, autor..."
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
                <TableHead>Titlu</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Dată</TableHead>
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
                      Niciun articol găsit pentru filtrele curente.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-xs font-medium text-foreground">
                      <span className="line-clamp-1">{a.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.author}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {a.date ? formatDate(a.date) : "—"}
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
                          onClick={() => openEdit(a)}
                          aria-label="Editează"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          itemLabel={a.title}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editează articol" : "Adaugă articol"}
            </DialogTitle>
            <DialogDescription>
              Corpul articolului acceptă HTML simplu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titlu" className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field label="Slug" hint="Lăsat gol → generat automat">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field label="Categorie">
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as ArticleCategory)}
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
            <Field label="Autor">
              <Input
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
              />
            </Field>
            <Field label="Dată">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
            <Field label="Minute de citire">
              <Input
                type="number"
                min={1}
                value={form.readingMinutes}
                onChange={(e) =>
                  set("readingMinutes", Number(e.target.value) || 1)
                }
              />
            </Field>
            <MediaPicker
              label="Imagine copertă"
              value={form.coverImage}
              onChange={(url) => set("coverImage", url)}
            />
            <Field label="Rezumat" className="sm:col-span-2">
              <Textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={2}
              />
            </Field>
            <Field label="Corp (HTML permis)" className="sm:col-span-2">
              <Textarea
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                rows={6}
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
