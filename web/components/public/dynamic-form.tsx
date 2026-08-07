"use client";

import * as React from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitForm } from "@/lib/api";
import type {
  FormDefinition,
  FormField,
  FormFieldOption,
  OrganizationInfo,
} from "@/lib/tenants/types";
import { toast } from "sonner";

type Value = string | boolean | string[];

/** Valoarea inițială a unui câmp, după tipul lui. */
function initialValue(field: FormField): Value {
  if (field.type === "checkbox") return false;
  if (field.type === "checkboxGroup") return [];
  return "";
}

function initialValues(fields: FormField[]): Record<string, Value> {
  const values: Record<string, Value> = {};
  for (const field of fields) {
    if (field.type === "section" || field.type === "info") continue;
    values[field.id] = initialValue(field);
  }
  return values;
}

function formatLei(amount: number): string {
  return `${amount.toLocaleString("ro-RO")} lei`;
}

/** Eticheta unei opțiuni, cu prețul între paranteze când există. */
function optionText(option: FormFieldOption): string {
  return option.price
    ? `${option.label} (${formatLei(option.price)})`
    : option.label;
}

/** Suma opțiunilor bifate — aceeași regulă pe care o aplică și serverul. */
function computeTotal(
  fields: FormField[],
  values: Record<string, Value>
): number {
  let total = 0;
  for (const field of fields) {
    const value = values[field.id];
    for (const option of field.options ?? []) {
      if (!option.price) continue;
      const picked = Array.isArray(value)
        ? value.includes(option.label)
        : value === option.label;
      if (picked) total += option.price;
    }
  }
  return total;
}

function FieldLabel({ field }: { field: FormField }) {
  return (
    <Label htmlFor={field.id}>
      {field.label}
      {field.required ? (
        <span className="ml-0.5 text-terracotta" aria-hidden>
          *
        </span>
      ) : null}
    </Label>
  );
}

