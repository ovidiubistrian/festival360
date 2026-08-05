"use client";

import * as React from "react";
import { Loader2, Inbox, Mail, Building2, Eye } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/admin/stat-card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listLeads, setLeadStatus, type Lead } from "@/lib/admin/platform";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const EVENT_TYPE_LABEL: Record<string, string> = {
  festival: "Festival",
  resort: "Stațiune",
  museum: "Muzeu",
  conference: "Conferință",
  other: "Altul",
};

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  cultural: "Cultural",
  enterprise: "Enterprise",
};

const STATUSES = ["new", "contacted", "converted", "closed"] as const;

const STATUS_LABEL: Record<string, string> = {
  new: "Nou",
  contacted: "Contactat",
  converted: "Convertit",
  closed: "Închis",
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-amber-100 text-amber-800";
    case "contacted":
      return "bg-sky-100 text-sky-800";
    case "converted":
      return "bg-emerald-100 text-emerald-800";
    case "closed":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [viewing, setViewing] = React.useState<Lead | null>(null);

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [started, setStarted] = React.useState(false);
  if (mounted && !started) {
    setStarted(true);
    void (async () => {
      setLoading(true);
      const items = await listLeads();
      setLeads(items);
      setLoaded(true);
      setLoading(false);
    })();
  }

  const newCount = React.useMemo(
    () => leads.filter((l) => l.status === "new").length,
    [leads]
  );

  async function changeStatus(lead: Lead, status: string) {
    const previous = lead.status;
    // Optimistic update.
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status } : l))
    );
    const ok = await setLeadStatus(lead.id, status);
    if (!ok) {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: previous } : l))
      );
      toast.error("Nu s-a putut actualiza statusul.");
      return;
    }
    toast.success(`Status actualizat: ${STATUS_LABEL[status] ?? status}.`);
  }

  return (
    <AdminShell
      title="Solicitări"
      description="Înscrieri și cereri din pagina de prezentare."
      actions={
        newCount > 0 ? (
          <Badge className="bg-amber-100 text-amber-800">
            {newCount} {newCount === 1 ? "solicitare nouă" : "solicitări noi"}
          </Badge>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total solicitări" value={leads.length} icon={<Inbox />} />
        <StatCard label="Noi (neprelucrate)" value={newCount} icon={<Mail />} />
      </div>

      {loading && !loaded ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nicio solicitare încă. Cererile trimise din pagina de prezentare
              apar aici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Organizație</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {lead.name}
                        </span>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {lead.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.organization || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="w-fit">
                        {EVENT_TYPE_LABEL[lead.eventType] ?? lead.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.plan ? (
                        <Badge variant="outline">
                          {PLAN_LABEL[lead.plan] ?? lead.plan}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      {lead.message ? (
                        <button
                          type="button"
                          onClick={() => setViewing(lead)}
                          className="flex items-center gap-1.5 text-left text-sm text-muted-foreground hover:text-primary"
                        >
                          <span className="truncate">
                            {truncate(lead.message)}
                          </span>
                          <Eye className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(next) => void changeStatus(lead, next)}
                      >
                        <SelectTrigger className="h-9 w-[150px]">
                          <SelectValue>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                statusBadgeClass(lead.status)
                              )}
                            >
                              {STATUS_LABEL[lead.status] ?? lead.status}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {leads.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {leads.length} solicitări în total.
        </p>
      ) : null}

      <Dialog
        open={viewing !== null}
        onOpenChange={(next) => {
          if (!next) setViewing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitare de la {viewing?.name}</DialogTitle>
            <DialogDescription>
              {viewing ? (
                <span className="flex flex-wrap items-center gap-2">
                  <a
                    href={`mailto:${viewing.email}`}
                    className="inline-flex items-center gap-1 hover:text-primary"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {viewing.email}
                  </a>
                  {viewing.organization ? (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {viewing.organization}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-charcoal/85 whitespace-pre-wrap">
            {viewing?.message || "Fără mesaj."}
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
