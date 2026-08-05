"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldAlert } from "lucide-react";
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
import { DEMO_CREDENTIALS, login, loginDemo } from "@/lib/admin/store";

export default function DemoAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = React.useState(DEMO_CREDENTIALS.password);

  async function handleLogin() {
    const ok = await login(email, password);
    if (ok) {
      router.push("/demo-admin/dashboard");
    } else {
      toast.error("Email sau parolă incorecte");
    }
  }

  async function enterDemo() {
    await loginDemo();
    router.push("/demo-admin/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Badge variant="gold">Siteora · PRISPA</Badge>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl text-primary">
              Panou de administrare (demo)
            </CardTitle>
            <CardDescription>
              Gestionează conținutul festivalului într-un mediu de
              demonstrație.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/60 p-3 text-left">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
              <p className="text-xs text-muted-foreground">
                Aceasta este o demonstrație. Nu se realizează nicio
                autentificare reală și nu există securitate. Datele sunt
                salvate doar în browser (localStorage).
              </p>
            </div>

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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Parolă</Label>
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Parolă demo:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {DEMO_CREDENTIALS.password}
                  </span>
                </p>
              </div>

              <Button type="submit" variant="gold" className="w-full">
                Intră în demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => void enterDemo()}
            >
              Continuă ca demo
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-4 text-sm">
          <Link
            href="/"
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Siteora
          </Link>
          <span className="text-border">·</span>
          <a
            href="/prispa"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Vezi site-ul PRISPA
          </a>
        </div>
      </div>
    </div>
  );
}
