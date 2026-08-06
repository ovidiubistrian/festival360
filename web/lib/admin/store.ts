"use client";

import * as React from "react";
import { prispaTenant } from "@/lib/tenants/prispa";
import type {
  Accommodation,
  Article,
  ContactMessage,
  Destination,
  Experience,
  Exhibitor,
  GalleryImage,
  NewsletterSubscriber,
  Partner,
  ProgramEvent,
  Product,
  SectionConfig,
  Stat,
  Tenant,
} from "@/lib/tenants/types";
import {
  apiAddSubscriber,
  apiCreate,
  apiDelete,
  apiDeleteMessage,
  apiDeleteSubscriber,
  apiLogin,
  apiMove,
  apiReset,
  apiSetMessageRead,
  apiToggleStatus,
  apiUpdate,
  apiUpdateSections,
  apiUpdateSettings,
  fetchBundle,
} from "@/lib/admin/api";
import {
  clearSession,
  getCurrentTenant,
  getToken,
  setSession,
  type SessionUser,
} from "@/lib/admin/session";

/**
 * Admin store. The public export surface is unchanged, but auth and every
 * mutation now hit the real FastAPI backend and persist to Postgres.
 *
 * Reads stay instant thanks to a local mock seed used as the initial/fallback
 * value; each mutation applies an optimistic local update, fires the matching
 * API call, then reconciles with server truth via `refresh()`.
 */

export interface AdminSettings {
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  heroBadge: string;
  startDate: string;
  endDate: string;
  locationName: string;
  city: string;
  county: string;
  email: string;
  phone: string;
  facebook: string;
  instagram: string;
  youtube: string;
  primaryColor: string;
  secondaryColor: string;
  goldColor: string;
  heroImage: string;
  logoText: string;
}

export interface AdminData {
  exhibitors: Exhibitor[];
  products: Product[];
  accommodations: Accommodation[];
  destinations: Destination[];
  program: ProgramEvent[];
  partners: Partner[];
  gallery: GalleryImage[];
  articles: Article[];
  contactMessages: ContactMessage[];
  newsletter: NewsletterSubscriber[];
  sections: SectionConfig[];
  /** Homepage "Despre" stats (about-section). */
  stats: Stat[];
  /** Homepage "Zone și experiențe" grid. */
  experiences: Experience[];
  settings: AdminSettings;
  /** Vertical preset key (festival | resort | museum | …). */
  eventType?: string;
  /** Ordered content-module keys for the vertical-aware admin nav. */
  modules?: string[];
  /** Per-tenant label overrides (terminology system). */
  labels?: Record<string, string>;
}

function seed(): AdminData {
  const c = prispaTenant.content;
  const info = prispaTenant.config.info;
  const social = prispaTenant.config.social;
  const contact = prispaTenant.config.contact;
  const theme = prispaTenant.config.theme;
  return {
    exhibitors: structuredClone(c.exhibitors),
    products: structuredClone(c.products),
    accommodations: structuredClone(c.accommodations),
    destinations: structuredClone(c.destinations),
    program: structuredClone(c.program),
    partners: structuredClone(c.partners),
    gallery: structuredClone(c.gallery),
    articles: structuredClone(c.articles),
    contactMessages: structuredClone(c.contactMessages),
    newsletter: structuredClone(c.newsletter),
    sections: structuredClone(prispaTenant.config.sections),
    stats: structuredClone(prispaTenant.config.stats),
    experiences: structuredClone(prispaTenant.config.experiences),
    settings: {
      name: info.name,
      tagline: info.tagline,
      shortDescription: info.shortDescription,
      longDescription: info.longDescription,
      heroBadge: info.heroBadge,
      startDate: info.startDate,
      endDate: info.endDate,
      locationName: info.locationName,
      city: info.city,
      county: info.county,
      email: contact.email,
      phone: contact.phone,
      facebook: social.facebook ?? "",
      instagram: social.instagram ?? "",
      youtube: social.youtube ?? "",
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      goldColor: theme.gold,
      heroImage: info.heroImage,
      logoText: info.logoText,
    },
    eventType: prispaTenant.config.eventType,
    modules: prispaTenant.config.modules,
    labels: prispaTenant.config.labels,
  };
}

