"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FormState {
  nume: string;
  email: string;
  subiect: string;
  mesaj: string;
}

const INITIAL: FormState = { nume: "", email: "", subiect: "", mesaj: "" };

export function ContactForm() {
  const [values, setValues] = React.useState<FormState>(INITIAL);
  const [loading, setLoading] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.nume || !values.email || !values.subiect || !values.mesaj) {
      toast.error("Completează toate câmpurile", {
        description: "Avem nevoie de nume, email, subiect și mesaj.",
      });
      return;
    }
    setLoading(true);
    // Demo only — no data leaves the browser.
    setTimeout(() => {
      setLoading(false);
      setValues(INITIAL);
      toast.success("Mesajul a fost trimis!", {
        description: "Îți vom răspunde cât mai curând. (demo)",
      });
    }, 700);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-nume">Nume</Label>
          <Input
            id="contact-nume"
            name="nume"
            required
            autoComplete="name"
            placeholder="Numele tău"
            value={values.nume}
            onChange={(e) => update("nume", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="adresa@email.ro"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subiect">Subiect</Label>
        <Input
          id="contact-subiect"
          name="subiect"
          required
          placeholder="Despre ce ne scrii?"
          value={values.subiect}
          onChange={(e) => update("subiect", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-mesaj">Mesaj</Label>
        <Textarea
          id="contact-mesaj"
          name="mesaj"
          required
          rows={6}
          placeholder="Scrie-ne mesajul tău…"
          value={values.mesaj}
          onChange={(e) => update("mesaj", e.target.value)}
        />
      </div>

      <Button type="submit" variant="terracotta" size="lg" disabled={loading}>
        <Send className="h-4 w-4" />
        {loading ? "Se trimite…" : "Trimite mesajul"}
      </Button>
    </form>
  );
}
