# Festival Hub API (FastAPI)

Backend real pentru platforma Festival Hub: **FastAPI + SQLModel + PostgreSQL**,
cu autentificare **JWT** și arhitectură **multi-tenant** (`tenant_id` pe fiecare
tabel de conținut). Frontendul Next.js (`../web`) consumă acest API.

## Stack

- FastAPI + Uvicorn
- SQLModel (SQLAlchemy 2 + Pydantic 2) · Alembic (migrări)
- PostgreSQL (local: Docker · producție: Neon)
- Auth: JWT (python-jose) + bcrypt

## Rulare locală

Necesită Docker (pentru Postgres) și Python 3.12+.

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env            # valorile implicite merg cu docker-compose
docker compose up -d            # pornește Postgres pe :5432

alembic upgrade head            # creează schema
python -m app.db.seed           # populează datele demo PRISPA + admin

uvicorn app.main:app --reload   # API pe http://localhost:8000
```

- Docs interactive (Swagger): http://localhost:8000/docs
- Health: http://localhost:8000/health

Reseed curat: `python -m app.db.seed --force`.

## Autentificare demo

- Email: `admin@prispa.demo`
- Parolă: `demo1234`
- `POST /api/v1/auth/login` → `{ accessToken, tokenType, user }`
- Rutele de scriere (`/api/v1/tenants/{slug}/admin/...`) cer `Authorization: Bearer <token>`.

## Rute principale (prefix `/api/v1`)

- `GET /tenants` · `GET /tenants/{slug}` (bundle complet: config + content)
- `GET /tenants/{slug}/{exhibitors|products|destinations|program|partners|gallery|articles}` (+ `/{itemSlug}` pentru detaliu)
- `POST /tenants/{slug}/contact-messages` · `POST /tenants/{slug}/newsletter/subscribe` (publice)
- `POST /auth/login` · `GET /auth/me`
- `POST|PUT|DELETE /tenants/{slug}/admin/...` (protejate) + `/move`, `/toggle-status`, `/settings`, `/sections`, `/messages`, `/newsletter`, `/reset`

## Variabile de mediu

| Variabilă | Descriere |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://user:pass@host:5432/db` (Neon: adaugă `?sslmode=require`) |
| `SECRET_KEY` | cheie lungă, aleatorie, pentru semnarea JWT |
| `CORS_ORIGINS` | originile frontendului, separate prin virgulă (ex. `https://festival360.vercel.app`) |
| `ENVIRONMENT` | `development` \| `production` |
| `SEED_ON_STARTUP` | `true` pentru a popula automat DB-ul gol la pornire |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | durata token-ului (implicit 720) |

## Deploy pe Railway (cu Neon pentru DB)

1. **Neon:** creează un proiect pe [neon.tech](https://neon.tech), copiază connection
   string-ul „pooled" și transformă-l în `postgresql+psycopg://...?sslmode=require`.
2. **Railway:** proiect nou → „Deploy from GitHub repo" → alege repo-ul, iar la
   **Root Directory** pune `api`. Railway detectează `Dockerfile`.
3. Setează variabilele: `DATABASE_URL` (Neon), `SECRET_KEY`, `ENVIRONMENT=production`,
   `SEED_ON_STARTUP=true`, `CORS_ORIGINS=https://<frontend>.vercel.app`.
4. Deploy. La pornire rulează `alembic upgrade head` și, dacă DB-ul e gol, seed-ul.
5. Copiază URL-ul public Railway și pune-l în frontend ca `NEXT_PUBLIC_API_BASE_URL`.

## Structură

```
api/
  app/
    core/       config, db, security (JWT + bcrypt)
    models/     SQLModel: tenant + conținut + admin_user
    schemas/    Pydantic (public camelCase, write, auth)
    services/   query + crud helpers
    api/        deps + routes (auth, tenants, content, admin)
    db/         seed.py + seed_data.json (exportat din datele frontend)
    main.py
  alembic/      migrări
  docker-compose.yml · Dockerfile · railway.json
```