/** Map the tenant bundle (camelCase, from the API) to AdminData. */
function bundleToAdminData(bundle: Tenant): AdminData {
  const config = bundle.config;
  const content = bundle.content;
  const info = config.info;
  return {
    exhibitors: content.exhibitors ?? [],
    products: content.products ?? [],
    accommodations: content.accommodations ?? [],
    destinations: content.destinations ?? [],
    program: content.program ?? [],
    partners: content.partners ?? [],
    gallery: content.gallery ?? [],
    articles: content.articles ?? [],
    contactMessages: content.contactMessages ?? [],
    newsletter: content.newsletter ?? [],
    sections: config.sections ?? [],
    stats: config.stats ?? [],
    experiences: config.experiences ?? [],
    settings: {
      name: info.name,
      tagline: info.tagline,
      shortDescription: info.shortDescription,
      longDescription: info.longDescription,
      heroBadge: info.heroBadge,
      startDate: info.startDate,
      endDate: info.endDate,
      locationName: info.locationName,
      city: info.city,
      county: info.county,
      email: config.contact.email,
      phone: config.contact.phone,
      facebook: config.social.facebook || "",
      instagram: config.social.instagram || "",
      youtube: config.social.youtube || "",
      primaryColor: config.theme.primary,
      secondaryColor: config.theme.secondary,
      goldColor: config.theme.gold,
      heroImage: info.heroImage,
      logoText: info.logoText,
    },
    eventType: config.eventType,
    modules: config.modules,
    labels: config.labels,
  };
}

/** An empty AdminData shell — used when no tenant is selected yet. */
function emptyData(): AdminData {
  return {
    exhibitors: [],
    products: [],
    accommodations: [],
    destinations: [],
    program: [],
    partners: [],
    gallery: [],
    articles: [],
    contactMessages: [],
    newsletter: [],
    sections: [],
    stats: [],
    experiences: [],
    settings: {
      name: "",
      tagline: "",
      shortDescription: "",
      longDescription: "",
      heroBadge: "",
      startDate: "",
      endDate: "",
      locationName: "",
      city: "",
      county: "",
      email: "",
      phone: "",
      facebook: "",
      instagram: "",
      youtube: "",
      primaryColor: "",
      secondaryColor: "",
      goldColor: "",
      heroImage: "",
      logoText: "",
    },
  };
}

// --- module-level reactive store ---------------------------------------------
let memory: AdminData = seed();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Apply an optimistic in-place mutation to `memory` and notify subscribers. */
function apply(mutator: (draft: AdminData) => void) {
  mutator(memory);
  // New top-level reference so useSyncExternalStore detects the change.
  memory = { ...memory };
  notify();
}

/** Fetch the server bundle and replace `memory` with server truth. */
export async function refresh() {
  // No tenant selected yet (super-admin pre-selection) — show a clean shell
  // instead of hitting `/tenants/null/...`.
  if (!getCurrentTenant()) {
    memory = emptyData();
    notify();
    return;
  }
  const bundle = await fetchBundle();
  if (bundle) {
    memory = bundleToAdminData(bundle as Tenant);
    notify();
  }
}

/** Fire an admin API call, then reconcile local state with the server. */
async function sync(call: () => Promise<unknown>) {
  try {
    const result = await call();
    if (result === false || result === null) {
      console.error("Admin API mutation failed");
    }
  } catch (err) {
    console.error("Admin API mutation threw", err);
  }
  await refresh();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverSnapshot = seed();

export function useAdminData(): AdminData {
  return React.useSyncExternalStore(
    subscribe,
    () => memory,
    () => serverSnapshot
  );
}

// --- Generic collection helpers ---------------------------------------------
export type CollectionKey =
  | "exhibitors"
  | "products"
  | "accommodations"
  | "destinations"
  | "program"
  | "partners"
  | "gallery"
  | "articles";

type WithId = { id: string };

export function upsertItem<K extends CollectionKey>(
  key: K,
  item: AdminData[K][number]
) {
  const list = memory[key] as WithId[];
  const exists = list.some((x) => x.id === (item as WithId).id);
  apply((draft) => {
    const l = draft[key] as WithId[];
    const idx = l.findIndex((x) => x.id === (item as WithId).id);
    if (idx >= 0) l[idx] = item as WithId;
    else l.unshift(item as WithId);
  });
  void sync(() =>
    exists
      ? apiUpdate(key, (item as WithId).id, item)
      : apiCreate(key, item)
  );
}

export function deleteItem(key: CollectionKey, id: string) {
  apply((draft) => {
    const list = draft[key] as WithId[];
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) list.splice(idx, 1);
  });
  void sync(() => apiDelete(key, id));
}

