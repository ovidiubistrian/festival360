import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/demo-admin",
    },
    sitemap: "https://festival360.vercel.app/sitemap.xml",
  };
}
