"use client";

import * as React from "react";
import { Mail, MailOpen, Trash2, Eye, Check } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  deleteMessage,
  markMessageRead,
  useAdminData,
} from "@/lib/admin/store";
import type { ContactMessage } from "@/lib/tenants/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function MessagesPage() {
  const data = useAdminData();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [active, setActive] = React.useState<ContactMessage | null>(null);

  const unreadCount = data.contactMessages.filter((m) => !m.read).length;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.contactMessages.filter((m) => {
      const matchesQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || !m.read;
      return matchesQ && matchesFilter;
    });
  }, [data.contactMessages, query, filter]);

  function openMessage(m: ContactMessage) {
    setActive(m);
    if (!m.read) markMessageRead(m.id, true);
  }

  function toggleRead(m: ContactMessage) {
    markMessageRead(m.id, !m.read);
    toast.success(m.read ? "Marcat ca necitit." : "Marcat ca citit.");
  }

  function remove(m: ContactMessage) {
    deleteMessage(m.id);
    toast.success("Mesaj șters.");
  }

  return (
    <AdminShell
      title="Mesaje de contact"
      description="Mesajele trimise de vizitatori prin formularul de contact al site-ului. Nu apar public — sunt vizibile doar aici."
      actions={
        <Badge variant={unreadCount > 0 ? "terracotta" : "muted"}>
          {unreadCount} necitite
        </Badge>
      }
    >
      <DataToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Caută după nume, email, subiect..."
        right={
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Toate
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Necitite
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stare</TableHead>
                <TableHead>Expeditor</TableHead>
                <TableHead>Subiect</TableHead>
                <TableHead>Dată</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Niciun mesaj găsit.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id} className={m.read ? "" : "bg-secondary/40"}>
                    <TableCell>
                      {m.read ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <span className="flex items-center gap-1.5 text-primary">
                          <Mail className="h-4 w-4" />
                          <span className="inline-block h-2 w-2 rounded-full bg-terracotta" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={m.read ? "" : "font-semibold"}>
                        <p className="text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span
                        className={`line-clamp-1 ${m.read ? "text-muted-foreground" : "font-medium text-foreground"}`}
                      >
                        {m.subject}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(m.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openMessage(m)}
                          aria-label="Citește mesajul"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRead(m)}
                          aria-label={
                            m.read ? "Marchează necitit" : "Marchează citit"
                          }
                        >
                          {m.read ? (
                            <Mail className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <ConfirmDelete
                          itemLabel={`mesajul de la ${m.name}`}
                          onConfirm={() => remove(m)}
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
        Afișez {filtered.length} din {data.contactMessages.length} mesaje.
      </p>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>{active.subject}</DialogTitle>
                <DialogDescription>
                  De la {active.name} · {active.email} ·{" "}
                  {formatDate(active.date)}
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {active.message}
              </p>
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline">
                  <a href={`mailto:${active.email}`}>Răspunde prin email</a>
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