function OptionRow({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-warm-white px-4 py-3 text-sm transition-colors hover:border-primary/40"
    >
      {children}
    </label>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: Value;
  onChange: (value: Value) => void;
}) {
  const options = field.options ?? [];

  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          id={field.id}
          rows={5}
          required={field.required}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "select":
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={field.id} aria-label={field.label}>
            <SelectValue placeholder={field.placeholder || "Alege…"} />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter((o) => o.label)
              .map((option) => (
                <SelectItem key={option.label} value={option.label}>
                  {optionText(option)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      );

    case "radio":
      return (
        <div className="space-y-2" role="radiogroup" aria-label={field.label}>
          {options
            .filter((o) => o.label)
            .map((option) => {
              const id = `${field.id}-${option.label}`;
              return (
                <OptionRow key={option.label} htmlFor={id}>
                  <input
                    type="radio"
                    id={id}
                    name={field.id}
                    value={option.label}
                    checked={value === option.label}
                    onChange={() => onChange(option.label)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.price ? (
                    <span className="font-medium text-primary">
                      {formatLei(option.price)}
                    </span>
                  ) : null}
                </OptionRow>
              );
            })}
        </div>
      );

    case "checkboxGroup": {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {options
            .filter((o) => o.label)
            .map((option) => {
              const id = `${field.id}-${option.label}`;
              return (
                <OptionRow key={option.label} htmlFor={id}>
                  <Checkbox
                    id={id}
                    checked={picked.includes(option.label)}
                    onCheckedChange={(checked) =>
                      onChange(
                        checked
                          ? [...picked, option.label]
                          : picked.filter((p) => p !== option.label)
                      )
                    }
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.price ? (
                    <span className="font-medium text-primary">
                      {formatLei(option.price)}
                    </span>
                  ) : null}
                </OptionRow>
              );
            })}
        </div>
      );
    }

    case "checkbox":
      return (
        <OptionRow htmlFor={field.id}>
          <Checkbox
            id={field.id}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <span className="flex-1">
            {field.label}
            {field.required ? (
              <span className="ml-0.5 text-terracotta" aria-hidden>
                *
              </span>
            ) : null}
          </span>
        </OptionRow>
      );

    default:
      return (
        <Input
          id={field.id}
          type={
            field.type === "email"
              ? "email"
              : field.type === "tel"
                ? "tel"
                : field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : "text"
          }
          required={field.required}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/** Subsolul cu datele juridice ale organizatorului. */
function OrganizationFooter({ org }: { org: OrganizationInfo }) {
  const address = [org.address, org.city, org.county].filter(Boolean).join(", ");
  const bank = [org.iban, org.bank].filter(Boolean).join(" – ");
  const parts = [
    address,
    org.cif ? `CIF: ${org.cif}` : "",
    org.regCom,
    bank,
    org.email,
    org.phone,
    org.note,
  ].filter((part) => part && String(part).trim());

  if (!org.name && parts.length === 0) return null;

  return (
    <footer className="mt-10 border-t border-border pt-6 text-xs leading-relaxed text-charcoal/60">
      {org.name ? (
        <p className="font-semibold text-charcoal/80">{org.name}</p>
      ) : null}
      {parts.length > 0 ? <p className="mt-1">{parts.join(" | ")}</p> : null}
    </footer>
  );
}

/**
 * Randează un formular construit din admin. Câmpurile vin din baza de date, deci
 * componenta nu știe nimic despre un formular anume — doar despre tipuri.
 */
export function DynamicForm({
  slug,
  form,
  organization,
}: {
  slug: string;
  form: FormDefinition;
  organization: OrganizationInfo;
}) {
  const fields = form.fields ?? [];
  const [values, setValues] = React.useState<Record<string, Value>>(() =>
    initialValues(fields)
  );
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const total = computeTotal(fields, values);

  function update(id: string, value: Value) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = await submitForm(slug, form.slug, values);
    setLoading(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    toast.error("Cererea nu a putut fi trimisă", {
      description:
        result.error ?? "Te rugăm să încerci din nou peste puțin timp.",
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 font-serif text-xl font-semibold text-primary">
          Cerere trimisă
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/70">
          {form.successMessage ||
            "Am primit cererea ta. Revenim cu un răspuns cât mai curând."}
        </p>
        {form.showOrganization ? (
          <OrganizationFooter org={organization} />
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const span =
            field.width === "half" ? "sm:col-span-1" : "sm:col-span-2";

          if (field.type === "section") {
            return (
              <div key={field.id} className="sm:col-span-2">
                <h2 className="border-b border-border pb-2 font-serif text-lg font-semibold uppercase tracking-wide text-primary">
                  {field.label}
                </h2>
                {field.help ? (
                  <p className="mt-2 text-sm text-charcoal/70">{field.help}</p>
                ) : null}
              </div>
            );
          }

          if (field.type === "info") {
            return (
              <div
                key={field.id}
                className="rounded-xl border border-border bg-secondary/50 px-4 py-3 sm:col-span-2"
              >
                <p className="text-sm font-medium text-primary">
                  {field.label}
                </p>
                {field.help ? (
                  <p className="mt-1 text-sm text-charcoal/70">{field.help}</p>
                ) : null}
              </div>
            );
          }

          return (
            <div key={field.id} className={`space-y-2 ${span}`}>
              {field.type === "checkbox" ? null : (
                <FieldLabel field={field} />
              )}
              <FieldControl
                field={field}
                value={values[field.id] ?? initialValue(field)}
                onChange={(value) => update(field.id, value)}
              />
              {field.help ? (
                <p className="text-xs text-charcoal/60">{field.help}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {total > 0 ? (
        <div className="mt-6 flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
          <span className="text-sm font-medium text-primary">
            Total estimat
          </span>
          <span className="font-serif text-lg font-semibold text-primary">
            {formatLei(total)}
          </span>
        </div>
      ) : null}

      <Button
        type="submit"
        variant="terracotta"
        size="lg"
        className="mt-6"
        disabled={loading}
      >
        <Send className="h-4 w-4" />
        {loading ? "Se trimite…" : form.submitLabel || "Trimite cererea"}
      </Button>

      <p className="mt-3 text-xs text-charcoal/60">
        Câmpurile marcate cu <span className="text-terracotta">*</span> sunt
        obligatorii.
      </p>

      {form.showOrganization ? (
        <OrganizationFooter org={organization} />
      ) : null}
    </form>
  );
}
