# Paid Media Operations Platform — MVP 0.1

Sistema operativo web para centralizar el flujo completo de trabajo del área de
paid media de Digisap: clientes, campañas, etapas operativas (intake → operate),
checklists obligatorios de setup y QA, incidentes, tareas, changelog y dashboard
operativo.

> **Estado**: MVP 0.1 — funcional end-to-end con un cliente real tipo Lead Gen
> usando Meta Ads + Google Search.

---

## 1. Arquitectura

Monorepo con dos servicios independientes:

```
paid-media-platform/
├── backend/        FastAPI + SQLAlchemy 2.x + PostgreSQL 15
└── frontend/       Next.js 14 (App Router) + TypeScript + Tailwind CSS
```

- **Backend** expone una REST API bajo `/api/v1`. Los modelos viven en
  `backend/app/models/`, los schemas Pydantic en `backend/app/schemas/`, los
  endpoints en `backend/app/api/v1/`, y la lógica de dominio (workflow, QA,
  health score, plantillas de checklist) en `backend/app/services/`.
- **Frontend** consume el backend via rewrite: cualquier `/api/*` desde el
  navegador es proxy a `http://localhost:8000/api/*` (configurado en
  `frontend/next.config.mjs`).
- **Base de datos**: PostgreSQL 15 corriendo vía Docker Compose. El esquema
  se crea automáticamente al arrancar el backend (Alembic queda preparado para
  migraciones formales en versiones posteriores).

---

## 2. Setup local

### Requisitos

- Python **3.11+**
- Node.js 18+ (probado con 18, 20, 22, 24)
- Docker + Docker Compose

### Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# 1) Levanta PostgreSQL en background
docker compose up -d

# 2) Crea el esquema y carga datos demo
python -m app.seed

# 3) Arranca la API
uvicorn app.main:app --reload --port 8000
```

Comprueba:
- `GET http://localhost:8000/health` → `{"status":"ok",...}`
- Swagger en `http://localhost:8000/docs`

### Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:3000`. La home redirige al dashboard.

---

## 3. Endpoints principales

Base: `http://localhost:8000/api/v1`

| Recurso       | Método | Path |
|---------------|--------|------|
| Health        | GET    | `/health` (también `/api/v1/health`) |
| Clientes      | GET/POST | `/clients` |
| Cliente       | GET/PATCH | `/clients/{id}` |
| Campañas del cliente | GET | `/clients/{id}/campaigns` |
| Campañas      | GET/POST | `/campaigns` (filtros: `stage`, `status`, `platform`, `client_id`) |
| Campaña       | GET/PATCH | `/campaigns/{id}` |
| Avanzar etapa | POST   | `/campaigns/{id}/advance-stage` |
| Checklists    | GET/POST | `/campaigns/{id}/checklists` |
| Item checklist| PATCH  | `/checklist-items/{item_id}` |
| Completar QA  | POST   | `/campaigns/{id}/qa/complete` |
| Incidentes    | GET/POST | `/incidents` |
| Incidente     | GET/PATCH | `/incidents/{id}` |
| Tareas        | GET/POST | `/tasks` |
| Tarea         | PATCH  | `/tasks/{id}` |
| Changelog     | GET/POST | `/campaigns/{id}/changelog` |
| Dashboard KPI | GET    | `/dashboard/kpi` |
| Riesgo        | GET    | `/dashboard/risky-campaigns` |
| Tareas críticas | GET  | `/dashboard/critical-tasks` |

---

## 4. Reglas de workflow

`CAMPAIGN_STAGES = ["intake", "audit", "strategy", "build", "qa", "launch", "operate"]`

`POST /campaigns/{id}/advance-stage` valida (en `app/services/workflow.py`):

- ❌ Bloqueado si la campaña ya está en `operate`.
- ❌ Bloqueado si existe checklist de la etapa actual y NO está `complete`.
- ❌ Para pasar de `qa` → `launch`, todos los items con `is_blocking=true` deben
  estar `done`.
- ❌ Para pasar a `launch`, no debe haber incidentes `critical` o `high` abiertos
  (status ∈ {new, investigating, mitigated}) asociados a la campaña.
- En cualquier fallo: HTTP **422** + mensaje claro en `detail`.

## 5. Health score

`app/services/health_score.py`:

| Regla | Descuento |
|-------|-----------|
| Score base | 100 |
| Cada incidente `critical` abierto | −40 |
| Cada incidente `high` abierto | −25 |
| Cada incidente `medium` abierto | −10 |
| Cada tarea vencida no completada | −5 |
| QA incompleto y campaña en `launch`/`operate` | −15 |

