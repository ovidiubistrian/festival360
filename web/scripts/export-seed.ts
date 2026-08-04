/**
 * Exports the PRISPA mock tenant into a DB-shaped JSON file that the FastAPI
 * seed script consumes. This keeps the demo content defined once (in TS) as the
 * single source of truth for bootstrapping the database.
 *
 * Run:  npx tsx scripts/export-seed.ts
 * Output: ../api/app/db/seed_data.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prispaTenant } from "../lib/tenants/prispa";

const TENANT_ID = "prispa";
const { config, content } = prispaTenant;

const tenant = {
  id: TENANT_ID,
  slug: config.info.slug,
  name: config.info.name,
  tagline: config.info.tagline,
  short_description: config.info.shortDescription,
  long_description: config.info.longDescription,
  start_date: config.info.startDate,
  end_date: config.info.endDate,
  location_name: config.info.locationName,
  city: config.info.city,
  county: config.info.county,
  hero_image: config.info.heroImage,
  hero_badge: config.info.heroBadge,
  logo_text: config.info.logoText,
  theme_primary: config.theme.primary,
  theme_secondary: config.theme.secondary,
  theme_terracotta: config.theme.terracotta,
  theme_gold: config.theme.gold,
  theme_charcoal: config.theme.charcoal,
  theme_background: config.theme.background,
  social_facebook: config.social.facebook ?? "",
  social_instagram: config.social.instagram ?? "",
  social_youtube: config.social.youtube ?? "",
  social_website: config.social.website ?? "",
  contact_email: config.contact.email,
  contact_phone: config.contact.phone,
  contact_address: config.contact.address,
  contact_city: config.contact.city,
  contact_county: config.contact.county,
  contact_map_query: config.contact.mapEmbedQuery,
  navigation: config.navigation,
  sections: config.sections,
  stats: config.stats,
  experiences: config.experiences,
};

const withTenant = <T extends object>(rows: T[]) =>
  rows.map((r, i) => ({ ...r, tenant_id: TENANT_ID, sort_order: i }));

const exhibitors = content.exhibitors.map((e, i) => ({
  id: e.id,
  tenant_id: TENANT_ID,
  slug: e.slug,
  name: e.name,
  category: e.category,
  town: e.town,
  county: e.county,
  region: e.region,
  short_description: e.shortDescription,
  description: e.description,
  image: e.image,
  gallery: e.gallery,
  certified: e.certified,
  featured: e.featured,
  product_ids: e.productIds,
  contact_phone: e.contact?.phone ?? "",
  contact_website: e.contact?.website ?? "",
  status: e.status,
  sort_order: i,
}));

const products = content.products.map((p, i) => ({
  id: p.id,
  tenant_id: TENANT_ID,
  slug: p.slug,
  name: p.name,
  producer: p.producer,
  exhibitor_id: p.exhibitorId,
  region: p.region,
  category: p.category,
  short_description: p.shortDescription,
  story: p.story,
  image: p.image,
  gallery: p.gallery,
  price: p.price ?? null,
  featured: p.featured,
  status: p.status,
  sort_order: i,
}));

const destinations = content.destinations.map((d, i) => ({
  id: d.id,
  tenant_id: TENANT_ID,
  slug: d.slug,
  name: d.name,
  region: d.region,
  county: d.county,
  short_description: d.shortDescription,
  description: d.description,
  cover_image: d.coverImage,
  gallery: d.gallery,
  attractions: d.attractions,
  experiences: d.experiences,
  gastronomy: d.gastronomy,
  external_link: d.externalLink ?? null,
  featured: d.featured,
  editorial: d.editorial,
  status: d.status,
  sort_order: i,
}));

const program = content.program.map((e, i) => ({
  id: e.id,
  tenant_id: TENANT_ID,
  day: e.day,
  date: e.date,
  start_time: e.startTime,
  end_time: e.endTime,
  title: e.title,
  description: e.description,
  stage: e.stage,
  category: e.category,
  featured: e.featured,
  sort_order: i,
}));

const partners = content.partners.map((p) => ({
  id: p.id,
  tenant_id: TENANT_ID,
  slug: p.slug,
  name: p.name,
  tier: p.tier,
  logo: p.logo,
  description: p.description,
  website: p.website,
  featured_on_home: p.featuredOnHome,
  sort_order: p.order,
  status: p.status,
}));

const gallery = content.gallery.map((g, i) => ({
  id: g.id,
  tenant_id: TENANT_ID,
  src: g.src,
  alt: g.alt,
  category: g.category,
  span: g.span,
  sort_order: i,
}));

const articles = content.articles.map((a, i) => ({
  id: a.id,
  tenant_id: TENANT_ID,
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  body: a.body,
  category: a.category,
  author: a.author,
  date: a.date,
  reading_minutes: a.readingMinutes,
  cover_image: a.coverImage,
  featured: a.featured,
  status: a.status,
  sort_order: i,
}));

const contact_messages = content.contactMessages.map((m) => ({
  id: m.id,
  tenant_id: TENANT_ID,
  name: m.name,
  email: m.email,
  subject: m.subject,
  message: m.message,
  date: m.date,
  read: m.read,
}));

const newsletter = content.newsletter.map((n) => ({
  id: n.id,
  tenant_id: TENANT_ID,
  email: n.email,
  date: n.date,
  source: n.source,
}));

const payload = {
  tenant,
  exhibitors,
  products,
  destinations,
  program,
  partners,
  gallery,
  articles,
  contact_messages,
  newsletter,
};

// Silence unused helper warning if not used elsewhere.
void withTenant;

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../../api/app/db/seed_data.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
console.log(`Seed data written to ${outPath}`);
console.log(
  `tenant=1 exhibitors=${exhibitors.length} products=${products.length} ` +
    `destinations=${destinations.length} program=${program.length} ` +
    `partners=${partners.length} gallery=${gallery.length} articles=${articles.length}`
);
