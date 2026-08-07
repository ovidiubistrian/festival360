"use client";

import * as React from "react";
import {
  Loader2,
  Save,
  Send,
  Users,
  Download,
  Eye,
  Mail,
  Server,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Field } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getEmailSettings,
  getSubscribers,
  previewCampaign,
  saveEmailSettings,
  sendCampaign,
  sendTestEmail,
  type CampaignTemplate,
  type EmailSettings,
  type EmailSettingsPatch,
  type Subscriber,
} from "@/lib/admin/marketing";
import { SubscriberImportDialog } from "@/components/admin/subscriber-import";
import { getCurrentTenant, useSession } from "@/lib/admin/session";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Local, editable shape of the SMTP form (port kept as a string input). */
interface SmtpForm {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
  enabled: boolean;
}

const EMPTY_FORM: SmtpForm = {
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  fromName: "",
  fromEmail: "",
  useTls: true,
  enabled: false,
};

/** Build the editable form from loaded settings. */
function toForm(s: EmailSettings): SmtpForm {
  return {
    smtpHost: s.smtpHost ?? "",
    smtpPort: String(s.smtpPort ?? 587),
    smtpUser: s.smtpUser ?? "",
    fromName: s.fromName ?? "",
    fromEmail: s.fromEmail ?? "",
    useTls: s.useTls ?? true,
    enabled: s.enabled ?? false,
  };
}

