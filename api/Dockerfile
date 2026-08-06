# Festival Hub API — production image (Railway / any container host)
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (psycopg[binary] ships wheels, so we only need minimal libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Best-effort GeoIP DB download (never blocks boot), run migrations, then serve.
# $PORT is provided by some hosts (Railway); defaults to 8000.
CMD ["sh", "-c", "python -m app.scripts.download_geoip || true; alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
