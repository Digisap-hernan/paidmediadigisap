# Paid Media Operations Platform — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS.

## Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:3000`. All `/api/*` requests are proxied to
`http://localhost:8000/api/*` via `next.config.mjs` rewrites — make sure the backend
is up before opening the UI.
