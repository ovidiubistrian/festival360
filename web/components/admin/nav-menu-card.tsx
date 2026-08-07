"use client";

import * as React from "react";
import {
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Menu,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addNavItem,
  moveNavItem,
  removeNavItem,
  renameNavItem,
  resetNavigation,
  toggleNavItem,
  useAdminData,
} from "@/lib/admin/store";
import type { NavItemConfig } from "@/lib/tenants/types";
import { isExternalHref } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Editorul meniului de sus (header + meniu mobil + footer).
 *
 * Intrările vin din presetul verticalei, dar ordinea, denumirea și
 * vizibilitatea sunt ale tenantului, iar peste ele se pot adăuga linkuri
 * proprii (o pagină internă sau o adresă externă). „Resetează" șterge doar
 * personalizarea — meniul revine la ce dictează presetul.
 */

/** Denumirea se salvează la ieșirea din câmp (sau Enter), nu la fiecare tastă. */
function NavLabelInput({ item }: { item: NavItemConfig }) {
  const [value, setValue] = React.useState(item.label);

  // Când serverul trimite altă valoare (alt tenant, reset), urmăm serverul.
  React.useEffect(() => setValue(item.label), [item.label]);

  function commit() {
    const next = value.trim();
    if (!next || next === item.label) {
      setValue(item.label);
      return;
    }
    renameNavItem(item.href, next);
  }

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue(item.label);
          e.currentTarget.blur();
        }
      }}
      className="h-9 max-w-[220px]"
      aria-label={`Denumirea intrării ${item.label}`}
    />
  );
}

function AddNavItemDialog() {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [href, setHref] = React.useState("");
  const data = useAdminData();

  function normalizeHref(raw: string): string {
    const v = raw.trim();
    if (!v) return "";
    if (isExternalHref(v)) return v;
    return v.startsWith("/") ? v : `/${v}`;
  }

  function submit() {
    const l = label.trim();
    const h = normalizeHref(href);
    if (!l || !h) {
      toast.error("Completează denumirea și adresa.");
      return;
    }
    if (data.navigation.some((x) => x.href === h)) {
      toast.error("Există deja o intrare cu această adresă.");
      return;
    }
    addNavItem(l, h);
    toast.success(`„${l}” a fost adăugat în meniu.`);
    setLabel("");
    setHref("");
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Adaugă link
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link nou în meniu</DialogTitle>
            <DialogDescription>
              O pagină de pe site (ex. <code>/contact</code>) sau o adresă
              externă (ex. bilete, formular de rezervare).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nav-label">Denumire</Label>
              <Input
                id="nav-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Bilete"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nav-href">Adresă</Label>
              <Input
                id="nav-href"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/contact sau https://..."
              />
              <p className="text-xs text-muted-foreground">
                Adresele care încep cu <code>http</code> se deschid într-o filă
                nouă și nu intră în sitemap.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Renunță
            </Button>
            <Button onClick={submit}>Adaugă</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NavMenuCard() {
  const data = useAdminData();
  const items = data.navigation;
  const shown = items.filter((i) => i.visible && !i.sectionHidden).length;

  function onToggle(item: NavItemConfig) {
    toggleNavItem(item.href);
    toast.success(
      item.visible
        ? `„${item.label}” a fost scos din meniu.`
        : `„${item.label}” apare în meniu.`
    );
  }

  function onDelete(item: NavItemConfig) {
    removeNavItem(item.href);
    toast.success(`„${item.label}” a fost șters din meniu.`);
  }

  function onReset() {
    resetNavigation();
    toast.success("Meniul a revenit la varianta implicită.");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Menu className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Meniu de sus</CardTitle>
              <CardDescription>
                {shown} din {items.length} intrări afișate — în header, în
                meniul de pe telefon și în footer
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Resetează
            </Button>
            <AddNavItemDialog />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-border">
          {items.map((item, index) => (
            <li
              key={item.href}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index <= 0}
                  onClick={() => moveNavItem(item.href, -1)}
                  aria-label="Mută mai la stânga"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index >= items.length - 1}
                  onClick={() => moveNavItem(item.href, 1)}
                  aria-label="Mută mai la dreapta"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-primary">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                <NavLabelInput item={item} />
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isExternalHref(item.href) ? (
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  ) : null}
                  <span className="truncate">{item.href}</span>
                </p>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-3">
                {item.custom ? (
                  <Badge variant="secondary">Personalizat</Badge>
                ) : null}

                {item.custom ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(item)}
                    aria-label={`Șterge ${item.label} din meniu`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}

                {item.sectionHidden ? (
                  <Badge variant="muted">Secțiune dezactivată</Badge>
                ) : item.visible ? (
                  <Badge variant="success">În meniu</Badge>
                ) : (
                  <Badge variant="muted">Ascuns</Badge>
                )}

                <Switch
                  checked={item.visible && !item.sectionHidden}
                  disabled={item.sectionHidden}
                  onCheckedChange={() => onToggle(item)}
                  aria-label={`Comută intrarea ${item.label}`}
                />
              </div>
            </li>
          ))}
        </ul>

        {items.some((i) => i.sectionHidden) ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Intrările marcate „Secțiune dezactivată” nu apar în meniu pentru că
            zona pe care o deschid e oprită mai jos, în „Secțiuni homepage”.
            Reactivează secțiunea ca să le poți folosi.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
