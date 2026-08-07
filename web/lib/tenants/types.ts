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
  /**
   * Path relative to the tenant root, e.g. "/program", or an absolute
   * `http(s)://…` URL for a custom link added from the admin.
   */
  href: string;
}

/** A menu entry as the admin editor sees it — including the hidden ones. */
export interface NavItemConfig extends NavItem {
  /** Shown in the header / mobile menu / footer. */
  visible: boolean;
  /** Added by the tenant (not part of the vertical preset) — can be deleted. */
  custom: boolean;
  /**
   * Forced out of the menu because the homepage section behind it is disabled
   * in „Pagini și secțiuni". Read-only signal from the API.
   */
  sectionHidden: boolean;
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
  /** Optional logo image; shown instead of the logo text when set. */
  logoImage?: string;
  /** "Despre" section images; empty falls back to the frontend defaults. */
  aboutImage?: string;
  aboutImage2?: string;
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
  /** Extra photos shown as a card carousel (the cover is `image`). */
  gallery?: string[];
  /** Optional CTA link (opens in a new tab). */
  link?: string;
  /** CTA button text; empty falls back to a default label. */
  ctaLabel?: string;
}

/** Content collection a custom section can draw its items from. */
export type CustomSectionSource =
  | "accommodations"
  | "restaurants"
  | "products"
  | "destinations"
  | "exhibitors"
  | "gallery"
  | "news"
  | "program"
  | "events";

/** Section visibility + ordering, editable from the demo admin. */
export interface SectionConfig {
  id: string;
  label: string;
  visible: boolean;
  /** True for admin-created sections (built-in zones leave this undefined). */
  custom?: boolean;
  /** Which content collection a custom section renders. */
  source?: CustomSectionSource;
  /** Field on the source items to filter by, e.g. "type" or "category". */
  filterField?: string;
  /** Value to match; empty/undefined means no filtering. */
  filterValue?: string;
  /** Small overline label above the title. */
  eyebrow?: string;
  /** Section title (custom sections). */
  title?: string;
  /** Section description (custom sections). */
  description?: string;
  /** "Vezi tot" button label. */
  ctaLabel?: string;
  /** "Vezi tot" href, relative to the tenant, e.g. "cazari". */
  ctaHref?: string;
  /** Max items to show; defaults to 6. */
  limit?: number;
}

/** A single seasonal metric card in the "Condiții" widget. */
export interface ConditionMetric {
  label: string;
  value: string;
}

/** One season's content in the "Condiții" widget. */
export interface ConditionSeason {
  headline?: string;
  metrics?: ConditionMetric[];
}

/**
 * "Condiții în stațiune" widget config (resort-only). An empty object falls
 * back to the frontend's hardcoded defaults so nothing looks broken.
 */
export interface Conditions {
  /** Which season tabs to show; defaults to both. */
  seasons?: ("winter" | "summer")[];
  winter?: ConditionSeason;
  summer?: ConditionSeason;
  /** Small footnote under the cards. */
  note?: string;
}

export type TrailDifficulty = "Ușor" | "Mediu" | "Dificil";

/** A single trail in the "Trasee & hartă" widget. */
export interface Trail {
  name: string;
  difficulty: TrailDifficulty;
  length: string;
  /** Diferență de nivel, ex: "620 m". */
  elevation: string;
  duration: string;
  /** Uploaded GPX track URL, ex: "/media/xxx.gpx". */
  gpx?: string;
  /** Descriere liberă a traseului, afișată în dialogul de detalii. */
  description?: string;
  /** Poze ale traseului; prima e considerată copertă. */
  gallery?: string[];
}

/**
 * "Trasee & hartă" widget config (resort-only). An empty object falls back to
 * the frontend's hardcoded defaults so nothing looks broken.
 */
export interface Trails {
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Free-text place used to center the map when no GPX tracks exist. */
  mapQuery?: string;
  items?: Trail[];
}

/** Per-tenant display copy overriding festival defaults (terminology system). */
export type TenantLabels = Record<string, string>;

/**
 * Datele juridice ale organizatorului (asociație, ONG, primărie…). Se setează o
 * singură dată în Setări → Organizator și se tipăresc ca subsol în fiecare
 * formular construit de tenant.
 */
export interface OrganizationInfo {
  /** Denumirea juridică, ex. „Asociația Construim o Țară”. */
  name?: string;
  cif?: string;
  regCom?: string;
  address?: string;
  city?: string;
  county?: string;
  iban?: string;
  bank?: string;
  email?: string;
  phone?: string;
  /** Rând liber sub restul datelor (mențiuni, cod TVA, etc.). */
  note?: string;
}

/** Tipurile de câmp pe care le poate adăuga organizatorul într-un formular. */
export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "checkboxGroup"
  /** Titlu de grup (ex. „DATE EXPOZANT”) — nu se completează. */
  | "section"
  /** Paragraf informativ (ex. condițiile financiare) — nu se completează. */
  | "info";