Acotado a `[0, 100]`. Se recalcula automáticamente en `GET /campaigns`,
`GET /campaigns/{id}`, dashboards, y al actualizar/crear incidentes,
tareas o ítems de checklist.

## 6. Checklists

Plantillas en `app/services/checklist_templates.py`. Cuando creas una campaña,
el backend genera automáticamente:

- Checklist `build` (= setup)
- Checklist `qa` pre-launch

por tipo (`META_LEADGEN` o `GADS_SEARCH_LEADGEN`). Los ítems QA marcados como
bloqueantes son los que respeta la regla de `qa → launch`.

---

## 7. UTM Builder

Componente reusable (`frontend/src/components/UTMBuilder.tsx`) en:

- `/settings`
- Tab "UTM Builder" del detalle de campaña

Estándares aplicados:

- `utm_source`: `meta`, `google`, `linkedin`, `tiktok`
- `utm_medium`: `paid_social`, `paid_search`, `display`, `cpc`
- `utm_campaign`: `cliente_objetivo_pais_fecha` en minúsculas (normalizado en vivo)

URL final calculada con `URL` API + botón **Copiar**.

---

## 8. Limitaciones del MVP

- **Sin autenticación/RBAC**: `owner_id`, `assignee_id`, `created_by` son
  placeholders int. Próximo paso: SSO + roles (admin, lead, analyst, client).
- **Sin integraciones reales** con Meta Marketing API, Google Ads API ni
  Looker Studio. Las plataformas se gestionan operativamente, no se sincronizan.
- **Migraciones Alembic** instaladas pero no usadas. El esquema se crea con
  `Base.metadata.create_all` al startup; el seed dropea y recrea para garantizar
  data limpia. En producción habrá que generar revisiones formales.
- **No hay reporting automatizado**: el modelo `Report` existe pero aún sin
  endpoint ni generador.
- **No hay tests automatizados** todavía. La validación es manual + smoke test
  vía Swagger.
- **Frontend**: paginación, búsqueda full-text, filtros multi-select y bulk
  actions quedan para v0.2.
- **Notificaciones**: sin Slack/email integration.

## 9. Próximos pasos sugeridos

1. **Auth**: integrar Clerk o Auth.js + propagar `current_user` a través de un
   `Depends`.
2. **Migraciones reales**: `alembic init`, baseline + auto-generate.
3. **Tests**: pytest + httpx.AsyncClient; React Testing Library para UI.
4. **Webhooks Meta/Google**: alimentar incidentes y métricas reales.
5. **Reporting builder**: generar PDFs/links semanales por cliente.
6. **Audit log** completo para todas las mutaciones.
7. **Notificaciones Slack** para gates fallidos y nuevos incidentes
   `high`/`critical`.

---

## 10. Decisiones tomadas durante la implementación

- El template de checklist `build` se mapea como "setup" (el doc usa los dos
  términos indistintamente). El campo `type` del modelo soporta los 6 stages
  formales: `intake`, `audit`, `strategy`, `build`, `qa`, `launch`.
- Crear un `Client` también crea automáticamente un `Workspace` por defecto,
  para que el flujo de creación de campaña sea ágil.
- Se descartó habilitar SSR fetch en páginas Next.js: todas las pantallas que
  consultan API son Client Components, lo que simplifica el manejo del proxy
  `/api/*` y mantiene el código consistente.
- `budget_total` se modela como `Numeric(12,2)` y se serializa como `float`.
- El campo `Mapped[X | None]` requiere Python 3.11+ por el operador `|` en
  runtime; esto está documentado en `requirements.txt` + README.
- Los IDs (`owner_id`, `created_by`) aceptan `null` para no bloquear flujos
  hasta que exista auth real.

---

## 11. Smoke test rápido

Con backend corriendo:

```bash
curl -s localhost:8000/health
curl -s localhost:8000/api/v1/clients | jq
curl -s localhost:8000/api/v1/campaigns | jq
curl -s localhost:8000/api/v1/dashboard/kpi | jq
curl -X POST localhost:8000/api/v1/campaigns/1/advance-stage   # 422 esperado
```

Con frontend corriendo, navega a `http://localhost:3000` y deberías ver el
dashboard con KPIs, las tablas de campañas en riesgo y tareas críticas. Entra
a una campaña → cambia ítems del checklist build → cuando esté 100%, el
botón "Avanzar a siguiente etapa" pasará a `qa`.
