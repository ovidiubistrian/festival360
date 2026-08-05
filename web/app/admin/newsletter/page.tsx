"use client";

import * as React from "react";
import { Plus, Trash2, Download, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  addSubscriber,
  deleteSubscriber,
  useAdminData,
} from "@/lib/admin/store";
import type { NewsletterSubscriber } from "@/lib/tenants/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.newsletter.filter(
      (s) => !q || s.email.toLowerCase().includes(q)
    );
  }, [data.newsletter, query]);

  function addNew() {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      toast.error("Introdu o adresă de email validă.");
      return;
    }
    if (data.newsletter.some((s) => s.email === value)) {
      toast.error("Această adresă este deja înscrisă.");
      return;
    }
    addSubscriber(value, "Admin");
    toast.success("Abonat adăugat.");
    setEmail("");
    setDialogOpen(false);
  }

  function remove(s: NewsletterSubscriber) {
    deleteSubscriber(s.id);
    toast.success("Abonat șters.");
  }

  function exportDemo() {
    toast.success("Export generat (demo) — fără descărcare reală.");
  }

  return (
    <AdminShell
      title="Newsletter"
      description="Abonații înscriși prin secțiunea Newsletter de pe site. Lista nu apare public — o gestionezi doar de aici."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportDemo}>
            <Download className="h-4 w-4" />
            Exportă (demo)
          </Button>
          <Button variant="gold" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Adaugă
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total abonați"
          value={data.newsletter.length}
          icon={<Users />}
        />
      </div>

      <DataToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Caută după email..."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Sursă</TableHead>
                <TableHead>Dată înscriere</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Niciun abonat găsit.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-foreground">
                      {s.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.source}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(s.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <ConfirmDelete
                          itemLabel={s.email}
                          onConfirm={() => remove(s)}
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

      <p className="text-xs text-muted-foreground">
        Afișez {filtered.length} din {data.newsletter.length} abonați.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adaugă abonat</DialogTitle>
            <DialogDescription>
              Introdu adresa de email a noului abonat.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              addNew();
            }}
          >
            <Label htmlFor="sub-email">Email</Label>
            <Input
              id="sub-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nume@exemplu.ro"
            />
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Renunță
            </Button>
            <Button variant="gold" onClick={addNew}>
              Adaugă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
