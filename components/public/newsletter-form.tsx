"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Demo only — no data leaves the browser.
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      toast.success("Te-ai abonat cu succes!", {
        description: "Vei primi noutățile despre festival pe email. (demo)",
      });
    }, 600);
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
