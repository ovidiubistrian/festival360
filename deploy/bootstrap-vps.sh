#!/usr/bin/env bash
# Siteora — VPS bootstrap. Run ONCE on a fresh Ubuntu/Debian VPS as the deploy
# user (with sudo) BEFORE the first `git push` deploy.
#
#   curl -fsSL https://raw.githubusercontent.com/ovidiubistrian/festival360/main/deploy/bootstrap-vps.sh | bash
#   # or: scp this file to the VPS and:  bash bootstrap-vps.sh
#
# It installs Docker, creates ~/siteora, generates a secure .env, and opens
# the firewall. After it finishes: set the GitHub Secrets/Variables, push to
# main (CI/CD builds + deploys), then create the super-admin (printed at the end).
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/siteora}"
GHCR_OWNER="${GHCR_OWNER:-ovidiubistrian}"

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!  \033[0m %s\n' "$*"; }

# Prompt reading from the terminal even when the script is piped (curl | bash),
# where stdin is the pipe. Usage: ask VAR "Prompt" "default"
ask() {
  local __var="$1" __prompt="$2" __default="${3:-}" __reply=""
  if [ -r /dev/tty ]; then
    read -rp "$__prompt" __reply </dev/tty || true
  fi
  printf -v "$__var" '%s' "${__reply:-$__default}"
}

# --- 1. Docker + Compose plugin -------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  say "Instalez Docker…"
  curl -fsSL https://get.docker.com | sh
else
  say "Docker deja instalat ($(docker --version))."
fi
if [ "$(id -u)" -ne 0 ] && ! id -nG "$USER" | grep -qw docker; then
  say "Adaug utilizatorul '$USER' în grupul docker (necesită re-login)."
  sudo usermod -aG docker "$USER" || warn "Nu am putut adăuga în grupul docker."
fi

# --- 2. App directory ------------------------------------------------------
mkdir -p "$APP_DIR"
say "Director aplicație: $APP_DIR"

# --- 3. .env (generat o singură dată) -------------------------------------
ENV_FILE="$APP_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  warn ".env există deja — nu-l suprascriu."
else
  say "Configurez .env (Enter = valoarea implicită)."
  ask DOMAIN     "  Domeniu principal [siteora.ro]: " "siteora.ro"
  ask API_DOMAIN "  Domeniu API [api.${DOMAIN}]: " "api.${DOMAIN}"
  ask ACME_EMAIL "  Email ACME (Let's Encrypt) [admin@${DOMAIN}]: " "admin@${DOMAIN}"
  ask OWNER      "  Owner GHCR (user GitHub) [${GHCR_OWNER}]: " "$GHCR_OWNER"
  ask SEED       "  Seed date demo la pornire? (true/false) [false]: " "false"

  PG_PASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
  SECRET="$(openssl rand -hex 32)"

  cat > "$ENV_FILE" <<EOF
DOMAIN=${DOMAIN}
API_DOMAIN=${API_DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
WEB_IMAGE=ghcr.io/${OWNER}/siteora-web:latest
API_IMAGE=ghcr.io/${OWNER}/siteora-api:latest
POSTGRES_USER=siteora
POSTGRES_PASSWORD=${PG_PASS}
POSTGRES_DB=siteora
SECRET_KEY=${SECRET}
SEED_ON_STARTUP=${SEED}
EOF
  chmod 600 "$ENV_FILE"
  say ".env creat (parolă DB + SECRET_KEY generate automat)."
fi

# --- 4. Firewall -----------------------------------------------------------
if command -v ufw >/dev/null 2>&1; then
  say "Deschid porturile în firewall (ufw): 22, 80, 443."
  sudo ufw allow OpenSSH >/dev/null 2>&1 || true
  sudo ufw allow 80/tcp  >/dev/null 2>&1 || true
  sudo ufw allow 443/tcp >/dev/null 2>&1 || true
else
  warn "ufw nu e instalat — asigură-te că porturile 80/443 sunt deschise."
fi

# --- 5. GHCR login (doar dacă imaginile sunt private) ---------------------
if [ -n "${GHCR_PAT:-}" ]; then
  say "Autentificare GHCR (imagini private)…"
  echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_OWNER" --password-stdin
else
  warn "Fără GHCR_PAT — fă pachetele GHCR PUBLICE, sau rulează cu GHCR_PAT=<token> pentru imagini private."
fi

cat <<EOF

$(say "Gata. Pașii următori:")
  1) În GitHub → Settings → Secrets and variables → Actions, setează:
       Variables: DEPLOY_ENABLED=true, NEXT_PUBLIC_API_BASE_URL=https://${API_DOMAIN:-api.siteora.ro},
                  NEXT_PUBLIC_PLATFORM_DOMAIN=${DOMAIN:-siteora.ro}
       Secrets:   VPS_HOST, VPS_USER, VPS_SSH_KEY (+ VPS_PORT, GHCR_PAT opționale)
  2) DNS: A ${DOMAIN:-siteora.ro} și A ${API_DOMAIN:-api.siteora.ro} → IP-ul acestui server.
  3) 'git push' pe main → CI/CD construiește imaginile și le deployează aici.
  4) După ce rulează, creează super-adminul:
       cd ${APP_DIR}
       docker compose --env-file .env -f docker-compose.prod.yml exec api \\
         python -m app.scripts.create_superadmin --email tu@${DOMAIN:-siteora.ro} --name "Numele Tău"
  5) Login la https://${DOMAIN:-siteora.ro}/demo-admin

EOF
