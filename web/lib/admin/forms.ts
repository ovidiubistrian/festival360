"use client";

/**
 * Forms admin API client — definițiile de formular și cererile primite.
 *
 * Formularele NU trec prin `lib/admin/store.ts` (care ține bundle-ul public al
 * tenantului): ciornele și cererile primite nu au ce căuta în datele publice,
 * deci paginile de admin le încarcă direct de aici, ca în `lib/admin/marketing.ts`.
 * Fiecare funcție își prinde erorile și rezolvă cu un rezultat tipat.
 */

import { authHeaders } from "@/lib/admin/api";
import { getCurrentTenant } from "@/lib/admin/session";
import { apiBaseUrl } from "@/lib/api-base";
import type { FormDefinition, FormSubmission } from "@/lib/tenants/types";

const API = `${apiBaseUrl()}/api/v1`;

/** Base URL for the current tenant's forms admin API, or null. */
function formsBase(): string | null {
  const slug = getCurrentTenant();
  if (!slug) return null;
  return `${API}/tenants/${slug}/admin/forms`;
}

/** Câmpurile trimise la salvare (id-ul e în URL, contoarele sunt read-only). */
export type FormPatch = Omit<
  FormDefinition,
  "id" | "submissionCount" | "unreadCount"
>;

export interface SaveFormResult {
  form: FormDefinition | null;
  /** Mesaj de la server (ex. slug duplicat), de arătat utilizatorului. */
  error?: string;
}

/** Toate formularele tenantului (inclusiv ciornele), în ordinea din admin. */
export async function listForms(): Promise<FormDefinition[]> {
  const base = formsBase();
  if (!base) return [];
  try {
    const res = await fetch(base, { headers: authHeaders() });
    if (!res.ok) return [];
    return (await res.json()) as FormDefinition[];
  } catch (err) {
    console.error("listForms failed", err);
    return [];
  }
}

/** Creează (fără `id`) sau actualizează (cu `id`) un formular. */
export async function saveForm(
  patch: FormPatch,
  id?: string
): Promise<SaveFormResult> {
  const base = formsBase();
  if (!base) return { form: null, error: "Niciun site selectat." };
  try {
    const res = await fetch(id ? `${base}/${id}` : base, {
      method: id ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const detail = await res
        .json()
        .then((d: { detail?: string }) => d?.detail)
        .catch(() => undefined);
      return { form: null, error: detail };
    }
    return { form: (await res.json()) as FormDefinition };
  } catch (err) {
    console.error("saveForm failed", err);
    return { form: null };
  }
}

export async function deleteForm(id: string): Promise<boolean> {
  const base = formsBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("deleteForm failed", err);
    return false;
  }
}

/** Comută publicat ↔ ciornă. */
export async function toggleFormStatus(id: string): Promise<boolean> {
  const base = formsBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/${id}/toggle-status`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("toggleFormStatus failed", err);
    return false;
  }
}

export async function moveForm(id: string, direction: -1 | 1): Promise<boolean> {
  const base = formsBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/${id}/move`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ direction }),
    });
    return res.ok;
  } catch (err) {
    console.error("moveForm failed", err);
    return false;
  }
}

/** Cererile primite pe un formular, cele mai noi primele. */
export async function listSubmissions(
  formId: string
): Promise<FormSubmission[]> {
  const base = formsBase();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/${formId}/submissions`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return (await res.json()) as FormSubmission[];
  } catch (err) {
    console.error("listSubmissions failed", err);
    return [];
  }
}

export async function setSubmissionRead(
  formId: string,
  submissionId: string,
  read: boolean
): Promise<boolean> {
  const base = formsBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/${formId}/submissions/${submissionId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ read }),
    });
    return res.ok;
  } catch (err) {
    console.error("setSubmissionRead failed", err);
    return false;
  }
}

export async function deleteSubmission(
  formId: string,
  submissionId: string
): Promise<boolean> {
  const base = formsBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/${formId}/submissions/${submissionId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("deleteSubmission failed", err);
    return false;
  }
}