/** Escape a value for a CSV cell (quote when it contains , " or newline). */
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function MarketingPage() {
  // Subscribe so tenant-switch / role changes re-render this page.
  useSession();

  // Client-mount flag without a mount effect (repo lints set-state-in-effect).
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeTenant = mounted ? getCurrentTenant() : null;

  const [settings, setSettings] = React.useState<EmailSettings | null>(null);
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([]);
  const [form, setForm] = React.useState<SmtpForm>(() => EMPTY_FORM);
  // New password typed by the user. Empty = keep the stored password.
  const [password, setPassword] = React.useState("");
  const [loadedTenant, setLoadedTenant] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState("");
  const [testing, setTesting] = React.useState(false);

  const [subject, setSubject] = React.useState("");
  const [campaignBody, setCampaignBody] = React.useState("");
  const [template, setTemplate] = React.useState<CampaignTemplate>("invitation");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  // Cui pleacă: toți abonații sau o listă scrisă de mână (probă, invitați care
  // nu sunt în listă).
  const [audience, setAudience] = React.useState<"all" | "manual">("all");
  const [manualList, setManualList] = React.useState("");
  const [probeEmail, setProbeEmail] = React.useState("");
  const [sendingProbe, setSendingProbe] = React.useState(false);

  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  // Load settings + subscribers for the active tenant — via a render-phase
  // guard keyed on the tenant, never a setState-in-effect. Re-runs when the
  // super-admin switches tenants.
  if (activeTenant && activeTenant !== loadedTenant) {
    setLoadedTenant(activeTenant);
    setLoading(true);
    setLoaded(false);
    setPassword("");
    void (async () => {
      const [s, subs] = await Promise.all([
        getEmailSettings(),
        getSubscribers(),
      ]);
      if (s) {
        setSettings(s);
        setForm(toForm(s));
      }
      setSubscribers(subs);
      setLoaded(true);
      setLoading(false);
    })();
  }

  function set<K extends keyof SmtpForm>(key: K, value: SmtpForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    const port = Number.parseInt(form.smtpPort, 10);
    if (!Number.isFinite(port) || port <= 0) {
      toast.error("Portul SMTP trebuie să fie un număr valid.");
      return;
    }
    setSaving(true);
    const patch: EmailSettingsPatch = {
      smtpHost: form.smtpHost.trim(),
      smtpPort: port,
      smtpUser: form.smtpUser.trim(),
      fromName: form.fromName.trim(),
      fromEmail: form.fromEmail.trim(),
      useTls: form.useTls,
      enabled: form.enabled,
    };
    // Send the password ONLY when the user typed a new one — otherwise omit it
    // so the backend keeps the stored value.
    const typed = password.trim();
    if (typed) patch.smtpPassword = typed;

    const updated = await saveEmailSettings(patch);
    setSaving(false);
    if (!updated) {
      toast.error("Salvarea configurării a eșuat. Încearcă din nou.");
      return;
    }
    setSettings(updated);
    setForm(toForm(updated));
    setPassword("");
    toast.success("Configurarea SMTP a fost salvată.");
  }

  async function handleTest() {
    const to = testEmail.trim();
    if (!EMAIL_RE.test(to)) {
      toast.error("Introdu o adresă de email validă pentru test.");
      return;
    }
    setTesting(true);
    const result = await sendTestEmail(to);
    setTesting(false);
    if (result.ok) {
      toast.success(`Email de test trimis către ${to}.`);
    } else {
      toast.error(result.error ?? "Trimiterea emailului de test a eșuat.");
    }
  }

  /** Adresele valide dintr-un text lipit (separate prin virgulă, ; sau enter). */
  function parseAddresses(text: string): string[] {
    const found = text
      .split(/[\s,;]+/)
      .map((a) => a.trim().toLowerCase())
      .filter((a) => EMAIL_RE.test(a));
    return Array.from(new Set(found));
  }

  async function handleSend() {
    setConfirmOpen(false);
    setSending(true);
    const result = await sendCampaign(
      subject.trim(),
      campaignBody,
      template,
      audience === "manual" ? manualAddresses : []
    );
    setSending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Trimiterea campaniei a eșuat.");
      return;
    }
    const sent = result.sent ?? 0;
    const total = result.total ?? targetCount;
    toast.success(`Campanie trimisă către ${sent}/${total} destinatari.`);
    if (result.failed && result.failed > 0) {
      const first = result.errors?.slice(0, 3).join(" · ");
      toast.error(
        `${result.failed} trimiteri au eșuat.${first ? ` ${first}` : ""}`
      );
    }
    setSubject("");
    setCampaignBody("");
  }

  /** Trimite campania, așa cum e, doar la o adresă — proba dinaintea listei. */
  async function handleProbe() {
    const to = probeEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(to)) {
      toast.error("Introdu o adresă validă pentru probă.");
      return;
    }
    if (!subject.trim() || !campaignBody.trim()) {
      toast.error("Completează subiectul și mesajul înainte de probă.");
      return;
    }
    setSendingProbe(true);
    const result = await sendCampaign(subject.trim(), campaignBody, template, [to]);
    setSendingProbe(false);
    if (!result.ok) {
      toast.error(result.error ?? "Trimiterea probei a eșuat.");
      return;
    }
    toast.success(`Probă trimisă către ${to}.`);
  }

  async function reloadSubscribers() {
    setSubscribers(await getSubscribers());
  }

  async function openPreview() {
    setPreviewing(true);
    const html = await previewCampaign(campaignBody, template);
    setPreviewing(false);
    if (!html) {
      toast.error("Nu am putut genera previzualizarea.");
      return;
    }
    setPreviewHtml(html);
  }

  function exportCsv() {
    const header = "nume,email,date,source";
    const rows = subscribers.map((s) =>
      [csvCell(s.name), csvCell(s.email), csvCell(s.date), csvCell(s.source)].join(
        ","
      )
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "abonati-newsletter.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Fișier CSV exportat.");
  }

  const configured = settings?.configured === true;
  const subscriberCount = subscribers.length;
  const manualAddresses = parseAddresses(manualList);
  const targetCount =
    audience === "manual" ? manualAddresses.length : subscriberCount;
  const canSend =
    configured &&
    targetCount > 0 &&
    subject.trim().length > 0 &&
    campaignBody.trim().length > 0;

  if (!activeTenant) {
    return (
      <AdminShell
        title="Marketing"
        description="Configurează SMTP-ul, gestionează abonații și trimite campanii pe email."
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Selectează un site pentru a gestiona marketingul prin email.
            </p>
          </CardContent>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Marketing"
      description="Configurează SMTP-ul, gestionează abonații și trimite campanii de email către toți abonații."
    >
      {loading && !loaded ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="campanie">
          <TabsList>
            <TabsTrigger value="campanie">Campanie</TabsTrigger>
            <TabsTrigger value="abonati">Abonați</TabsTrigger>
            <TabsTrigger value="smtp">Configurare SMTP</TabsTrigger>
          </TabsList>

          {/* Campanie */}
          <TabsContent value="campanie">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-muted-foreground" />
                  Trimite o campanie
                </CardTitle>
                <CardDescription>
                  Compune un email și trimite-l tuturor celor{" "}
                  <span className="font-medium text-foreground">
                    {subscriberCount} abonați
                  </span>
                  . Mesajul se trimite ca text simplu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!configured ? (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      SMTP-ul nu este configurat complet. Completează datele din
                      fila{" "}
                      <span className="font-medium">„Configurare SMTP”</span>{" "}
                      înainte de a trimite o campanie.
                    </p>
                  </div>
                ) : null}
                {configured && subscriberCount === 0 && audience === "all" ? (
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
                    <Users className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Nu ai încă niciun abonat căruia să-i trimiți campania.</p>
                  </div>
                ) : null}

                {/* Șablonul decide ce se trimite: mesajul ca atare sau
                    invitația construită din datele site-ului. */}
                <Field
                  label="Șablon"
                  hint={
                    template === "invitation"
                      ? "Invitația se completează automat cu numele festivalului, perioada, fotografiile din edițiile trecute, cifrele și ce propunem — din datele site-ului."
                      : "Mesajul se trimite ca text simplu, fără imagini."
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={template === "invitation" ? "gold" : "outline"}
                      size="sm"
                      onClick={() => setTemplate("invitation")}
                    >
                      Invitație
                    </Button>
                    <Button
                      type="button"
                      variant={template === "text" ? "gold" : "outline"}
                      size="sm"
                      onClick={() => setTemplate("text")}
                    >
                      Text simplu
                    </Button>
                  </div>
                </Field>

                <Field label="Subiect">
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={
                      template === "invitation"
                        ? "Te invităm la ediția din acest an"
                        : "Noutăți și oferte"
                    }
                  />
                </Field>
                <Field
                  label={
                    template === "invitation" ? "Mesaj de introducere" : "Mesaj"
                  }
                  hint="Scrie {{nume}} oriunde vrei numele abonatului; pentru cei fără nume salvat devine „prieteni”."
                >
                  <Textarea
                    value={campaignBody}
                    onChange={(e) => setCampaignBody(e.target.value)}
                    placeholder={
                      template === "invitation"
                        ? "Ne bucurăm să te invităm din nou alături de noi…"
                        : "Scrie conținutul emailului…"
                    }
                    rows={template === "invitation" ? 6 : 10}
                  />
                </Field>

                {/* Cui pleacă emailul — altfel nu se vede de nicăieri. */}
                <Field
                  label="Destinatari"
                  hint={
                    audience === "all"
                      ? "Toți abonații din fila „Abonați”, unde poți importa o listă din CSV."
                      : "Trimite doar către adresele scrise aici; nu se adaugă la abonați."
                  }
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={audience === "all" ? "gold" : "outline"}
                        size="sm"
                        onClick={() => setAudience("all")}
                      >
                        <Users className="h-4 w-4" />
                        Toți abonații ({subscriberCount})
                      </Button>
                      <Button
                        type="button"
                        variant={audience === "manual" ? "gold" : "outline"}
                        size="sm"
                        onClick={() => setAudience("manual")}
                      >
                        <Mail className="h-4 w-4" />
                        Doar anumite adrese
                      </Button>
                    </div>

                    {audience === "manual" ? (
                      <>
                        <Textarea
                          value={manualList}
                          onChange={(e) => setManualList(e.target.value)}
                          placeholder="ana@exemplu.ro, ion@exemplu.ro"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          {manualAddresses.length} adrese valide. Le poți separa
                          prin virgulă, punct și virgulă sau enter.
                        </p>
                      </>
                    ) : subscriberCount > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Către:{" "}
                        {subscribers
                          .slice(0, 3)
                          .map((s) => s.email)
                          .join(", ")}
                        {subscriberCount > 3
                          ? ` și încă ${subscriberCount - 3}`
                          : ""}
                        .
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nu ai niciun abonat. Importă o listă din fila „Abonați”
                        sau trimite deocamdată către adrese alese.
                      </p>
                    )}
                  </div>
                </Field>

                {/* Proba: același email, o singură adresă, înainte de listă. */}
                <Field
                  label="Trimite o probă"
                  hint="Vezi emailul în căsuța ta înainte să plece la toată lista."
                >
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      value={probeEmail}
                      onChange={(e) => setProbeEmail(e.target.value)}
                      placeholder="adresa@ta.ro"
                      className="sm:max-w-72"
                    />
                    <Button
                      variant="outline"
                      onClick={() => void handleProbe()}
                      disabled={sendingProbe || !configured}
                    >
                      {sendingProbe ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Trimite proba
                    </Button>
                  </div>
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Se va trimite către {targetCount}{" "}
                    {audience === "manual" ? "adrese alese" : "abonați"}.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void openPreview()}
                      disabled={previewing}
                    >
                      {previewing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Previzualizează
                    </Button>
                    <Button
                      variant="gold"
                      disabled={!canSend || sending}
                      onClick={() => setConfirmOpen(true)}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Trimite
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Abonați */}
          <TabsContent value="abonati">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    Abonați
                  </CardTitle>
                  <CardDescription>
                    {subscriberCount} abonați — înscriși de pe site sau importați
                    din CSV.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Importă CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCsv}
                    disabled={subscriberCount === 0}
                  >
                    <Download className="h-4 w-4" />
                    Exportă CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nume</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Dată înscriere</TableHead>
                      <TableHead>Sursă</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriberCount === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-12 text-center">
                          <p className="text-sm text-muted-foreground">
                            Niciun abonat încă. Importă o listă din CSV sau
                            așteaptă înscrierile de pe site.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscribers.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-foreground">
                            {s.name || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.email}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(s.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{s.source}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurare SMTP */}
          <TabsContent value="smtp">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    Server SMTP
                  </CardTitle>
                  <CardDescription>
                    Datele serverului de email folosit pentru a trimite
                    campaniile și emailurile de test.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Server (host)" className="sm:col-span-2">
                      <Input
                        value={form.smtpHost}
                        onChange={(e) => set("smtpHost", e.target.value)}
                        placeholder="smtp.exemplu.ro"
                      />
                    </Field>
                    <Field label="Port">
                      <Input
                        type="number"
                        value={form.smtpPort}
                        onChange={(e) => set("smtpPort", e.target.value)}
                        placeholder="587"
                      />
                    </Field>
                    <Field label="Utilizator">
                      <Input
                        value={form.smtpUser}
                        onChange={(e) => set("smtpUser", e.target.value)}
                        placeholder="nume@exemplu.ro"
                        autoComplete="off"
                      />
                    </Field>
                    <Field
                      label="Parolă"
                      hint={
                        settings?.hasPassword
                          ? "Lasă gol pentru a păstra parola salvată."
                          : "Introdu parola contului SMTP."
                      }
                      className="sm:col-span-2"
                    >
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          settings?.hasPassword
                            ? "•••• (nespecificat)"
                            : "Parolă SMTP"
                        }
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Nume expeditor">
                      <Input
                        value={form.fromName}
                        onChange={(e) => set("fromName", e.target.value)}
                        placeholder="Echipa Exemplu"
                      />
                    </Field>
                    <Field label="Email expeditor">
                      <Input
                        type="email"
                        value={form.fromEmail}
                        onChange={(e) => set("fromEmail", e.target.value)}
                        placeholder="noreply@exemplu.ro"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="use-tls">Folosește TLS/STARTTLS</Label>
                        <p className="text-xs text-muted-foreground">
                          Recomandat pentru portul 587.
                        </p>
                      </div>
                      <Switch
                        id="use-tls"
                        checked={form.useTls}
                        onCheckedChange={(v) => set("useTls", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="enabled">Trimitere activată</Label>
                        <p className="text-xs text-muted-foreground">
                          Activează trimiterea emailurilor pentru acest site.
                        </p>
                      </div>
                      <Switch
                        id="enabled"
                        checked={form.enabled}
                        onCheckedChange={(v) => set("enabled", v)}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                    Sfat: majoritatea furnizorilor folosesc portul{" "}
                    <span className="font-medium text-foreground">587</span>{" "}
                    (STARTTLS) sau{" "}
                    <span className="font-medium text-foreground">465</span>{" "}
                    (SSL/TLS).
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="gold"
                      onClick={() => void handleSave()}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Salvează
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    Trimite email de test
                  </CardTitle>
                  <CardDescription>
                    Verifică rapid configurarea trimițând un email de test către
                    o adresă la alegere.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Field label="Adresă de test" className="flex-1">
                      <Input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@exemplu.ro"
                      />
                    </Field>
                    <Button
                      variant="outline"
                      onClick={() => void handleTest()}
                      disabled={testing}
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Trimite test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Previzualizarea campaniei — HTML-ul vine gata randat de la API și e
          afișat izolat, într-un iframe, ca stilurile de email să nu se
          amestece cu cele ale adminului. */}
      <Dialog
        open={previewHtml !== null}
        onOpenChange={(open) => !open && setPreviewHtml(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Previzualizare</DialogTitle>
            <DialogDescription>
              Așa arată emailul pentru un abonat pe nume Ana.
            </DialogDescription>
          </DialogHeader>
          <iframe
            title="Previzualizare campanie"
            srcDoc={previewHtml ?? ""}
            className="h-[64vh] w-full rounded-lg border border-border bg-white"
          />
        </DialogContent>
      </Dialog>

      <SubscriberImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => void reloadSubscribers()}
      />

      {/* Confirm send */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold [&_svg]:size-4">
                <Send />
              </span>
              Confirmă trimiterea
            </DialogTitle>
            <DialogDescription>
              Trimiți această campanie către{" "}
              <span className="font-medium text-foreground">
                {targetCount}{" "}
                {audience === "manual" ? "adrese alese" : "abonați"}
              </span>
              ? Acțiunea nu poate fi anulată.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Renunță
            </Button>
            <Button variant="gold" onClick={() => void handleSend()}>
              <Send className="h-4 w-4" />
              Trimite acum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
