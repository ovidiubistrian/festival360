"use client";

import * as React from "react";
import { FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { decodeCsv, parseSubscribersCsv, type ParsedCsv } from "@/lib/admin/csv";
import { importSubscribers } from "@/lib/admin/marketing";
import { toast } from "sonner";

/**
 * Import de abonați dintr-un CSV cu nume și email.
 *
 * Fișierul se citește și se validează în browser, cu previzualizare, ca
 * organizatorul să vadă ce urcă înainte să apese Importă. Serverul rămâne
 * arbitrul dublurilor — el știe lista existentă.
 */
export function SubscriberImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se apelează după un import reușit, ca lista să se reîncarce. */
  onImported: () => void;
}) {
  const [parsed, setParsed] = React.useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setParsed(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    const text = decodeCsv(await file.arrayBuffer());
    const result = parseSubscribersCsv(text);
    setFileName(file.name);
    setParsed(result);
    if (result.rows.length === 0) {
      toast.error(
        "Nu am găsit nicio adresă validă în fișier. Verifică formatul: nume,email"
      );
    }
  }

  async function run() {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    const result = await importSubscribers(parsed.rows);
    setImporting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const parts = [`${result.added} abonați adăugați`];
    if (result.updated) parts.push(`${result.updated} nume completate`);
    if (result.duplicates) parts.push(`${result.duplicates} existau deja`);
    if (result.invalid) parts.push(`${result.invalid} adrese invalide`);
    toast.success(parts.join(" · "));
    onImported();
    reset();
    onOpenChange(false);
  }

  const preview = parsed?.rows.slice(0, 8) ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importă abonați din CSV</DialogTitle>
          <DialogDescription>
            Un rând per abonat, cu numele și adresa de email. Antetul e
            opțional, iar separatorul poate fi virgulă sau punct și virgulă
            (cum salvează Excel).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Exemplu de fișier</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono">
            {"nume,email\nAna Popescu,ana@exemplu.ro\nAtelier Șerban,contact@atelier.ro"}
          </pre>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
            Alege fișierul
          </Button>
          {fileName ? (
            <span className="text-sm text-muted-foreground">{fileName}</span>
          ) : null}
        </div>

        {parsed ? (
          <>
            <p className="text-sm">
              <span className="font-medium text-foreground">
                {parsed.rows.length} adrese valide
              </span>
              {parsed.skipped.length > 0
                ? ` · ${parsed.skipped.length} rânduri ignorate (fără email valid)`
                : ""}
            </p>

            {preview.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row) => (
                    <TableRow key={row.email}>
                      <TableCell>{row.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {parsed.rows.length > preview.length ? (
              <p className="text-xs text-muted-foreground">
                …și încă {parsed.rows.length - preview.length} rânduri.
              </p>
            ) : null}

            {parsed.skipped.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Ignorate: {parsed.skipped.slice(0, 3).join(" · ")}
                {parsed.skipped.length > 3 ? " …" : ""}
              </p>
            ) : null}
          </>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Renunță
          </Button>
          <Button
            variant="gold"
            disabled={!parsed || parsed.rows.length === 0 || importing}
            onClick={() => void run()}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importă {parsed?.rows.length ? `${parsed.rows.length} abonați` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
