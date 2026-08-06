"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { login } from "@/lib/admin/store";
import { clearCurrentTenant } from "@/lib/admin/session";

export default function DemoAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleLogin() {
    if (submitting) return;
    setSubmitting(true);
    const user = await login(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (!user) {
      toast.error("Email sau parolă incorecte");
      return;
    }
    // Route by role: super-admin lands on the platform site list (in platform
    // mode — clear any stale previously-selected tenant); a tenant-admin lands
    // on their own site's dashboard.
    if (user.isSuperuser) {
      clearCurrentTenant();
      router.push("/admin/sites");
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Badge variant="gold">Siteora</Badge>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl text-primary">
              Autentificare
            </CardTitle>
            <CardDescription>
              Conectează-te pentru a-ți gestiona site-ul. Rolul și site-urile
              tale sunt determinate automat din cont.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleLogin();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="nume@exemplu.ro"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Parolă</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Autentificare
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {process.env.NODE_ENV !== "production" && (
              <div className="rounded-xl border border-border bg-secondary/60 p-3 text-left">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-terracotta" />
                  <span className="text-xs font-medium text-foreground">
                    Conturi demo (doar în dezvoltare)
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>
                    Super-admin:{" "}
                    <span className="font-mono text-foreground">
                      admin@prispa.demo
                    </span>
                  </li>
                  <li>
                    Admin site:{" "}
                    <span className="font-mono text-foreground">
                      admin@prispa.ro
                    </span>
                  </li>
                  <li>
                    Parolă:{" "}
                    <span className="font-mono text-foreground">demo1234</span>
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4 text-sm">
          <Link
            href="/"
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Siteora
          </Link>
        </div>
      </div>
    </div>
  );
}
