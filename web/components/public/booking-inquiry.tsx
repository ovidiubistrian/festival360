"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { submitContactMessage } from "@/lib/api";

interface FormState {
  nume: string;
  email: string;
  telefon: string;
  checkIn: string;
  checkOut: string;
  persoane: string;
  mesaj: string;
}

const INITIAL: FormState = {
  nume: "",
  email: "",
  telefon: "",
  checkIn: "",
  checkOut: "",
  persoane: "2",
  mesaj: "",
};

export function BookingInquiry({
  accommodationName,
  slug,
}: {
  accommodationName: string;
  slug: string;
}) {
  const [values, setValues] = React.useState<FormState>(INITIAL);
  const [loading, setLoading] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.nume || !values.email) {
      toast.error("Completează câmpurile necesare", {
        description: "Avem nevoie cel puțin de nume și email.",
      });
      return;
    }

    const lines = [
      `Cerere de rezervare pentru: ${accommodationName}`,
      "",
      `Nume: ${values.nume}`,
      `Email: ${values.email}`,
    ];
    if (values.telefon) lines.push(`Telefon: ${values.telefon}`);
    if (values.checkIn) lines.push(`Check-in: ${values.checkIn}`);
    if (values.checkOut) lines.push(`Check-out: ${values.checkOut}`);
    lines.push(`Număr persoane: ${values.persoane || "-"}`);
    if (values.mesaj) {
      lines.push("", "Mesaj:", values.mesaj);
    }

    setLoading(true);
    const ok = await submitContactMessage(slug, {
      name: values.nume,
      email: values.email,
      subject: `Cerere de rezervare: ${accommodationName}`,
      message: lines.join("\n"),
    });
    setLoading(false);

    if (ok) {
      setValues(INITIAL);
      toast.success("Cererea a fost trimisă!", {
        description: "Revenim către tine cu o ofertă cât mai curând.",
      });
    } else {
      toast.error("Nu am putut trimite cererea", {
        description: "Te rugăm să încerci din nou peste puțin timp.",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-terracotta" />
        <h3 className="font-serif text-lg font-semibold text-primary">
          Cere ofertă
        </h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Rezervă-ți sejurul la {accommodationName} — completează detaliile și
        revenim cu o ofertă personalizată.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="booking-nume">Nume</Label>
          <Input
            id="booking-nume"
            name="nume"
            required
            autoComplete="name"
            placeholder="Numele tău"
            value={values.nume}
            onChange={(e) => update("nume", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-email">Email</Label>
          <Input
            id="booking-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="adresa@email.ro"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-telefon">Telefon (opțional)</Label>
          <Input
            id="booking-telefon"
            name="telefon"
            type="tel"
            autoComplete="tel"
            placeholder="07xx xxx xxx"
            value={values.telefon}
            onChange={(e) => update("telefon", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="booking-checkin">Check-in</Label>
            <Input
              id="booking-checkin"
              name="checkIn"
              type="date"
              value={values.checkIn}
              onChange={(e) => update("checkIn", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-checkout">Check-out</Label>
            <Input
              id="booking-checkout"
              name="checkOut"
              type="date"
              value={values.checkOut}
              onChange={(e) => update("checkOut", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-persoane">Număr persoane</Label>
          <Input
            id="booking-persoane"
            name="persoane"
            type="number"
            min={1}
            value={values.persoane}
            onChange={(e) => update("persoane", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-mesaj">Mesaj (opțional)</Label>
          <Textarea
            id="booking-mesaj"
            name="mesaj"
            rows={4}
            placeholder="Preferințe, întrebări sau cerințe speciale…"
            value={values.mesaj}
            onChange={(e) => update("mesaj", e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="terracotta"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          <CalendarCheck className="h-4 w-4" />
          {loading ? "Se trimite…" : "Trimite cererea"}
        </Button>
      </form>
    </div>
  );
}
