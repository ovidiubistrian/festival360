/**
 * Core multi-tenant data model for Festival Hub.
 *
 * Every festival (tenant) is described by a `TenantConfig` plus a set of
 * content collections. The shapes below are intentionally close to what a
 * relational schema (Supabase / PostgreSQL) would look like, so the UI can be
 * wired to a real backend later without changing component contracts.
 */

export type PublishStatus = "published" | "draft" | "archived";

export interface TenantTheme {
  /** verde închis */
  primary: string;
  /** crem cald */
  secondary: string;
  /** teracotă */
  terracotta: string;
  /** auriu discret */
  gold: string;
  /** cărbune */
  charcoal: string;
  /** alb cald */
  background: string;
}

export interface NavItem {
  label: string;
  /** Path relative to the tenant root, e.g. "/program". */
  href: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  county: string;
  mapEmbedQuery: string;
}

export interface FestivalInfo {
  name: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  /** ISO date */
  startDate: string;
  /** ISO date */
  endDate: string;
  locationName: string;
  city: string;
  county: string;
  heroImage: string;
  heroBadge: string;
  logoText: string;
}

export interface Stat {
  label: string;
  value: string;
  icon: string;
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string;
}

/** Section visibility + ordering, editable from the demo admin. */
export interface SectionConfig {
  id: string;
  label: string;
  visible: boolean;
}

/** Per-tenant display copy overriding festival defaults (terminology system). */
export type TenantLabels = Record<string, string>;

export interface TenantConfig {
  /** "festival" | "resort" | ... — the vertical preset. */
  eventType?: string;
  /** Optional label overrides; the UI falls back to festival copy. */
  labels?: TenantLabels;
  /**
   * Ordered content-module keys this vertical exposes in the admin panel
   * (e.g. "dashboard", "accommodations", "analytics"). Drives the vertical-aware
   * admin navigation. When absent, the admin falls back to the full module list.
   */
  modules?: string[];
  info: FestivalInfo;
  theme: TenantTheme;
  navigation: NavItem[];
  social: SocialLinks;
  contact: ContactInfo;
  sections: SectionConfig[];
  stats: Stat[];
  experiences: Experience[];
}

export type ExhibitorCategory =
  | "Brânzeturi"
  | "Panificație"
  | "Miere & Apicultură"
  | "Ceramică & Meșteșuguri"
  | "Dulcețuri & Siropuri"
  | "Vinuri & Băuturi"
  | "Turism & Ospitalitate"
  | "Carne & Afumături";

export interface Exhibitor {
  id: string;
  slug: string;
  name: string;
  category: ExhibitorCategory;
  town: string;
  county: string;
  region: string;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  certified: boolean;
  featured: boolean;
  productIds: string[];
  status: PublishStatus;
  contact?: {
    phone?: string;
    website?: string;
  };
}

export type ProductCategory =
  | "Lactate"
  | "Panificație"
  | "Miere"
  | "Dulcețuri"
  | "Siropuri"
  | "Ceramică"
  | "Băuturi"
  | "Afumături";

export interface Product {
  id: string;
  slug: string;
  name: string;
  producer: string;
  exhibitorId: string;
  region: string;
  category: ProductCategory;
  shortDescription: string;
  story: string;
  image: string;
  gallery: string[];
  price?: string;
  featured: boolean;
  /** "all" | "winter" | "summer" — seasonal filtering for resorts. */
  season?: string;
  status: PublishStatus;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  county: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: string[];
  attractions: string[];
  experiences: string[];
  gastronomy: string[];
  externalLink?: string;
  featured: boolean;
  editorial: boolean;
  status: PublishStatus;
}

export type AccommodationType =
  | "hotel"
  | "pensiune"
  | "cabana"
  | "apartament"
  | "camping"
  | "vila"
  | "other";

export interface Accommodation {
  id: string;
  slug: string;
  name: string;
  /** hotel | pensiune | cabana | apartament | camping | vila | other. */
  type: string;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  /** Free-text starting price, e.g. "de la 250 RON/noapte". */
  priceFrom: string;
  /** Max persons; 0 = unspecified. */
  capacity: number;
  rooms: number;
  /** Facility keys, e.g. ["wifi", "parcare", "mic-dejun", "piscina"]. */
  amenities: string[];
  address: string;
  contactPhone: string;
  contactWebsite: string;
  bookingUrl: string;
  featured: boolean;
  status: PublishStatus;
  sortOrder: number;
}

export type ProgramCategory =
  | "Gastronomie"
  | "Muzică"
  | "Atelier"
  | "Meșteșuguri"
  | "Turism"
  | "Copii"
  | "Conferință";

export interface ProgramEvent {
  id: string;
  day: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  stage: string;
  category: ProgramCategory;
  featured: boolean;
}

export type PartnerTier =
  | "Organizator"
  | "Partener instituțional"
  | "Partener principal"
  | "Sponsor"
  | "Partener media"
  | "Partener local";

export interface Partner {
  id: string;
  slug: string;
  name: string;
  tier: PartnerTier;
  logo: string;
  description: string;
  website: string;
  featuredOnHome: boolean;
  order: number;
  status: PublishStatus;
}

export type GalleryCategory =
  | "Gastronomie"
  | "Tradiții"
  | "Concerte"
  | "Produse"
  | "Turism"
  | "Ateliere";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: GalleryCategory;
  /** Layout hint for masonry: taller cards for hero shots. */
  span: "tall" | "wide" | "normal";
}

export type ArticleCategory =
  | "Festival"
  | "Producători"
  | "Regiuni"
  | "Interviuri"
  | "Ghid";

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: ArticleCategory;
  author: string;
  date: string;
  readingMinutes: number;
  coverImage: string;
  featured: boolean;
  status: PublishStatus;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  date: string;
  source: string;
}

export interface TenantContent {
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
}

export interface Tenant {
  slug: string;
  config: TenantConfig;
  content: TenantContent;
}