/** O opțiune de listă/bifă, cu preț opțional (pavilioane, servicii extra). */
export interface FormFieldOption {
  label: string;
  /** Preț în lei; 0 = fără preț. Totalul cererii se însumează din acestea. */
  price?: number;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  /** Text ajutător sub câmp. */
  help?: string;
  required?: boolean;
  /** Lățimea în grila formularului. */
  width?: "full" | "half";
  options?: FormFieldOption[];
}

/** Un formular construit din admin, publicat la `/{tenant}/formular/{slug}`. */
export interface FormDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  fields: FormField[];
  /** Textul butonului; gol → „Trimite cererea”. */
  submitLabel: string;
  /** Mesajul după trimitere; gol → text implicit. */
  successMessage: string;
  /** Tipărește datele organizatorului la finalul formularului. */
  showOrganization: boolean;
  status: PublishStatus;
  /** Adresa notificată la fiecare cerere nouă (doar în admin). */
  notifyEmail?: string;
  submissionCount?: number;
  unreadCount?: number;
}

/** Un răspuns salvat, cu eticheta câmpului de la momentul trimiterii. */
export interface FormAnswer {
  id: string;
  label: string;
  type: FormFieldType;
  value: string;
}

/** O cerere primită prin formular. */
export interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  answers: FormAnswer[];
  /** Suma opțiunilor cu preț bifate; 0 când formularul n-are prețuri. */
  total: number;
  summary: string;
  email: string;
  read: boolean;
  /** ISO datetime. */
  createdAt: string;
}

/**
 * Per-tenant SEO overrides. Every field is optional — empty keys fall back to
 * sensible defaults (name/tagline/shortDescription/heroImage) so an unconfigured
 * site still ships solid metadata.
 */
export interface SeoConfig {
  /** Custom `<title>` for the homepage; empty → "{name} — {tagline}". */
  title?: string;
  /** Meta description (~155 chars); empty → shortDescription. */
  description?: string;
  /** Comma-separated keywords. */
  keywords?: string;
  /** Open Graph / social share image; empty → heroImage. */
  ogImage?: string;
  /** Dimensiunile lui `ogImage`, completate de API când e un fișier încărcat. */
  ogImageWidth?: number;
  ogImageHeight?: number;
  /** Google Search Console `google-site-verification` content value. */
  googleSiteVerification?: string;
  /** When true, the whole site is excluded from search engines. */
  noindex?: boolean;
}

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
  /** Menu entries actually shown on the site (visible ones only). */
  navigation: NavItem[];
  /** Full menu incl. hidden entries — the admin editor's source of truth. */
  navigationConfig?: NavItemConfig[];
  social: SocialLinks;
  contact: ContactInfo;
  sections: SectionConfig[];
  stats: Stat[];
  experiences: Experience[];
  /** Resort-only "Condiții" widget config; empty → frontend defaults. */
  conditions?: Conditions;
  /** Resort-only "Trasee & hartă" widget config; empty → frontend defaults. */
  trails?: Trails;
  /** Per-tenant SEO overrides; empty keys fall back to sensible defaults. */
  seo?: SeoConfig;
  /** Datele juridice ale organizatorului — subsolul formularelor. */
  organization?: OrganizationInfo;
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
  /** CTA button text; empty falls back to a default label. */
  ctaLabel?: string;
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

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  /** Tip bucătărie, ex: "Românească", "Pește", "Pizza", "Internațională". */
  cuisine: string;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  /** Free-text interval de preț, ex: "$$" sau "80–150 RON / persoană". */
  priceRange: string;
  /** Program, ex: "L–D 10:00–22:00". */
  hours: string;
  address: string;
  contactPhone: string;
  contactWebsite: string;
  /** Link către meniu. */
  menuUrl: string;
  /** Link către rezervări. */
  bookingUrl: string;
  /** Facility keys, e.g. ["terasă", "parcare", "wifi", "live-music"]. */
  amenities: string[];
  featured: boolean;
  status: PublishStatus;
  sortOrder: number;
}

/** A single line in an event's mini-program (schedule). */
export interface EventProgramItem {
  /** Ora, ex: "18:00" sau "18:00–19:30". */
  time: string;
  title: string;
  description: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  /** Imagine principală (cover). */
  coverImage: string;
  gallery: string[];
  shortDescription: string;
  description: string;
  /** ISO date, ex: "2026-08-14". Gol → nespecificat. */
  startDate: string;
  /** ISO date, ex: "2026-08-16". Gol → nespecificat. */
  endDate: string;
  /** Interval orar liber, ex: "18:00–23:00". */
  timeLabel: string;
  location: string;
  /** Mini-program pe momente. */
  program: EventProgramItem[];
  /** Link extern de bilete (Eventbrite, iaBilet…). */
  ticketUrl: string;
  /** Text buton bilete; UI folosește „Cumpără bilete” când e gol. */
  ticketLabel: string;
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
  restaurants: Restaurant[];
  events: Event[];
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
