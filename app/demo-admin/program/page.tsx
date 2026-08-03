"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Star, ChevronUp, ChevronDown } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { Field } from "@/components/admin/field";
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
  upsertItem,
  useAdminData,
  newId,
} from "@/lib/admin/store";
import type { ProgramEvent, ProgramCategory } from "@/lib/tenants/types";
import { toast } from "sonner";

const CATEGORIES: ProgramCategory[] = [
  "Gastronomie",
  "Muzică",
  "Atelier",
  "Meșteșuguri",
  "Turism",
  "Copii",
  "Conferință",
];

function emptyEvent(): ProgramEvent {
  return {
    id: newId("ev"),
    day: 1,
    date: "",
    startTime: "10:00",
    endTime: "11:00",
    title: "",
    description: "",
    stage: "",
    category: "Gastronomie",
    featured: false,
  };
}

export default function ProgramPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [dayFilter, setDayFilter] = React.useState<string>("all");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<ProgramEvent>(emptyEvent);

  const days = React.useMemo(
    () => Array.from(new Set(data.program.map((e) => e.day))).sort((a, b) => a - b),
    [data.program]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.program.filter((e) => {
      const matchesQ =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.stage.toLowerCase().includes(q);
      const matchesDay = dayFilter === "all" || String(e.day) === dayFilter;
      return matchesQ && matchesDay;
    });
  }, [data.program, query, dayFilter]);

  function openAdd() {
    setForm(emptyEvent());
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: ProgramEvent) {
    setForm({ ...item });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof ProgramEvent>(key: K, value: ProgramEvent[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.title.trim()) {
      toast.error("Titlul evenimentului este obligatoriu.");
      return;
    }
    upsertItem("program", form);
    toast.success(isEdit ? "Eveniment actualizat." : "Eveniment adăugat.");
    setDialogOpen(false);
  }

  function remove(item: ProgramEvent) {
    deleteItem("program", item.id);
    toast.success("Eveniment șters.");
  }

  function move(item: ProgramEvent, dir: -1 | 1) {
    moveItem("program", item.id, dir);
  }

  return (
    <AdminShell
      title="Program"
      description="Gestionează evenimentele din programul festivalului."
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
        placeholder="Caută după titlu, scenă..."
        filter={
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="w-[140px]" aria-label="Filtru zi">
              <SelectValue placeholder="Zi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate zilele</SelectItem>
              {days.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Ziua {d}
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
                <TableHead>Ordine</TableHead>
                <TableHead>Zi</TableHead>
                <TableHead>Oră</TableHead>
                <TableHead>Titlu</TableHead>
                <TableHead>Scenă</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Niciun eveniment găsit pentru filtrele curente.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  const globalIndex = data.program.findIndex(
                    (x) => x.id === e.id
                  );
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={globalIndex <= 0}
                            onClick={() => move(e, -1)}
                            aria-label="Mută mai sus"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={globalIndex >= data.program.length - 1}
                            onClick={() => move(e, 1)}
                            aria-label="Mută mai jos"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Ziua {e.day}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {e.startTime}–{e.endTime}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          {e.title}
                          {e.featured ? (
                            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.stage}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{e.category}</Badge>
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Afișez {filtered.length} din {data.program.length} evenimente.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editează eveniment" : "Adaugă eveniment"}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile evenimentului din program.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titlu" className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field label="Zi (număr)">
              <Input
                type="number"
                min={1}
                value={form.day}
                onChange={(e) => set("day", Number(e.target.value) || 1)}
              />
            </Field>
            <Field label="Dată">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
            <Field label="Ora de început">
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </Field>
            <Field label="Ora de sfârșit">
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
              />
            </Field>
            <Field label="Scenă / Locație">
              <Input
                value={form.stage}
                onChange={(e) => set("stage", e.target.value)}
              />
            </Field>
            <Field label="Categorie">
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as ProgramCategory)}
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
            <Field label="Descriere" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </Field>
            <label className="flex items-center gap-2">
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => set("featured", v)}
              />
              <span className="text-sm font-medium">Eveniment evidențiat</span>
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
