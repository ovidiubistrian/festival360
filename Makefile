# Festival Hub — scurtături pentru dezvoltare locală
# Dev cu hot-reload: rulează în 3 terminale  ->  make db  |  make api  |  make web

.PHONY: help db db-stop api web seed seed-reset export-seed install up up-build down logs ps

help:
	@echo "Dezvoltare (hot-reload, 3 terminale):"
	@echo "  make db          Pornește PostgreSQL în Docker (:5432)"
	@echo "  make api         Pornește API-ul FastAPI cu reload (:8000)"
	@echo "  make web         Pornește frontendul Next.js cu reload (:3000)"
	@echo ""
	@echo "Date:"
	@echo "  make seed        Populează DB-ul cu datele demo"
	@echo "  make seed-reset  Resetează DB-ul la datele demo"
	@echo "  make export-seed Regenerează seed-ul din datele TS (web -> api)"
	@echo ""
	@echo "Instalare:"
	@echo "  make install     Instalează dependențele (api venv + web npm)"
	@echo ""
	@echo "Docker (stack complet, ca în producție):"
	@echo "  make up          docker compose up (folosește imaginile existente)"
	@echo "  make up-build    docker compose up --build"
	@echo "  make down        Oprește stack-ul Docker"
	@echo "  make logs        Loguri live"

# --- Dezvoltare cu hot-reload ---
db:
	docker compose up -d db

db-stop:
	docker compose stop db

api:
	cd api && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

web:
	cd web && npm run dev

# --- Date ---
seed:
	cd api && . .venv/bin/activate && python -m app.db.seed

seed-reset:
	cd api && . .venv/bin/activate && python -m app.db.seed --force

export-seed:
	cd web && npx tsx scripts/export-seed.ts

# --- Instalare ---
install:
	cd api && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
	cd web && npm install
	@echo "Gata. Copiază api/.env.example în api/.env dacă nu există."

# --- Docker (stack complet) ---
up:
	docker compose up -d

up-build:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps
