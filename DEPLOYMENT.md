# Deployment (Docker + GitHub Actions → VPS)

CI/CD complet automat: fiecare push pe `main` construiește imaginile Docker
(`web` + `api`), le publică în **GHCR** și le deployează pe **VPS** prin SSH cu
`docker compose`. Reverse-proxy **Caddy** cu HTTPS automat.

```
push main ─► CI (lint/build/smoke) ─► build & push imagini GHCR ─► SSH VPS ─► docker compose up -d
                                                                     └► Caddy (HTTPS) → web + api
```

## Ce rulează pe VPS

`deploy/docker-compose.prod.yml` pornește: `db` (Postgres + volum), `api`
(FastAPI, rulează migrări + seed la pornire), `web` (Next.js standalone), `caddy`
(HTTPS pentru `DOMAIN` și `API_DOMAIN`).

---

## 1. Pregătire VPS (o singură dată)

Un server Linux (Ubuntu 22.04+) cu IP public.

```bash
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # relogare după

# Directorul de deploy
mkdir -p ~/festival360 && cd ~/festival360

# Fișierul de mediu (din deploy/.env.prod.example)
nano .env
```

Conținut `.env` (completează cu valorile tale):

```env
DOMAIN=festival360.ro
API_DOMAIN=api.festival360.ro
WEB_IMAGE=ghcr.io/OWNER/festival360-web:latest
API_IMAGE=ghcr.io/OWNER/festival360-api:latest
POSTGRES_USER=festival
POSTGRES_PASSWORD=<parolă-puternică>
POSTGRES_DB=festival360
SECRET_KEY=<generează: openssl rand -hex 32>
SEED_ON_STARTUP=true
```

**DNS:** creează câte un record **A** pentru `DOMAIN` și `API_DOMAIN` către IP-ul
VPS-ului. Deschide porturile **80** și **443**.

> `docker-compose.prod.yml` și `Caddyfile` ajung automat pe VPS din Actions (scp).
> La prima rulare le poți copia și manual din `deploy/`.

## 2. Configurare GitHub (o singură dată)

**Settings → Secrets and variables → Actions**

**Variables** (Variables tab):
| Nume | Valoare |
|---|---|
| `DEPLOY_ENABLED` | `true` (activează job-ul de deploy) |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.festival360.ro` (URL-ul public al API) |

**Secrets**:
| Nume | Valoare |
|---|---|
| `VPS_HOST` | IP-ul sau hostname-ul VPS |
| `VPS_USER` | user SSH (ex. `deploy` sau `root`) |
| `VPS_SSH_KEY` | cheia SSH **privată** (cu acces la VPS) |
| `VPS_PORT` | opțional, dacă SSH nu e pe 22 |
| `GHCR_PAT` | opțional — PAT cu `read:packages` dacă lași imaginile private |

**Imagini private vs publice:** implicit imaginile GHCR sunt private. Fie:
- le faci **publice** (GitHub → Packages → package → Package settings → Change visibility), fie
- setezi secretul `GHCR_PAT` (workflow-ul face `docker login` pe VPS înainte de pull).

## 3. Deploy

```bash
git push origin main
```

- **CI** rulează lint + typecheck + build (web) și import + migrare + seed (api).
- **CD** construiește și publică imaginile în GHCR, apoi face SSH pe VPS și
  `docker compose pull && up -d`.
- La prima pornire, `api` rulează `alembic upgrade head` și seed-ul (dacă DB e gol).

Site: `https://festival360.ro` · API/docs: `https://api.festival360.ro/docs`.

> Poți declanșa manual din tab-ul **Actions → CD → Run workflow**.

## Rulare locală în containere (identic cu producția, fără Caddy)

```bash
docker compose up --build      # din rădăcina repo-ului
# web: http://localhost:3000 · api: http://localhost:8000/docs
```

## Operare pe VPS

```bash
cd ~/festival360
docker compose -f docker-compose.prod.yml logs -f api        # loguri
docker compose -f docker-compose.prod.yml ps                 # status
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U festival festival360 > backup_$(date +%F).sql   # backup DB
```

## Checklist

- [ ] VPS cu Docker + Compose, user cu acces `docker`
- [ ] `~/festival360/.env` completat (domenii, parolă DB, `SECRET_KEY`)
- [ ] DNS A: `DOMAIN` și `API_DOMAIN` → IP VPS; porturi 80/443 deschise
- [ ] GitHub Variables: `DEPLOY_ENABLED=true`, `NEXT_PUBLIC_API_BASE_URL`
- [ ] GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (+ opțional `VPS_PORT`, `GHCR_PAT`)
- [ ] Imagini GHCR publice **sau** `GHCR_PAT` setat
- [ ] `git push origin main` → verifică tab-ul Actions
