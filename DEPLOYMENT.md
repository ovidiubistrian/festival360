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

**Cel mai simplu — scriptul de bootstrap** (instalează Docker, creează `~/siteora`,
generează `.env` cu parolă DB + `SECRET_KEY`, deschide firewall-ul):

```bash
curl -fsSL https://raw.githubusercontent.com/ovidiubistrian/festival360/main/deploy/bootstrap-vps.sh | bash
# imagini private: GHCR_PAT=<token> bash bootstrap-vps.sh
```

Sau manual:

```bash
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # relogare după

# Directorul de deploy
mkdir -p ~/siteora && cd ~/siteora

# Fișierul de mediu (din deploy/.env.prod.example)
nano .env
```

Conținut `.env` (completează cu valorile tale):

```env
DOMAIN=siteora.ro
API_DOMAIN=api.siteora.ro
WEB_IMAGE=ghcr.io/OWNER/siteora-web:latest
API_IMAGE=ghcr.io/OWNER/siteora-api:latest
POSTGRES_USER=siteora
POSTGRES_PASSWORD=<parolă-puternică>
POSTGRES_DB=siteora
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
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.siteora.ro` (URL-ul public al API) |

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

Site: `https://siteora.ro` · API/docs: `https://api.siteora.ro/docs`.

> Poți declanșa manual din tab-ul **Actions → CD → Run workflow**.

## 4. Super-admin (după primul deploy)

```bash
cd ~/siteora
docker compose --env-file .env -f docker-compose.prod.yml exec api \
  python -m app.scripts.create_superadmin --email tu@siteora.ro --name "Numele Tău"
```

Idempotent (re-rularea actualizează parola). Apoi login la `https://siteora.ro/demo-admin`.
Pentru un prod curat pune `SEED_ON_STARTUP=false` în `.env` (fără date/admin demo).

## 5. Plăți & domenii de tenant (când e cazul)

- **Stripe:** super-admin → *Plăți* → introdu cheile; înregistrează webhook-ul în
  Stripe la `https://api.siteora.ro/api/v1/platform/stripe/webhook`.
- **Domenii de tenant:** clientul își pointează domeniul (A → IP-ul VPS); din
  super-admin → *Site-uri* → *Domeniu* adaugi domeniul, urmezi pașii DNS (TXT +
  A) și verifici. Caddy emite certul HTTPS automat (on-demand).

## Rulare locală în containere (identic cu producția, fără Caddy)

```bash
docker compose up --build      # din rădăcina repo-ului
# web: http://localhost:3000 · api: http://localhost:8000/docs
```

## Operare pe VPS

```bash
cd ~/siteora
docker compose -f docker-compose.prod.yml logs -f api        # loguri
docker compose -f docker-compose.prod.yml ps                 # status
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U siteora siteora > backup_$(date +%F).sql   # backup DB
```

## Checklist

- [ ] VPS cu Docker + Compose, user cu acces `docker`
- [ ] `~/siteora/.env` completat (domenii, parolă DB, `SECRET_KEY`)
- [ ] DNS A: `DOMAIN` și `API_DOMAIN` → IP VPS; porturi 80/443 deschise
- [ ] GitHub Variables: `DEPLOY_ENABLED=true`, `NEXT_PUBLIC_API_BASE_URL`
- [ ] GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (+ opțional `VPS_PORT`, `GHCR_PAT`)
- [ ] Imagini GHCR publice **sau** `GHCR_PAT` setat
- [ ] `git push origin main` → verifică tab-ul Actions
