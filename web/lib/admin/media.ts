"use client";

/**
 * Media library API client. Talks to the FastAPI backend media endpoints
 * (JWT auth). Like `lib/admin/api.ts`, every function catches/logs its own
 * errors and resolves — it never throws — so callers stay simple.
 */

import { getToken } from "@/lib/admin/api";

const API =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000") + "/api/v1";

const ADMIN_MEDIA = `${API}/tenants/prispa/admin/media`;

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
  try {
    const res = await fetch(ADMIN_MEDIA, {
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
  try {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(ADMIN_MEDIA, {
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

/** Delete a media asset by id. Returns true on success (204). */
export async function deleteMedia(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${ADMIN_MEDIA}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    });
    return res.ok;
  } catch (err) {
    console.error("deleteMedia failed", err);
    return false;
  }
}
