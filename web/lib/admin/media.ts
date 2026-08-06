"use client";

/**
 * Media library API client. Talks to the FastAPI backend media endpoints
 * (JWT auth). Like `lib/admin/api.ts`, every function catches/logs its own
 * errors and resolves — it never throws — so callers stay simple.
 */

import { getToken } from "@/lib/admin/api";
import { getCurrentTenant } from "@/lib/admin/session";
import { apiBaseUrl } from "@/lib/api-base";

const API = `${apiBaseUrl()}/api/v1`;

/**
 * Media endpoint for the currently-selected tenant, built per call so it
 * follows the tenant switcher. Returns null when no tenant is selected yet.
 */
function mediaBase(): string | null {
  const slug = getCurrentTenant();
  if (!slug) return null;
  return `${API}/tenants/${slug}/admin/media`;
}

export type MediaAsset = {
  id: string;
  url: string;
  alt: string;
  filename: string;
  contentType: string;
  size: number;
  isStock: boolean;
};

/** List every media asset in the library (stock + uploaded). */
export async function listMedia(): Promise<MediaAsset[]> {
  const base = mediaBase();
  if (!base) return [];
  try {
    const res = await fetch(base, {
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as MediaAsset[];
  } catch (err) {
    console.error("listMedia failed", err);
    return [];
  }
}

/**
 * Upload a single image file (multipart/form-data, field name `file`).
 * IMPORTANT: never set Content-Type by hand — the browser adds the multipart
 * boundary. Only the Authorization header is sent.
 */
export async function uploadMedia(file: File): Promise<MediaAsset | null> {
  const base = mediaBase();
  if (!base) return null;
  try {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(base, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      body,
    });
    if (!res.ok) return null;
    return (await res.json()) as MediaAsset;
  } catch (err) {
    console.error("uploadMedia failed", err);
    return null;
  }
}

/**
 * Upload a single GPX track file (multipart/form-data, field name `file`).
 * Returns the stored `/media/xxx.gpx` URL, or null on failure. Like
 * `uploadMedia`, never set Content-Type by hand — the browser adds the
 * multipart boundary; only the Authorization header is sent.
 */
export async function uploadGpx(file: File): Promise<string | null> {
  const base = mediaBase();
  if (!base) return null;
  try {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${base}/gpx`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      body,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data?.url ?? null;
  } catch (err) {
    console.error("uploadGpx failed", err);
    return null;
  }
}

/** Delete a media asset by id. Returns true on success (204). */
export async function deleteMedia(id: string): Promise<boolean> {
  const base = mediaBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    });
    return res.ok;
  } catch (err) {
    console.error("deleteMedia failed", err);
    return false;
  }
}
