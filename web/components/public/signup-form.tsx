"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitSignup } from "@/lib/api";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EVENT_TYPES = [
  { value: "festival", label: "Festival" },
  { value: "resort", label: "Stațiune turistică" },
  { value: "museum", label: "Muzeu" },
  { value: "conference", label: "Conferință" },
  { value: "other", label: "Altul" },
] as const;

const PLANS = [
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "cultural", label: "Cultural" },
  { value: "enterprise", label: "Enterprise" },
] as const;

/**
 * Public signup / lead form for the marketing landing. Posts to the platform
 * `/signup` endpoint via `submitSignup`. Accepts an optional `defaultPlan` so
 * the pricing CTAs can pre-select a plan when they scroll here.
 */
export function SignupForm({ defaultPlan = "" }: { defaultPlan?: string }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [eventType, setEventType] = React.useState("");
  const [plan, setPlan] = React.useState(defaultPlan);
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  function reset() {
    setName("");
    setEmail("");
    setOrganization("");
    setEventType("");
    setPlan("");
    setMessage("");
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Introdu numele tău.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Introdu o adresă de email validă.");
      return;
    }
    if (!eventType) {
      toast.error("Alege tipul de eveniment.");
      return;
    }

    setSubmitting(true);
    const ok = await submitSignup({
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim(),
      eventType,
      plan,
      message: message.trim(),
    });
    setSubmitting(false);

    if (ok) {
      toast.success("Mulțumim! Te contactăm în curând.");
      reset();
    } else {
      toast.error("Ceva nu a mers. Încearcă din nou.");
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Nume</Label>
          <Input
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Numele tău"
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nume@exemplu.ro"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-org">Organizație</Label>
        <Input
          id="signup-org"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Numele organizației tale"
          autoComplete="organization"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="signup-event-type">Tip eveniment</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger id="signup-event-type">
              <SelectValue placeholder="Alege tipul" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-plan">Plan (opțional)</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger id="signup-plan">
              <SelectValue placeholder="Alege un plan" />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-message">Mesaj</Label>
        <Textarea
          id="signup-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Spune-ne câteva cuvinte despre evenimentul tău…"
        />
      </div>

      <Button type="submit" variant="gold" size="lg" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {submitting ? "Se trimite…" : "Trimite solicitarea"}
      </Button>
    </form>
  );
}
