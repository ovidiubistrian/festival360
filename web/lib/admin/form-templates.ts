"use client";

/**
 * Șabloane de formular oferite la „Adaugă formular”.
 *
 * Un șablon e doar un punct de plecare: după ce îl alegi, câmpurile sunt ale
 * tale — le poți edita, șterge sau completa din constructor.
 */

import type { FormField, FormFieldType } from "@/lib/tenants/types";
import type { FormPatch } from "@/lib/admin/forms";

let counter = 0;

/** Id unic pentru un câmp nou (stabil în interiorul formularului salvat). */
export function newFieldId(): string {
  counter += 1;
  return `f-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Câmp gol de tipul cerut, gata de completat în constructor. */
export function emptyField(type: FormFieldType = "text"): FormField {
  return {
    id: newFieldId(),
    type,
    label: "",
    placeholder: "",
    help: "",
    required: false,
    width: "full",
    options:
      type === "select" || type === "radio" || type === "checkboxGroup"
        ? [{ label: "", price: 0 }]
        : [],
  };
}

function field(
  type: FormFieldType,
  label: string,
  extra: Partial<FormField> = {}
): FormField {
  return { ...emptyField(type), label, ...extra };
}

/** Formular gol — doar titlu și un câmp de nume. */
function blankForm(): FormPatch {
  return {
    slug: "",
    title: "",
    description: "",
    fields: [field("text", "Nume și prenume", { required: true })],
    submitLabel: "",
    successMessage: "",
    showOrganization: true,
    status: "draft",
    notifyEmail: "",
  };
}

/** Cererea de înscriere a unui expozant (modelul Festivalul Prispa). */
function exhibitorApplication(): FormPatch {
  return {
    slug: "cerere-inscriere-expozant",
    title: "Cerere de înscriere expozant",
    description:
      "Completează cererea pentru a rezerva un spațiu expozițional. " +
      "Te contactăm după înregistrare pentru confirmare și factură.",
    fields: [
      field("section", "Date expozant"),
      field("text", "Denumire instituție", { required: true }),
      field("text", "CUI", { width: "half", required: true }),
      field("text", "Nr. Reg. Com.", { width: "half" }),
      field("text", "Localitate", { width: "half" }),
      field("tel", "Telefon", { width: "half", required: true }),
      field("email", "E-mail", { width: "half", required: true }),
      field("text", "Domeniu activitate", { width: "half" }),

      field("section", "Spațiu expozițional"),
      field("radio", "Pavilioane", {
        required: true,
        options: [
          { label: "Pavilion individual 3x3 m²", price: 3200 },
          { label: "Două pavilioane", price: 6400 },
          { label: "Trei pavilioane", price: 9600 },
        ],
      }),
      field("checkbox", "Taxă loc preferențial", {
        help: "20% din costul pavilionului, se adaugă pe factură.",
      }),

      field("section", "Partener cultural"),
      field("checkboxGroup", "Pachet partener", {
        options: [
          {
            label: "Servicii promovare extra + 1 pavilion expozițional",
            price: 9900,
          },
        ],
      }),

      field("section", "Opțiuni suplimentare"),
      field("checkboxGroup", "Dotări", {
        options: [
          { label: "Masă + 4 scaune", price: 250 },
          { label: "Promovare online", price: 600 },
        ],
      }),

      field("section", "Utilități"),
      field("checkbox", "Am nevoie de energie electrică", {
        help: "Costul energiei se facturează separat, în funcție de consum.",
      }),
      field("text", "Consum estimat", { width: "half" }),
      field("text", "Tip consum", {
        width: "half",
        placeholder: "monofazic / trifazic",
      }),

      field("info", "Condiții financiare", {
        help: "Plata se face 100% până la data de 14.08.2026.",
      }),

      field("section", "Semnătură"),
      field("text", "Nume și prenume", {
        required: true,
        width: "half",
        help: "Persoana care semnează cererea.",
      }),
      field("date", "Data", { required: true, width: "half" }),
      field("checkbox", "Am citit și accept condițiile financiare", {
        required: true,
      }),
    ],
    submitLabel: "Trimite cererea",
    successMessage:
      "Am primit cererea ta de înscriere. Revenim cu confirmarea pe email.",
    showOrganization: true,
    status: "draft",
    notifyEmail: "",
  };
}

export interface FormTemplate {
  key: string;
  name: string;
  description: string;
  build: () => FormPatch;
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    key: "exhibitor",
    name: "Cerere de înscriere expozant",
    description:
      "Date firmă, alegerea pavilionului cu prețuri, opțiuni suplimentare, utilități și semnătură.",
    build: exhibitorApplication,
  },
  {
    key: "blank",
    name: "Formular gol",
    description: "Pornești de la zero și adaugi tu câmpurile.",
    build: blankForm,
  },
];
