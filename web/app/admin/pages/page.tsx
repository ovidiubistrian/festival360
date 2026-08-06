"use client";

import { ChevronUp, ChevronDown, Eye, Trash2 } from "lucide-react";
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
import {
  moveSection,
  removeSection,
  toggleSection,
  useAdminData,
} from "@/lib/admin/store";
import {
  AddSectionButton,
  SectionConfigButton,
} from "@/components/admin/section-config-dialog";
import { toast } from "sonner";

/**
 * What each homepage section renders on the public site. Keyed by section id
 * so the admin is explicit about the zone every switch controls.
 */
const SECTION_HINTS: Record<string, string> = {
  hero: "Antetul mare din capul paginii, cu titlul, sloganul și imaginea hero.",
  about: "Blocul „Despre festival” — prezentarea și cifrele principale.",
  experiences: "Grila „Zone și experiențe” cu tipurile de activități.",
  program: "Programul pe zile al evenimentelor.",
  exhibitors: "Selecția de expozanți (producători și meșteșugari).",
  products: "Selecția de produse locale.",
  destinations: "Selecția de destinații turistice.",
  partners: "Logourile partenerilor și sponsorilor evidențiați.",
  gallery: "Galeria foto cu filtre și lightbox.",
  news: "Ultimele articole din secțiunea Noutăți.",
  newsletter: "Formularul de abonare la newsletter.",
};

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

  function onDelete(id: string, label: string) {
    removeSection(id);
    toast.success(`Secțiunea „${label}” a fost ștearsă.`);
  }

  const visibleCount = data.sections.filter((s) => s.visible).length;

  return (
    <AdminShell
      title="Pagini și secțiuni"
      description="Fiecare rând este o zonă de pe pagina principală. Comutatorul o arată sau o ascunde — inclusiv din meniul de sus și din footer — iar săgețile îi schimbă ordinea pe site."
      actions={<AddSectionButton />}
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
                className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3 first:pt-0 last:pb-0"
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
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {section.label}
                    {section.custom ? (
                      <Badge variant="secondary">Personalizată</Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {section.custom
                      ? "Secțiune personalizată cu conținut filtrat."
                      : (SECTION_HINTS[section.id] ?? `ID: ${section.id}`)}
                  </p>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <SectionConfigButton section={section} />

                  {section.custom ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(section.id, section.label)}
                      aria-label={`Șterge secțiunea ${section.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}

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
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
