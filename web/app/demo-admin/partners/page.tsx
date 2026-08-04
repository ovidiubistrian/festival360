"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusBadge } from "@/components/admin/status-badge";
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
import { PartnerLogo } from "@/components/shared/partner-logo";
import {
  deleteItem,
  moveItem,
  toggleStatus,
  upsertItem,
  useAdminData,
  newId,
} from "@/lib/admin/store";
import type { Partner, PartnerTier, PublishStatus } from "@/lib/tenants/types";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";

const TIERS: PartnerTier[] = [
  "Organizator",
  "Partener instituțional",
  "Partener principal",
  "Sponsor",
  "Partener media",
  "Partener local",
];

const STATUSES: PublishStatus[] = ["published", "draft", "archived"];
const STATUS_LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

function emptyPartner(order: number): Partner {
  return {
    id: newId("pa"),
    slug: "",
    name: "",
    tier: "Sponsor",
    logo: "",
    description: "",
    website: "",
    featuredOnHome: false,
    order,
    status: "draft",
  };
}

export default function PartnersPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState<string>("all");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [form, setForm] = React.useState<Partner>(() => emptyPartner(0));

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.partners.filter((p) => {
      const matchesQ = !q || p.name.toLowerCase().includes(q);
      const matchesTier = tierFilter === "all" || p.tier === tierFilter;
      return matchesQ && matchesTier;
    });
  }, [data.partners, query, tierFilter]);

  function openAdd() {
    setForm(emptyPartner(data.partners.length + 1));
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(item: Partner) {
    setForm({ ...item });
    setIsEdit(true);
    setDialogOpen(true);
  }

  function set<K extends keyof Partner>(key: K, value: Partner[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!form.name.trim()) {
      toast.error("Numele partenerului este obligatoriu.");
      return;
    }
    const item: Partner = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
    };
    upsertItem("partners", item);
    toast.success(isEdit ? "Partener actualizat." : "Partener adăugat.");
    setDialogOpen(false);
  }

  function remove(item: Partner) {
    deleteItem("partners", item.id);
    toast.success("Partener șters.");
  }

  function move(item: Partner, dir: -1 | 1) {
    moveItem("partners", item.id, dir);
  }

  function onToggleStatus(item: Partner) {
    toggleStatus("partners", item.id);
    toast.success(
      item.status === "published"
        ? "Partener trecut în ciornă."
        : "Partener publicat."
    );
  }

  function onToggleHome(item: Partner) {
    upsertItem("partners", { ...item, featuredOnHome: !item.featuredOnHome });
    toast.success(
      item.featuredOnHome
        ? "Eliminat de pe homepage."
        : "Evidențiat pe homepage."
    );
  }

  return (
    <AdminShell
      title="Parteneri"
      description="Gestionează partenerii și sponsorii festivalului. Reordonează cu săgețile."
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
        placeholder="Caută după nume..."
        filter={
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[200px]" aria-label="Filtru nivel">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate nivelurile</SelectItem>
              {TIERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
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
                <TableHead>Logo</TableHead>
                <TableHead>Nume</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Homepage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Niciun partener găsit pentru filtrele curente.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const globalIndex = data.partners.findIndex(
                    (x) => x.id === p.id
                  );
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={globalIndex <= 0}
                            onClick={() => move(p, -1)}
                            aria-label="Mută mai sus"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={globalIndex >= data.partners.length - 1}
                            onClick={() => move(p, 1)}
                            aria-label="Mută mai jos"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PartnerLogo
                          logo={p.logo || p.name.slice(0, 2).toUpperCase()}
                          name={p.name}
                          className="h-10 w-10 text-sm"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {p.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={p.featuredOnHome}
                            onCheckedChange={() => onToggleHome(p)}
                            aria-label="Evidențiat pe homepage"
                          />
                          <span className="text-xs text-muted-foreground">
                            {p.featuredOnHome ? "Da" : "Nu"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={p.status === "published"}
                            onCheckedChange={() => onToggleStatus(p)}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Afișez {filtered.length} din {data.partners.length} parteneri.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editează partener" : "Adaugă partener"}
            </DialogTitle>
            <DialogDescription>
              Logo-ul poate fi un monogram (ex. „AB”) sau un URL de imagine.
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
            <Field label="Nivel">
              <Select
                value={form.tier}
                onValueChange={(v) => set("tier", v as PartnerTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Logo (monogram sau URL)">
              <Input
                value={form.logo}
                onChange={(e) => set("logo", e.target.value)}
                placeholder="AB sau https://..."
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Ordine">
              <Input
                type="number"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value) || 0)}
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
            <Field label="Descriere" className="sm:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </Field>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 sm:col-span-2">
              <Switch
                checked={form.featuredOnHome}
                onCheckedChange={(v) => set("featuredOnHome", v)}
              />
              <span className="text-sm font-medium">
                Evidențiat pe homepage
              </span>
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
