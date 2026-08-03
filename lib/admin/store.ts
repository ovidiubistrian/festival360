"use client";

import * as React from "react";
import { prispaTenant } from "@/lib/tenants/prispa";
import type {
  Article,
  ContactMessage,
  Destination,
  Exhibitor,
  GalleryImage,
  NewsletterSubscriber,
  Partner,
  ProgramEvent,
  Product,
  SectionConfig,
} from "@/lib/tenants/types";

/**
 * Demo-only client store. Collections are seeded from the tenant mock content
 * and persisted to localStorage so the admin FEELS functional across reloads.
 * This is NOT a real backend — there is no server, auth, or database.
 */

export interface AdminSettings {
  name: string;
  tagline: string;
  shortDescription: string;
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
  destinations: Destination[];
  program: ProgramEvent[];
  partners: Partner[];
  gallery: GalleryImage[];
  articles: Article[];
  contactMessages: ContactMessage[];
  newsletter: NewsletterSubscriber[];
  sections: SectionConfig[];
  settings: AdminSettings;
}

const STORAGE_KEY = "festival-hub:prispa:admin";
const AUTH_KEY = "festival-hub:prispa:auth";

function seed(): AdminData {
  const c = prispaTenant.content;
  const info = prispaTenant.config.info;
  const social = prispaTenant.config.social;
  const contact = prispaTenant.config.contact;
  const theme = prispaTenant.config.theme;
  return {
    exhibitors: structuredClone(c.exhibitors),
    products: structuredClone(c.products),
    destinations: structuredClone(c.destinations),
    program: structuredClone(c.program),
    partners: structuredClone(c.partners),
    gallery: structuredClone(c.gallery),
    articles: structuredClone(c.articles),
    contactMessages: structuredClone(c.contactMessages),
    newsletter: structuredClone(c.newsletter),
    sections: structuredClone(prispaTenant.config.sections),
    settings: {
      name: info.name,
      tagline: info.tagline,
      shortDescription: info.shortDescription,
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
  };
}

// --- module-level reactive store ---------------------------------------------
let memory: AdminData | null = null;
const listeners = new Set<() => void>();

function load(): AdminData {
  if (memory) return memory;
  if (typeof window === "undefined") {
    memory = seed();
    return memory;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AdminData>;
      // Merge with seed to tolerate schema additions.
      memory = { ...seed(), ...parsed } as AdminData;
    } else {
      memory = seed();
    }
  } catch {
    memory = seed();
  }
  return memory;
}

function persist() {
  if (typeof window !== "undefined" && memory) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }
  listeners.forEach((l) => l());
}

export function setData(mutator: (draft: AdminData) => void) {
  const data = load();
  mutator(data);
  memory = { ...data };
  persist();
}

export function resetDemoData() {
  memory = seed();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  persist();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverSnapshot = seed();

export function useAdminData(): AdminData {
  return React.useSyncExternalStore(
    subscribe,
    () => load(),
    () => serverSnapshot
  );
}

// --- Generic collection helpers ---------------------------------------------
export type CollectionKey =
  | "exhibitors"
  | "products"
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
  setData((draft) => {
    const list = draft[key] as WithId[];
    const idx = list.findIndex((x) => x.id === (item as WithId).id);
    if (idx >= 0) list[idx] = item as WithId;
    else list.unshift(item as WithId);
  });
}

export function deleteItem(key: CollectionKey, id: string) {
  setData((draft) => {
    const list = draft[key] as WithId[];
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) list.splice(idx, 1);
  });
}

export function toggleStatus(
  key: Exclude<CollectionKey, "program" | "gallery">,
  id: string
) {
  setData((draft) => {
    const list = draft[key] as Array<WithId & { status: string }>;
    const item = list.find((x) => x.id === id);
    if (item) {
      item.status = item.status === "published" ? "draft" : "published";
    }
  });
}

export function moveItem(key: CollectionKey, id: string, dir: -1 | 1) {
  setData((draft) => {
    const list = draft[key] as WithId[];
    const idx = list.findIndex((x) => x.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= list.length) return;
    [list[idx], list[next]] = [list[next], list[idx]];
  });
}

export function updateSettings(patch: Partial<AdminSettings>) {
  setData((draft) => {
    draft.settings = { ...draft.settings, ...patch };
  });
}

export function toggleSection(id: string) {
  setData((draft) => {
    const s = draft.sections.find((x) => x.id === id);
    if (s) s.visible = !s.visible;
  });
}

export function moveSection(id: string, dir: -1 | 1) {
  setData((draft) => {
    const idx = draft.sections.findIndex((x) => x.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= draft.sections.length) return;
    [draft.sections[idx], draft.sections[next]] = [
      draft.sections[next],
      draft.sections[idx],
    ];
  });
}

export function markMessageRead(id: string, read: boolean) {
  setData((draft) => {
    const m = draft.contactMessages.find((x) => x.id === id);
    if (m) m.read = read;
  });
}

export function deleteMessage(id: string) {
  setData((draft) => {
    draft.contactMessages = draft.contactMessages.filter((x) => x.id !== id);
  });
}

export function addSubscriber(email: string, source = "Admin") {
  setData((draft) => {
    if (draft.newsletter.some((s) => s.email === email)) return;
    draft.newsletter.unshift({
      id: `ns-${Date.now()}`,
      email,
      date: new Date().toISOString().slice(0, 10),
      source,
    });
  });
}

export function deleteSubscriber(id: string) {
  setData((draft) => {
    draft.newsletter = draft.newsletter.filter((x) => x.id !== id);
  });
}

// --- Demo auth (NOT real security) ------------------------------------------
export const DEMO_CREDENTIALS = {
  email: "admin@prispa.demo",
  password: "demo1234",
};

export function loginDemo() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_KEY, "1");
  }
}

export function logoutDemo() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_KEY);
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_KEY) === "1";
}

/** Create a fresh id for new items. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}
