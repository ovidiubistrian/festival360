"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CreditCard,
  SlidersHorizontal,
  ArrowUpCircle,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  listSubscriptions,
  setTenantPlan,
  createCheckout,
  type SubscriptionRow,
  type BillingPlan,
  type BillingCycle,
} from "@/lib/admin/platform";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const EVENT_TYPE_LABEL: Record<string, string> = {
  festival: "Festival",
  resort: "Stațiune",
  museum: "Muzeu",
  conference: "Conferință",
};

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  cultural: "Cultural",
  enterprise: "Enterprise",
};

/** Payable plans offered through Stripe Checkout. */
const BILLING_PLANS: BillingPlan[] = ["pro", "cultural"];
const BILLING_PLAN_LABEL: Record<BillingPlan, string> = {
  pro: "Pro",
  cultural: "Cultural",
};
const BILLING_CYCLES: BillingCycle[] = ["monthly", "annual"];
const BILLING_CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "Lunar",
  annual: "Anual",
};

const PLANS = ["starter", "pro", "cultural", "enterprise"] as const;
const STATUSES = [
  "active",
  "trialing",
  "past_due",
  "suspended",
  "none",
] as const;

const STATUS_LABEL: Record<string, string> = {
  active: "Activ",
  trialing: "Perioadă de probă",
  past_due: "Plată restantă",
  suspended: "Suspendat",
  none: "Fără abonament",
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "trialing":
      return "bg-amber-100 text-amber-800";
    case "past_due":
    case "suspended":
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusBadgeClass(status)
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function periodLabel(row: SubscriptionRow): string {
  if (row.status === "trialing" && row.trialEndsAt) {
    return `Probă până la ${formatDate(row.trialEndsAt)}`;
  }
  if (row.currentPeriodEnd) {
    return `Până la ${formatDate(row.currentPeriodEnd)}`;
  }
  if (row.trialEndsAt) {
    return `Probă până la ${formatDate(row.trialEndsAt)}`;
  }
  return "—";
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<SubscriptionRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Edit dialog state.
  const [editing, setEditing] = React.useState<SubscriptionRow | null>(null);
  const [plan, setPlan] = React.useState<string>("starter");
  const [status, setStatus] = React.useState<string>("active");
  const [saving, setSaving] = React.useState(false);

  // Upgrade (paid Stripe Checkout) dialog state.
  const [upgrading, setUpgrading] = React.useState<SubscriptionRow | null>(null);
  const [targetPlan, setTargetPlan] = React.useState<BillingPlan>("pro");
  const [targetCycle, setTargetCycle] =
    React.useState<BillingCycle>("monthly");
  const [checkingOut, setCheckingOut] = React.useState(false);

  // Load once on first client render, without a mount effect (repo enforces
  // react-hooks/set-state-in-effect).
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
      const items = await listSubscriptions();
      setRows(items);
      setLoaded(true);
      setLoading(false);
    })();
  }

  async function refresh() {
    const items = await listSubscriptions();
    setRows(items);
    setLoaded(true);
  }

  function openEdit(row: SubscriptionRow) {
    setEditing(row);
    setPlan(PLANS.includes(row.plan as (typeof PLANS)[number]) ? row.plan : "starter");
    setStatus(
      STATUSES.includes(row.status as (typeof STATUSES)[number])
        ? row.status
        : "active"
    );
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const ok = await setTenantPlan(editing.tenantId, plan, status);
    setSaving(false);
    if (!ok) {
      toast.error("Nu s-a putut actualiza abonamentul.");
      return;
    }
    toast.success(`Abonamentul „${editing.tenantName}” a fost actualizat.`);
    setEditing(null);
    await refresh();
  }

  function openUpgrade(row: SubscriptionRow) {
    setUpgrading(row);
    setTargetPlan("pro");
    setTargetCycle("monthly");
  }

  async function handleCheckout() {
    if (!upgrading) return;
    setCheckingOut(true);
    const res = await createCheckout(
      upgrading.tenantId,
      targetPlan,
      targetCycle
    );
    setCheckingOut(false);
    if (res.ok && res.url) {
      // Redirect to Stripe-hosted Checkout.
      window.location.href = res.url;
      return;
    }
    if (res.notConfigured) {
      toast.error(res.error ?? "Plăți indisponibile: Stripe nu este configurat.", {
        action: {
          label: "Configurează Stripe",
          onClick: () => router.push("/admin/billing"),
        },
      });
      return;
    }
    toast.error(res.error ?? "Nu s-a putut porni plata.");
  }

  return (
    <AdminShell
      title="Abonamente"
      description="Planul și statusul fiecărui site din platformă."
    >
      {loading && !loaded ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Niciun abonament de afișat.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Perioadă</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.tenantId}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">
                          {row.tenantName}
                        </span>
                        <Badge variant="secondary" className="w-fit">
                          {EVENT_TYPE_LABEL[row.eventType] ?? row.eventType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PLAN_LABEL[row.plan] ?? row.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {periodLabel(row)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => openUpgrade(row)}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Upgrade
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(row)}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                          Schimbă planul
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {rows.length} abonamente în platformă.
        </p>
      ) : null}

      <Dialog
        open={editing !== null}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schimbă planul</DialogTitle>
            <DialogDescription>
              {editing
                ? `Actualizează planul și statusul pentru „${editing.tenantName}”.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sub-plan">Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger id="sub-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLAN_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="sub-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Renunță
            </Button>
            <Button
              variant="gold"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Se salvează…" : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={upgrading !== null}
        onOpenChange={(next) => {
          if (!next) setUpgrading(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade cu plată</DialogTitle>
            <DialogDescription>
              {upgrading
                ? `Pornește o plată Stripe pentru „${upgrading.tenantName}”. Vei fi redirecționat către Checkout.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="upgrade-plan">Plan</Label>
              <Select
                value={targetPlan}
                onValueChange={(v) => setTargetPlan(v as BillingPlan)}
              >
                <SelectTrigger id="upgrade-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {BILLING_PLAN_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upgrade-cycle">Ciclu de facturare</Label>
              <Select
                value={targetCycle}
                onValueChange={(v) => setTargetCycle(v as BillingCycle)}
              >
                <SelectTrigger id="upgrade-cycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {BILLING_CYCLE_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgrading(null)}
              disabled={checkingOut}
            >
              Renunță
            </Button>
            <Button
              variant="gold"
              onClick={() => void handleCheckout()}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpCircle className="h-4 w-4" />
              )}
              {checkingOut ? "Se pregătește…" : "Continuă către plată"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