export function toggleStatus(
  key: Exclude<CollectionKey, "program" | "gallery">,
  id: string
) {
  apply((draft) => {
    const list = draft[key] as Array<WithId & { status: string }>;
    const item = list.find((x) => x.id === id);
    if (item) {
      item.status = item.status === "published" ? "draft" : "published";
    }
  });
  void sync(() => apiToggleStatus(key, id));
}

export function moveItem(key: CollectionKey, id: string, dir: -1 | 1) {
  apply((draft) => {
    const list = draft[key] as WithId[];
    const idx = list.findIndex((x) => x.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= list.length) return;
    [list[idx], list[next]] = [list[next], list[idx]];
  });
  void sync(() => apiMove(key, id, dir));
}

export function updateSettings(patch: Partial<AdminSettings>) {
  apply((draft) => {
    draft.settings = { ...draft.settings, ...patch };
  });
  void sync(() => apiUpdateSettings(patch));
}

export function toggleSection(id: string) {
  apply((draft) => {
    const s = draft.sections.find((x) => x.id === id);
    if (s) s.visible = !s.visible;
  });
  void sync(() => apiUpdateSections(memory.sections));
}

export function moveSection(id: string, dir: -1 | 1) {
  apply((draft) => {
    const idx = draft.sections.findIndex((x) => x.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= draft.sections.length) return;
    [draft.sections[idx], draft.sections[next]] = [
      draft.sections[next],
      draft.sections[idx],
    ];
  });
  void sync(() => apiUpdateSections(memory.sections));
}

export function markMessageRead(id: string, read: boolean) {
  apply((draft) => {
    const m = draft.contactMessages.find((x) => x.id === id);
    if (m) m.read = read;
  });
  void sync(() => apiSetMessageRead(id, read));
}

export function deleteMessage(id: string) {
  apply((draft) => {
    draft.contactMessages = draft.contactMessages.filter((x) => x.id !== id);
  });
  void sync(() => apiDeleteMessage(id));
}

export function addSubscriber(email: string, source = "Admin") {
  apply((draft) => {
    if (draft.newsletter.some((s) => s.email === email)) return;
    draft.newsletter.unshift({
      id: `ns-${Date.now()}`,
      email,
      date: new Date().toISOString().slice(0, 10),
      source,
    });
  });
  void sync(() => apiAddSubscriber(email, source || "Admin"));
}

export function deleteSubscriber(id: string) {
  apply((draft) => {
    draft.newsletter = draft.newsletter.filter((x) => x.id !== id);
  });
  void sync(() => apiDeleteSubscriber(id));
}

export function resetDemoData() {
  void (async () => {
    await apiReset().catch((err) =>
      console.error("apiReset threw", err)
    );
    await refresh();
  })();
}

// --- Auth (real: JWT via FastAPI) -------------------------------------------
export const DEMO_CREDENTIALS = {
  email: "admin@prispa.demo",
  password: "demo1234",
};

/**
 * Authenticate, open a session and load the current tenant's data. Returns the
 * resolved `SessionUser` (with role + tenant) so the login page can route by
 * role — or null on failure.
 *
 * For a tenant-admin the session fixes the tenant (`user.tenantId`); for a
 * super-admin with no tenant chosen yet, the current tenant stays null until
 * the shell sets a default.
 */
export async function login(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const result = await apiLogin(email, password);
  if (!result) return null;
  setSession(result.token, result.user);
  await refresh();
  return result.user;
}

export function loginDemo(): Promise<SessionUser | null> {
  return login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
}

/** Clear the session and reset the store to a clean shell. */
export function logout() {
  clearSession();
  memory = emptyData();
  notify();
}

/** Back-compat alias — same behaviour as `logout()`. */
export function logoutDemo() {
  logout();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/** Create a fresh id for new items (optimistic temp id; API assigns the real one). */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}
