# Deploying to Vercel + Render + Supabase (free tier)

This stack runs with **no Kafka**. The worker polls the `ZapRunOutbox` table in
Postgres directly, so the only infra you need is a database.

| Piece | Where | Service |
|-------|-------|---------|
| Frontend (Next.js) | **Vercel** | Root Directory `frontend` |
| API (`primary-backend`) | **Render** | web service, `rootDir: primary-backend` |
| Webhook receiver (`hooks`) | **Render** | web service, `rootDir: hooks` |
| Job runner (`worker`) | **Render** | web service (health + outbox poller) |
| Postgres | **Supabase** | connection pooler |
| ~~Kafka / processor~~ | — | removed; worker handles it |

> `processor/` is now unused (its job moved into `worker`). You can delete that
> folder.

---

## 1. Supabase (database)

1. Create a project at [supabase.com](https://supabase.com). Note the **project ref** and database password.
2. Grab the **pooled** connection string: Dashboard → **Connect** →
   **Connection pooling** → **Session** mode. It looks like:
   ```
   postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   Use **Session** mode (port `5432`). (Transaction mode on `:6543` also works
   but needs `?pgbouncer=true` appended for Prisma.)
3. Run the migrations + seed once, from your machine:
   ```bash
   cd hooks
   DATABASE_URL="<your-supabase-session-url>" npx prisma migrate deploy

   cd ../primary-backend
   DATABASE_URL="<your-supabase-session-url>" npx tsx scripts/seed-catalog.ts
   ```

## 2. Render (backend, hooks, worker)

The repo ships a **`render.yaml`** Blueprint that defines all three services.

1. Push this repo to GitHub.
2. On [render.com](https://render.com) → **New** → **Blueprint** → pick the repo.
   Render reads `render.yaml` and creates `zapier-backend`, `zapier-hooks`,
   `zapier-worker` (all free web services).
3. For each service, set the environment variables (Blueprint leaves the secrets
   as *Sync: off* so you fill them in the dashboard):
   - **All three:** `DATABASE_URL` = your Supabase session URL.
   - **backend:** `JWT_SECRET` (Blueprint auto-generates one), `CORS_ORIGIN` = your Vercel URL (see §4).
   - **hooks:** `CORS_ORIGIN` = your Vercel URL.
   - **worker:** `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`,
     `SMTP_PASS` (Gmail App Password), `SMTP_FROM`.
4. Deploy. Each service exposes `/health` and binds `process.env.PORT`.

### Keep the worker awake (important on the free plan)

Free Render services **spin down after ~15 min idle** and cold-start (~30–50 s)
on the next request. The worker only processes runs while it's awake, so point a
free uptime monitor (e.g. **UptimeRobot**, 5-min interval) at:

```
https://zapier-worker-<xxxx>.onrender.com/health
```

You can also monitor `/health` on backend + hooks to avoid cold starts on the
first browser hit.

## 3. Vercel (frontend)

1. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
2. Set **Root Directory** to `frontend` (Settings → General).
3. Add build-time env vars (Settings → Environment Variables), then **redeploy**
   (Next.js inlines `NEXT_PUBLIC_*` at build time):
   ```
   NEXT_PUBLIC_API_URL   = https://zapier-backend-<xxxx>.onrender.com/api/v1
   NEXT_PUBLIC_HOOKS_URL = https://zapier-hooks-<xxxx>.onrender.com
   ```
4. Deploy. Vercel auto-detects Next.js.

## 4. CORS

The backend and hooks only allow browser requests from the origins you list in
`CORS_ORIGIN` (comma-separated). Set it on **both** `zapier-backend` and
`zapier-hooks` to your Vercel URL(s):

```
CORS_ORIGIN = https://your-app.vercel.app
```

For local dev leave it unset (any origin is allowed). Add your Vercel **preview**
domains too if you need the test-fire button to work on preview deployments.

---

## Environment variable reference

| Var | Service(s) | Purpose |
|-----|-----------|---------|
| `DATABASE_URL` | backend, hooks, worker | Supabase pooled Postgres URL |
| `JWT_SECRET` | backend | signs auth tokens |
| `CORS_ORIGIN` | backend, hooks | allowed browser origins (Vercel) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | worker | real Gmail sending |
| `NEXT_PUBLIC_API_URL` | frontend (Vercel build) | backend base URL |
| `NEXT_PUBLIC_HOOKS_URL` | frontend (Vercel build) | hooks base URL |
| `PORT` | all (Render injects) | listen port |

## Local development (no Kafka)

```bash
docker compose up --build   # postgres + migrate + seed + backend/hooks/worker/frontend
```

The worker now polls Postgres directly — there is no Kafka or processor to run.
