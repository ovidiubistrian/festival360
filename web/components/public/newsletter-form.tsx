"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/api";

/**
 * `slug` vine explicit de la server: pe un domeniu custom site-ul stă în
 * rădăcină, deci nu poate fi dedus din URL (acolo abonarea eșua mereu).
 */
export function NewsletterForm({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const ok = await subscribeNewsletter(slug, email);
    setLoading(false);
    if (ok) {
      setEmail("");
      toast.success("Te-ai abonat cu succes!", {
        description: "Vei primi noutățile despre festival pe email.",
      });
    } else {
      toast.error("Nu am putut finaliza abonarea", {
        description: "Te rugăm să încerci din nou.",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={compact ? "flex flex-col gap-2 sm:flex-row" : "flex flex-col gap-3 sm:flex-row"}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Adresa de email
      </label>
      <Input
        id="newsletter-email"
        type="email"
        required
        placeholder="adresa@email.ro"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-warm-white"
      />
      <Button type="submit" disabled={loading} variant="gold">
        <Send className="h-4 w-4" />
        {loading ? "Se trimite…" : "Abonează-te"}
      </Button>
    </form>
  );
}
