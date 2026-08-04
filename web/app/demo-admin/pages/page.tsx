"use client";

import { ChevronUp, ChevronDown, Eye, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { moveSection, toggleSection, useAdminData } from "@/lib/admin/store";
import { toast } from "sonner";

export default function PagesPage() {
  const data = useAdminData();

  function onToggle(id: string, label: string, visible: boolean) {
    toggleSection(id);
    toast.success(
      visible ? `Secțiunea „${label}” a fost ascunsă.` : `Secțiunea „${label}” este vizibilă.`
    );
  }

  function onMove(id: string, dir: -1 | 1) {
    moveSection(id, dir);
  }

  const visibleCount = data.sections.filter((s) => s.visible).length;

  return (
    <AdminShell
      title="Pagini și secțiuni"
      description="Controlează ce secțiuni apar pe pagina principală a site-ului și în ce ordine. Modificările sunt o previzualizare demonstrativă."
      actions={
        <Button asChild variant="outline" size="sm">
          <a href="/prispa" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Previzualizează site-ul
          </a>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Secțiuni homepage</CardTitle>
              <CardDescription>
                {visibleCount} din {data.sections.length} secțiuni vizibile
              </CardDescription>
            </div>
            <Eye className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {data.sections.map((section, index) => (
              <li
                key={section.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index <= 0}
                    onClick={() => onMove(section.id, -1)}
                    aria-label="Mută mai sus"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index >= data.sections.length - 1}
                    onClick={() => onMove(section.id, 1)}
                    aria-label="Mută mai jos"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-primary">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{section.label}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {section.id}
                  </p>
                </div>

                {section.visible ? (
                  <Badge variant="success">Vizibilă</Badge>
                ) : (
                  <Badge variant="muted">Ascunsă</Badge>
                )}

                <Switch
                  checked={section.visible}
                  onCheckedChange={() =>
                    onToggle(section.id, section.label, section.visible)
                  }
                  aria-label={`Comută vizibilitatea secțiunii ${section.label}`}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
