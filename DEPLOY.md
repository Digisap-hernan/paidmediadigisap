# Deploy a Vercel (frontend + backend) con protección por contraseña

Esta guía publica:

- **Frontend Next.js** → proyecto Vercel
- **Backend FastAPI** → proyecto Vercel separado (Python serverless)
- **PostgreSQL** → Neon (vía Vercel Storage)
- **Acceso protegido** con HTTP Basic Auth (`digisap` / `paidmedia` por defecto)

> Tiempo estimado: 20–30 minutos.

---

## 0. Pre-requisitos

- Cuenta en https://github.com (gratis)
- Cuenta en https://vercel.com — inicia sesión con GitHub
- `git` instalado (viene en macOS de fábrica)

Verifica git:
```bash
git --version
```

---

## 1. Crear el repositorio en GitHub

1. Entra a https://github.com/new
2. Repository name: `paid-media-platform`
3. Visibility: **Private**
4. NO marques "Add a README" / "Add .gitignore" / "Choose a license"
5. Click **Create repository**
6. Copia la URL HTTPS que aparece (algo como `https://github.com/TU_USUARIO/paid-media-platform.git`)

---

## 2. Subir el código a GitHub

En la terminal:

```bash
cd /Users/hernan/app-paid-media-andres/paid-media-platform

# Si es tu primera vez con git en este Mac:
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

git init
git add .
git commit -m "Initial commit: MVP 0.1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/paid-media-platform.git
git push -u origin main
```

(GitHub te pedirá un Personal Access Token en lugar de tu password. Si no tienes,
crea uno en https://github.com/settings/tokens/new con scope `repo` y úsalo como
"password" cuando git te lo pida.)

---

## 3. Crear la base de datos PostgreSQL en Vercel

1. Entra a https://vercel.com/dashboard
2. Click **Storage** en el menú superior
3. Click **Create Database** → elige **Neon** (Postgres) → **Continue**
4. Database Name: `paidmedia-db`
5. Región: la más cercana (ej. `us-east-1`)
6. Click **Create**
7. En la pantalla de la DB, click la tab **Quickstart** y copia el valor de **`DATABASE_URL`**
   (empieza con `postgres://...`)

Guarda esa URL — la vas a usar en el backend.

---

## 4. Cargar datos iniciales en Neon (desde local)

Desde tu Terminal:

```bash
cd /Users/hernan/app-paid-media-andres/paid-media-platform/backend
source .venv/bin/activate

# Reemplaza con la URL que copiaste de Vercel/Neon en el paso 3.
# IMPORTANTE: cambia "postgres://" por "postgresql+psycopg2://"
export DATABASE_URL='postgresql+psycopg2://USER:PASS@HOST/DB?sslmode=require'

python -m app.seed
```

Debes ver:
```
Seed completed.
  Users: 2 | Clients: 2 | Workspaces: 2 | Campaigns: 3
  ...
```

---

## 5. Deploy del BACKEND en Vercel

1. https://vercel.com/dashboard → **Add New…** → **Project**
2. Elige el repo `paid-media-platform` → click **Import**
3. **Configure Project**:
   - **Project Name**: `paid-media-backend`
   - **Root Directory**: click **Edit** → selecciona `backend` → **Continue**
   - **Framework Preset**: déjalo en **Other**
4. Despliega **Environment Variables** y añade:
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | la URL que copiaste en el paso 3 (con `postgresql+psycopg2://...`) |
   | `CORS_ORIGINS` | `*` |
5. Click **Deploy**

Espera ~2 min. Cuando termine, copia la URL pública del backend
(algo como `https://paid-media-backend-xxxx.vercel.app`).

Verifica abriendo en el navegador:
```
https://paid-media-backend-xxxx.vercel.app/api/v1/dashboard/kpi
```

Debes ver un JSON con números.

---

## 6. Deploy del FRONTEND en Vercel

1. https://vercel.com/dashboard → **Add New…** → **Project**
2. Mismo repo `paid-media-platform` → **Import**
3. **Configure Project**:
   - **Project Name**: `paid-media-frontend`
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detectado)
4. **Environment Variables**:
   | Name | Value |
   |------|-------|
   | `API_URL` | URL del backend del paso 5 (sin trailing slash) |
   | `BASIC_AUTH_USER` | `digisap` |
   | `BASIC_AUTH_PASS` | `paidmedia` |
5. Click **Deploy**

Espera ~2 min. Cuando termine, abre la URL del frontend.

El navegador te pedirá **usuario y contraseña**:
- Usuario: `digisap`
- Password: `paidmedia`

¡Listo! Verás la app igual que en local pero pública y protegida.

---

## 7. Cambiar la contraseña en cualquier momento

1. https://vercel.com/dashboard → proyecto `paid-media-frontend`
2. **Settings** → **Environment Variables**
3. Edita `BASIC_AUTH_USER` o `BASIC_AUTH_PASS`
4. **Redeploy** desde la pestaña Deployments

---

## Solución de problemas

| Síntoma | Solución |
|---------|----------|
| Backend devuelve 500 | Revisa **Logs** del proyecto backend en Vercel. Lo más común: `DATABASE_URL` mal formada o sin `?sslmode=require` |
| Frontend muestra error de proxy | Verifica que `API_URL` en el frontend apunte al dominio del backend, con `https://` y sin `/` al final |
| El popup de login se repite infinito | El navegador cachea credenciales fallidas. Cierra el navegador completamente o usa modo incógnito |
| Quiero ver los datos sin login | Imposible — el middleware bloquea todo. Para uso interno con clientes, mejor mantenerlo así |

---

## Costos

Con tráfico de equipo interno (decenas de visitas/día), los 3 servicios se
mantienen dentro del **free tier**:

- Vercel Hobby: 100 GB de bandwidth/mes
- Neon Free: 0.5 GB de storage, sleep tras 5 min de inactividad
- Sin tarjeta de crédito requerida en ninguno
