import type { MetadataRoute } from "next";
import { tenants } from "@/lib/tenants";

const BASE = "https://festival360.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "monthly", priority: 1 },
  ];

  for (const t of Object.values(tenants)) {
    const root = `${BASE}/${t.slug}`;
    entries.push({ url: root, changeFrequency: "weekly", priority: 0.9 });

    for (const item of t.config.navigation) {
      entries.push({ url: `${root}${item.href}`, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const e of t.content.exhibitors) {
      entries.push({ url: `${root}/expozanti/${e.slug}`, priority: 0.6 });
    }
    for (const p of t.content.products) {
      entries.push({ url: `${root}/produse/${p.slug}`, priority: 0.6 });
    }
    for (const d of t.content.destinations) {
      entries.push({ url: `${root}/destinatii/${d.slug}`, priority: 0.6 });
    }
    for (const a of t.content.articles) {
      entries.push({ url: `${root}/noutati/${a.slug}`, priority: 0.5 });
    }
  }

  return entries;
}
