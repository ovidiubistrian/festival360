"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { emptyField, newFieldId } from "@/lib/admin/form-templates";
import type {
  FormField,
  FormFieldOption,
  FormFieldType,
} from "@/lib/tenants/types";

/** Tipurile de câmp, în ordinea în care le oferim organizatorului. */
const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Text scurt" },
  { value: "textarea", label: "Text lung" },
  { value: "email", label: "E-mail" },
  { value: "tel", label: "Telefon" },
  { value: "number", label: "Număr" },
  { value: "date", label: "Dată" },
  { value: "select", label: "Listă derulantă" },
  { value: "radio", label: "O singură variantă" },
  { value: "checkboxGroup", label: "Mai multe variante" },
  { value: "checkbox", label: "Bifă (da/nu)" },
  { value: "section", label: "Titlu de secțiune" },
  { value: "info", label: "Text informativ" },
];

const TYPE_LABEL = new Map(FIELD_TYPES.map((t) => [t.value, t.label]));

/** Tipurile care au listă de opțiuni (și, opțional, prețuri). */
const WITH_OPTIONS: FormFieldType[] = ["select", "radio", "checkboxGroup"];
/** Tipurile care doar structurează pagina — nu se completează. */
const LAYOUT_TYPES: FormFieldType[] = ["section", "info"];

export function hasOptions(type: FormFieldType): boolean {
  return WITH_OPTIONS.includes(type);
}

export function isLayoutField(type: FormFieldType): boolean {
  return LAYOUT_TYPES.includes(type);
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: FormFieldOption[];
  onChange: (options: FormFieldOption[]) => void;
}) {
  function set(index: number, patch: Partial<FormFieldOption>) {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  return (
    <div className="space-y-2">
      <Label>Opțiuni</Label>
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={option.label}
            onChange={(e) => set(index, { label: e.target.value })}
            placeholder="Denumirea opțiunii"
            aria-label={`Opțiunea ${index + 1}`}
          />
          <div className="relative w-36 shrink-0">
            <Input
              type="number"
              min={0}
              step={50}
              value={option.price ? String(option.price) : ""}
              onChange={(e) =>
                set(index, { price: Number(e.target.value) || 0 })
              }
              placeholder="Preț"
              className="pr-10"
              aria-label={`Prețul opțiunii ${index + 1}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              lei
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(options.filter((_, i) => i !== index))}
            aria-label="Șterge opțiunea"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...options, { label: "", price: 0 }])}
      >
        <Plus className="h-4 w-4" />
        Adaugă opțiune
      </Button>
      <p className="text-xs text-muted-foreground">
        Prețul e opțional. Când îl completezi, se adună automat în totalul
        afișat expozantului și salvat pe cerere.
      </p>
    </div>
  );
}

function FieldCard({
  field,
  index,
  total,
  onPatch,
  onMove,
  onDuplicate,
  onRemove,
}: {
  field: FormField;
  index: number;
  total: number;
  onPatch: (patch: Partial<FormField>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const layout = isLayoutField(field.type);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`label-${field.id}`}>
                {layout ? "Titlu" : "Eticheta câmpului"}
              </Label>
              <Input
                id={`label-${field.id}`}
                value={field.label}
                onChange={(e) => onPatch({ label: e.target.value })}
                placeholder={
                  layout ? "ex. DATE EXPOZANT" : "ex. Denumire instituție"
                }
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-52">
              <Label>Tip</Label>
              <Select
                value={field.type}
                onValueChange={(value) => {
                  const type = value as FormFieldType;
                  onPatch({
                    type,
                    options: hasOptions(type)
                      ? field.options?.length
                        ? field.options
                        : [{ label: "", price: 0 }]
                      : [],
                    required: isLayoutField(type) ? false : field.required,
                  });
                }}
              >
                <SelectTrigger aria-label="Tipul câmpului">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasOptions(field.type) ? (
            <OptionsEditor
              options={field.options ?? []}
              onChange={(options) => onPatch({ options })}
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {layout ? null : (
              <div className="space-y-1.5">
                <Label htmlFor={`ph-${field.id}`}>Text substituent</Label>
                <Input
                  id={`ph-${field.id}`}
                  value={field.placeholder ?? ""}
                  onChange={(e) => onPatch({ placeholder: e.target.value })}
                  placeholder="Apare gri, în câmpul gol"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`help-${field.id}`}>
                {field.type === "info" ? "Textul afișat" : "Text ajutător"}
              </Label>
              <Input
                id={`help-${field.id}`}
                value={field.help ?? ""}
                onChange={(e) => onPatch({ help: e.target.value })}
                placeholder="Explicație scurtă sub câmp"
              />
            </div>
          </div>

          {layout ? null : (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={field.required ?? false}
                  onCheckedChange={(v) => onPatch({ required: v })}
                />
                Obligatoriu
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={field.width === "half"}
                  onCheckedChange={(v) =>
                    onPatch({ width: v ? "half" : "full" })
                  }
                />
                Jumătate de rând
              </label>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <Badge variant="muted" className="mb-1 hidden sm:inline-flex">
            {TYPE_LABEL.get(field.type) ?? field.type}
          </Badge>
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              aria-label="Mută câmpul mai sus"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
              aria-label="Mută câmpul mai jos"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDuplicate}
              aria-label="Duplică câmpul"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRemove}
              aria-label="Șterge câmpul"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Constructorul de câmpuri: adaugă, editează, reordonează sau șterge câmpuri.
 * Lucrează pe o listă controlată — părintele decide când o salvează.
 */
export function FormBuilder({
  fields,
  onChange,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}) {
  function patch(index: number, value: Partial<FormField>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...value } : f)));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= fields.length) return;
    const copy = [...fields];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  }

  function duplicate(index: number) {
    const copy = [...fields];
    copy.splice(index + 1, 0, { ...fields[index], id: newFieldId() });
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Formularul nu are încă niciun câmp. Adaugă primul de mai jos.
        </p>
      ) : (
        fields.map((field, index) => (
          <FieldCard
            key={field.id}
            field={field}
            index={index}
            total={fields.length}
            onPatch={(value) => patch(index, value)}
            onMove={(dir) => move(index, dir)}
            onDuplicate={() => duplicate(index)}
            onRemove={() => onChange(fields.filter((_, i) => i !== index))}
          />
        ))
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...fields, emptyField("text")])}
        >
          <Plus className="h-4 w-4" />
          Câmp nou
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...fields, emptyField("section")])}
        >
          <Plus className="h-4 w-4" />
          Titlu de secțiune
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...fields, emptyField("radio")])}
        >
          <Plus className="h-4 w-4" />
          Variante cu preț
        </Button>
      </div>
    </div>
  );
}
