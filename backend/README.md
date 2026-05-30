# Paid Media Operations Platform — Backend

FastAPI + SQLAlchemy 2.x + PostgreSQL.

## Local setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Start PostgreSQL via Docker
docker compose up -d

# Seed demo data (drops and recreates the schema)
python -m app.seed

# Run the API
uvicorn app.main:app --reload --port 8000
```

The API runs on `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## Notes

- For the MVP the schema is created at startup via `Base.metadata.create_all`. Alembic
  is wired in (directory present) for production-grade migrations later.
- No authentication / RBAC yet. `owner_id`, `assignee_id`, `created_by` are placeholders.
- Real Meta Ads / Google Ads integrations are out of scope.
