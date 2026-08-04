# Festival Hub

Platformă **SaaS multi-tenant** pentru festivaluri, târguri și evenimente
gastronomice, culturale și turistice. Primul tenant: **PRISPA** (Piața Sfatului,
Brașov). Aplicație full-stack, gata de producție.

```
festival360/
  web/   — Frontend: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
  api/   — Backend:  FastAPI (Python) + SQLModel + PostgreSQL + JWT
```

- **web/** – site public (SSR din API) + panou de administrare (auth reală, CRUD).
- **api/** – REST API multi-tenant, autentificare JWT, migrări Alembic.
- **DB** – PostgreSQL (local prin Docker · producție prin Neon).

Fiecare parte are propriul README cu detalii: [`web/`](web) și [`api/`](api/README.md).

## Arhitectură

```
┌──────────────────────┐   HTTP/JSON    ┌───────────────────────┐   SQL   ┌────────────┐
│ Next.js (web/)        │ ─────────────▶ │ FastAPI (api/)         │ ──────▶ │ PostgreSQL │
│ SSR public + admin    │ ◀───────────── │ auth JWT + CRUD        │         │ (Neon)     │
└──────────────────────┘                └───────────────────────┘         └────────────┘
        Vercel                                  Railway
```

Frontendul nu mai are date hardcodate: paginile publice fac SSR din API, iar
panoul admin scrie prin API (persistență reală în DB). Contractul de date este
identic (API-ul returnează exact forma așteptată de frontend), deci interfața a
rămas neschimbată la trecerea de la mock la backend real.

## Rulare locală (full-stack)

Necesită Node 20+, Python 3.12+ și Docker.

**1. Backend (terminal 1):**
```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
docker compose up -d          # Postgres pe :5432
alembic upgrade head          # schema
python -m app.db.seed         # date demo + admin
uvicorn app.main:app --reload # API pe http://localhost:8000  (docs: /docs)
```

**2. Frontend (terminal 2):**
```bash
cd web
npm install
npm run dev                   # http://localhost:3000
```

Frontendul folosește implicit `http://localhost:8000` pentru API. Pentru alt URL,
setează `NEXT_PUBLIC_API_BASE_URL` (ex. în `web/.env.local`).

## Acces demo (panou admin)

- `/demo-admin` → Email `admin@prispa.demo` · Parolă `demo1234`
- Autentificare **reală** (JWT). Buton „Resetează datele demo" readuce conținutul inițial.

## Rute frontend

- `/` — landing Festival Hub · `/prispa` — festival
- `/prispa/{despre,program,expozanti,produse,destinatii,parteneri,galerie,noutati,contact}` (+ pagini de detaliu `/[slug]`)
- `/demo-admin/{dashboard,pages,program,exhibitors,products,destinations,partners,gallery,news,messages,newsletter,settings}`

## Deploy în producție

Ordinea recomandată:

1. **Bază de date — Neon:** creează un proiect PostgreSQL pe [neon.tech](https://neon.tech),
   copiază connection string-ul și adaptează-l: `postgresql+psycopg://USER:PASS@HOST/DB?sslmode=require`.
2. **Backend — Railway:** [railway.app](https://railway.app) → deploy din repo, **Root Directory = `api`**
   (detectează `Dockerfile`). Variabile: `DATABASE_URL` (Neon), `SECRET_KEY`,
   `ENVIRONMENT=production`, `SEED_ON_STARTUP=true`, `CORS_ORIGINS=https://<frontend>.vercel.app`.
   La pornire rulează migrările și seed-ul. Notează URL-ul public Railway.
3. **Frontend — Vercel:** proiectul `festival360`, **Root Directory = `web`**. Setează
   `NEXT_PUBLIC_API_BASE_URL=https://<api-railway-url>`. Redeploy.

Detalii pas cu pas în [`api/README.md`](api/README.md).

## Tehnologii

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react,
framer-motion, Recharts, sonner.
**Backend:** FastAPI, Uvicorn, SQLModel (SQLAlchemy 2 + Pydantic 2), Alembic, PostgreSQL,
psycopg3, python-jose (JWT), bcrypt.
