import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date range in Romanian, e.g. "12 – 14 septembrie 2025". */
export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const monthFmt = new Intl.DateTimeFormat("ro-RO", { month: "long" });
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${start.getDate()} – ${end.getDate()} ${monthFmt.format(end)} ${end.getFullYear()}`;
  }
  const fmt = new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/** Format a single ISO date in Romanian, e.g. "3 august 2026". */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/** Format a compact number, e.g. 30000 -> "30.000". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ro-RO").format(value);
}

/**
 * True when a menu href points outside the site (custom links added from the
 * admin). Those are rendered as plain `<a>` and left out of the sitemap, while
 * internal ones get prefixed with the tenant base path.
 */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);
}

/** Deterministic slugify for Romanian text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
