"use client";

import * as React from "react";
import {
  Check,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  deleteSubmission,
  listSubmissions,
  setSubmissionRead,
} from "@/lib/admin/forms";
import {
  answerLabels,
  answersByLabel,
  printSubmission,
  printSubmissionsTable,
} from "@/lib/admin/form-print";
import { useAdminData } from "@/lib/admin/store";
import type { FormDefinition, FormSubmission } from "@/lib/tenants/types";
import { toast } from "sonner";

/** Escape a value for a CSV cell (quote when it contains , " or newline). */
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function formatMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTotal(total: number): string {
  return `${total.toLocaleString("ro-RO")} lei`;
}

/**
 * Cererile primite pe un formular. Lista se încarcă la deschidere; ștergerea
 * și marcarea „citit” actualizează optimist starea locală, apoi serverul.
 *
 * Două vederi: „Rezumat” (solicitant, dată, total) și „Tabel complet” — o
 * coloană per câmp din formular, ca într-un tabel de evidență. Ambele se pot
 * exporta CSV sau PDF, iar fiecare cerere are PDF-ul ei.
 */
export function FormSubmissionsDialog({
  form,
  open,
  onOpenChange,
  onChanged,
}: {
  form: FormDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Anunță părintele că numărul de cereri necitite s-a schimbat. */
  onChanged?: () => void;
}) {
  // Organizatorul și numele site-ului ajung în antetul și subsolul PDF-ului.
  const data = useAdminData();
  const [items, setItems] = React.useState<FormSubmission[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadedFor, setLoadedFor] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<FormSubmission | null>(null);

  // Încarcă la deschidere / schimbare de formular — printr-o gardă în faza de
  // render, nu setState în efect (regula repo-ului).
  const wanted = open && form ? form.id : null;
  if (wanted !== loadedFor) {
    setLoadedFor(wanted);
    setItems([]);
    if (wanted) {
      setLoading(true);
      void (async () => {
        const rows = await listSubmissions(wanted);
        setItems(rows);
        setLoading(false);
      })();
    }
  }

  function openSubmission(sub: FormSubmission) {
    setActive(sub);
    if (!sub.read) void markRead(sub, true);
  }

  async function markRead(sub: FormSubmission, read: boolean) {
    if (!form) return;
    setItems((list) =>
      list.map((s) => (s.id === sub.id ? { ...s, read } : s))
    );
    const ok = await setSubmissionRead(form.id, sub.id, read);
    if (!ok) {
      setItems((list) =>
        list.map((s) => (s.id === sub.id ? { ...s, read: !read } : s))
      );
      toast.error("Nu am putut actualiza starea cererii.");
      return;
    }
    onChanged?.();
  }

  async function remove(sub: FormSubmission) {
    if (!form) return;
    const ok = await deleteSubmission(form.id, sub.id);
    if (!ok) {
      toast.error("Nu am putut șterge cererea.");
      return;
    }
    setItems((list) => list.filter((s) => s.id !== sub.id));
    onChanged?.();
    toast.success("Cerere ștearsă.");
  }

  /** Coloanele tabelului complet: un câmp completabil = o coloană. */
  const labels = form ? answerLabels(form) : [];
  const showTotals = items.some((s) => s.total);

  /** Export CSV: o coloană per câmp, în ordinea din formular. */
  function exportCsv() {
    if (!form || items.length === 0) return;
    const header = ["Data", ...labels, "Total (lei)"];
    const rows = items.map((sub) => {
      const byLabel = answersByLabel(sub);
      return [
        formatMoment(sub.createdAt),
        ...labels.map((label) => byLabel.get(label) ?? ""),
        sub.total ? String(sub.total) : "",
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.slug || "formular"}-cereri.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Toate cererile, ca tabel — browserul oferă „Salvează ca PDF”. */
  function exportPdf() {
    if (!form || items.length === 0) return;
    printSubmissionsTable(
      form,
      items,
      data.organization ?? {},
      data.settings.name
    );
  }

  /** O singură cerere, ca document A4 cu subsolul organizatorului. */
  function exportSubmissionPdf(sub: FormSubmission) {
    if (!form) return;
    printSubmission(form, sub, data.organization ?? {}, data.settings.name);
  }

  const unread = items.filter((s) => !s.read).length;

  /** Butoanele de acțiune dintr-un rând (aceleași în ambele vederi). */
  function rowActions(sub: FormSubmission) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openSubmission(sub)}
          aria-label="Vezi cererea"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => exportSubmissionPdf(sub)}
          aria-label="Descarcă cererea în PDF"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void markRead(sub, !sub.read)}
          aria-label={sub.read ? "Marchează necitită" : "Marchează citită"}
        >
          {sub.read ? (
            <Mail className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <ConfirmDelete
          itemLabel={`cererea de la ${sub.summary || "expozant"}`}
          onConfirm={() => void remove(sub)}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Șterge">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cereri primite</DialogTitle>
            <DialogDescription>
              {form ? form.title : ""}
              {items.length > 0
                ? ` · ${items.length} cereri, ${unread} necitite`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se încarcă cererile…
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Nicio cerere primită deocamdată. Distribuie linkul formularului ca
              să începi să primești înscrieri.
            </p>
          ) : (
            <Tabs defaultValue="rezumat">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="rezumat">Rezumat</TabsTrigger>
                  <TabsTrigger value="tabel">Tabel complet</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportPdf}>
                    <FileText className="h-4 w-4" />
                    Descarcă PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <Download className="h-4 w-4" />
                    Descarcă CSV
                  </Button>
                </div>
              </div>

              <TabsContent value="rezumat">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stare</TableHead>
                      <TableHead>Solicitant</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((sub) => (
                      <TableRow
                        key={sub.id}
                        className={sub.read ? "" : "bg-secondary/40"}
                      >
                        <TableCell>
                          {sub.read ? (
                            <span className="text-xs text-muted-foreground">
                              Citită
                            </span>
                          ) : (
                            <span className="inline-block h-2 w-2 rounded-full bg-terracotta" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={sub.read ? "" : "font-semibold"}>
                            <p className="text-foreground">
                              {sub.summary || "—"}
                            </p>
                            {sub.email ? (
                              <p className="text-xs text-muted-foreground">
                                {sub.email}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatMoment(sub.createdAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {sub.total ? formatTotal(sub.total) : "—"}
                        </TableCell>
                        <TableCell>{rowActions(sub)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Toate răspunsurile, o coloană per câmp. `Table` derulează deja
                  pe orizontală; `min-w-max` îl lasă mai lat decât dialogul, în
                  loc să înghesuie coloanele. */}
              <TabsContent value="tabel">
                <Table className="min-w-max text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Data
                        </TableHead>
                        {labels.map((label) => (
                          <TableHead
                            key={label}
                            className="min-w-32 max-w-52 whitespace-normal align-bottom"
                          >
                            {label}
                          </TableHead>
                        ))}
                        {showTotals ? (
                          <TableHead className="whitespace-nowrap">
                            Total
                          </TableHead>
                        ) : null}
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((sub) => {
                        const byLabel = answersByLabel(sub);
                        return (
                          <TableRow
                            key={sub.id}
                            className={sub.read ? "" : "bg-secondary/40"}
                          >
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatMoment(sub.createdAt)}
                            </TableCell>
                            {labels.map((label) => (
                              <TableCell
                                key={label}
                                className="min-w-32 max-w-52 whitespace-pre-wrap align-top"
                              >
                                {byLabel.get(label) || "—"}
                              </TableCell>
                            ))}
                            {showTotals ? (
                              <TableCell className="whitespace-nowrap font-medium">
                                {sub.total ? formatTotal(sub.total) : "—"}
                              </TableCell>
                            ) : null}
                            <TableCell>{rowActions(sub)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Detaliul unei cereri */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>{active.formTitle}</DialogTitle>
                <DialogDescription>
                  Trimisă {formatMoment(active.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <dl className="space-y-3 text-sm">
                {active.answers.map((answer) => (
                  <div key={answer.id}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {answer.label}
                    </dt>
                    <dd className="whitespace-pre-wrap text-foreground">
                      {answer.value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
              {active.total ? (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total estimat</span>
                    <Badge variant="gold">{formatTotal(active.total)}</Badge>
                  </div>
                </>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => exportSubmissionPdf(active)}
                >
                  <FileText className="h-4 w-4" />
                  Descarcă PDF
                </Button>
                {active.email ? (
                  <Button asChild variant="outline">
                    <a href={`mailto:${active.email}`}>Răspunde prin email</a>
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
