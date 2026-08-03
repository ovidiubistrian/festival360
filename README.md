# Festival Hub — demo

Platformă SaaS **multi-tenant** pentru festivaluri, târguri și evenimente
gastronomice, culturale și turistice. Acest repo conține un **demo frontend
complet**, cu primul tenant demonstrativ: **PRISPA** (festival de tradiții,
gastronomie, meșteșuguri și turism, Piața Sfatului, Brașov).

> Demo fără backend real. Toate datele sunt mock (fișiere TypeScript). Panoul
> de administrare persistă modificările doar în `localStorage` — nu există bază
> de date, autentificare reală sau plăți.

## Tehnologii

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + design tokens proprii
- **shadcn/ui** (componente în `components/ui`, primitive Radix)
- **lucide-react** (iconuri) · **framer-motion** (animații discrete) ·
  **recharts** (grafice dashboard) · **sonner** (toasts)
- `next/image` pentru imagini remote (Unsplash), cu fallback vizual elegant

## Rulare locală

```bash
npm install
npm run dev
```

Aplicația pornește pe [http://localhost:3000](http://localhost:3000).

Verificări:

```bash
npm run lint          # ESLint
npx tsc --noEmit      # verificare TypeScript
npm run build         # build de producție
```

## Date de acces pentru demo (panou admin)

- Ruta: **`/demo-admin`**
- Email: `admin@prispa.demo`
- Parolă: `demo1234`
- Buton „Intră în demo”

> Autentificarea este **simulată** (nu există securitate reală). Datele se
> salvează în `localStorage`; butonul „Resetează datele demo” readuce conținutul
> inițial.

## Rute

### Platformă
- `/` — landing page Festival Hub (prezentare produs SaaS)

### Festival public (tenant `prispa`)
- `/prispa` — homepage festival
- `/prispa/despre`
- `/prispa/program`
- `/prispa/expozanti` · `/prispa/expozanti/[slug]`
- `/prispa/produse` · `/prispa/produse/[slug]`
- `/prispa/destinatii` · `/prispa/destinatii/[slug]`
- `/prispa/parteneri`
- `/prispa/galerie`
- `/prispa/noutati` · `/prispa/noutati/[slug]`
- `/prispa/contact`

### Panou admin (demo)
- `/demo-admin` — login demo
- `/demo-admin/dashboard`
- `/demo-admin/pages` — pagini & secțiuni (vizibilitate + ordine)
- `/demo-admin/program`
- `/demo-admin/exhibitors`
- `/demo-admin/products`
- `/demo-admin/destinations`
- `/demo-admin/partners`
- `/demo-admin/gallery`
- `/demo-admin/news`
- `/demo-admin/messages` — mesaje de contact
- `/demo-admin/newsletter`
- `/demo-admin/settings` — setări festival + identitate vizuală

### SEO
- `/sitemap.xml` · `/robots.txt` · JSON-LD (`Festival`) pe homepage-ul PRISPA

## Structura proiectului

```
app/
  page.tsx                 # Festival Hub landing
  [tenant]/                # segment multi-tenant (rezolvă /prispa)
    layout.tsx             # header + footer + toaster
    page.tsx               # homepage festival
    despre|program|...     # pagini publice
  demo-admin/              # panou admin (login + module)
  sitemap.ts · robots.ts · not-found.tsx
components/
  ui/                      # shadcn-style (Button, Card, Dialog, Table, ...)
  shared/                  # Container, Reveal, ImageWithFallback, Icon, ...
  public/                  # SiteHeader/Footer, carduri, secțiuni, explorers
  admin/                   # AdminShell, StatCard, module UI
lib/
  utils.ts                 # cn, formatare RO, slugify
  tenants/
    types.ts               # modelul de date multi-tenant
    index.ts               # registry: getTenant(slug), tenantSlugs
    prispa/
      config.ts            # temă, info festival, navigație, secțiuni, stats
      images.ts            # POOL CENTRAL de imagini (un singur loc de înlocuit)
      data/                # exhibitors, products, destinations, program,
                           # partners, gallery, articles
  admin/
    store.ts               # store localStorage (seed din datele tenant)
    analytics.ts           # date mock pentru graficul dashboard
```

## Arhitectură multi-tenant

Fiecare festival este un `Tenant` (vezi `lib/tenants/types.ts`): slug, config
(temă, info, navigație, vizibilitate secțiuni) și `content` (expozanți, produse,
destinații, program, parteneri, galerie, articole, mesaje, newsletter).

Adăugarea unui festival nou:

1. Creează `lib/tenants/<slug>/` (după modelul `prispa/`).
2. Exportă un obiect `Tenant` din `lib/tenants/<slug>/index.ts`.
3. Înregistrează-l în `lib/tenants/index.ts` (`tenants` map).

Rutele publice îl rezolvă automat prin `getTenant(slug)`, iar
`generateStaticParams` generează paginile pentru toate slug-urile.

## Imagini

Toate imaginile publice trec prin `lib/tenants/prispa/images.ts` (pool central)
și componenta `ImageWithFallback` (fallback vizual dacă un URL nu se încarcă).
Pentru a folosi poze reale: pune fișierele în `public/images/` și înlocuiește
URL-urile din `images.ts` — nu trebuie atinsă nicio componentă.

Domeniile remote permise sunt configurate în `next.config.ts`
(`images.unsplash.com`, `plus.unsplash.com`).

## Publicare pe Vercel

1. Urcă proiectul într-un repo Git (GitHub/GitLab/Bitbucket).
2. În [vercel.com/new](https://vercel.com/new) importă repo-ul.
3. Vercel detectează Next.js automat — nu e nevoie de configurări speciale
   (Build Command `next build`, Output implicit). Fără variabile de mediu.
4. Deploy. Domeniul demo va servi `/`, `/prispa` și `/demo-admin`.

Alternativ, din CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # producție
```

## Integrare backend ulterioară (Supabase / PostgreSQL)

Interfața este separată de date, deci integrarea nu cere reconstruirea UI-ului.
Pași recomandați:

1. **Schema DB** după tipurile din `lib/tenants/types.ts` (tabele: `tenants`,
   `exhibitors`, `products`, `destinations`, `program_events`, `partners`,
   `gallery_images`, `articles`, `contact_messages`, `newsletter_subscribers`).
   Coloana `tenant_id` (FK) pe fiecare tabel de conținut pentru multi-tenancy.
2. **Citire**: înlocuiește `getTenant()` și importurile din `lib/tenants/prispa/data/*`
   cu interogări Supabase (Server Components / Route Handlers). Contractul de
   tipuri rămâne identic, deci componentele nu se schimbă.
3. **Scriere (admin)**: înlocuiește funcțiile din `lib/admin/store.ts`
   (`upsertItem`, `deleteItem`, `updateSettings`, ...) cu mutații Supabase +
   `revalidatePath`. Semnăturile pot rămâne aceleași.
4. **Auth**: înlocuiește `loginDemo/isLoggedIn` cu Supabase Auth (sau
   NextAuth) și protejează `/demo-admin` cu middleware.
5. **Upload imagini**: Supabase Storage; înlocuiește URL-urile din `images.ts`.
6. **Newsletter / mesaje**: scrie în tabele reale + integrare email.

## Note

- Texte publice: limba română cu diacritice.
- Fără scroll orizontal, meniu mobil funcțional, focus states, empty states.
- Panoul admin nu pretinde persistență pe server — totul e `localStorage`.
