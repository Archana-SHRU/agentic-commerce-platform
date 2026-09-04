# Deployment Guide

## 0. Local setup (after the config fix)

The backend now resolves `.env` from an absolute path based on the source
tree, so it works no matter which directory you launch from. Both of these
are read, with `backend/.env` winning on conflicts:

- `<repo>/.env`
- `<repo>/backend/.env`

You can also point at an explicit file: `ENV_FILE=/path/to/app.env`.

```bash
# 1. Backend virtualenv
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate
pip install -r requirements.txt

# 2. Create backend/.env  (copy from backend/.env.example)
#    DATABASE_URL=postgresql://<user>:<password>@localhost:5432/razorcart_ai
#    SECRET_KEY=<python -c "import secrets; print(secrets.token_urlsafe(64))">

# 3. Migrate + seed
alembic upgrade head
python seed.py

# 4. Run
uvicorn app.main:app --reload --port 8000
```

Startup now prints the resolved config (password never logged):

```
INFO:app:.env loaded from: .../backend/.env
INFO:app:Database target: postgresql://<user>@localhost:5432/razorcart_ai
INFO:app:Database connection: OK
```

If `Database connection: FAILED` appears, the message names the cause.

```bash
# Frontend
cd frontend
npm install
npm run dev
```

### DATABASE_URL rules

- Format: `postgresql://<user>:<password>@<host>:<port>/<database>`
- Do not omit the `/` before the database name.
  Wrong: `...@localhost:5432razorcart_ai`
  Right: `...@localhost:5432/razorcart_ai`
- Percent-encode special characters in the password:
  `@`→`%40` `:`→`%3A` `/`→`%2F` `?`→`%3F` `#`→`%23` `%`→`%25`
- `postgres://` URLs from managed hosts are accepted and normalised.

---

## 1. Database (managed PostgreSQL)

Provision Postgres on Render / Railway / Supabase / Neon / RDS, then copy the
connection string into the backend's `DATABASE_URL` environment variable.

Run migrations once against the production database:

```bash
DATABASE_URL="postgresql://..." alembic upgrade head
# optional demo catalogue:
DATABASE_URL="postgresql://..." python seed.py
```

Most managed providers require TLS. Append `?sslmode=require` if so.

---

## 2. Backend

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Root directory: `backend`. Build: `pip install -r requirements.txt`.

Environment variables to set (no `.env` file needed in production — real
environment variables take precedence):

| Variable | Value |
|---|---|
| `DATABASE_URL` | managed Postgres connection string |
| `SECRET_KEY` | 64-byte random string; auth returns 503 without it |
| `DEBUG` | `False` |
| `CORS_ORIGINS` | `https://your-frontend-domain` (comma-separated) |
| `FRONTEND_URL` | `https://your-frontend-domain` (password-reset links) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | optional; checkout runs in demo mode while unset |
| `SMTP_*` | optional; forgot-password returns 503 while unset |

`CORS_ORIGINS` accepts a comma-separated list, e.g.
`https://shop.example.com,https://www.shop.example.com`.

---

## 3. Frontend

```bash
npm ci
npm run build     # outputs dist/
```

Root directory: `frontend`. Publish directory: `frontend/dist`.

Set at **build time** (Vite inlines `VITE_*` into the bundle):

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend-domain/api` (note the `/api` suffix) |
| `VITE_RAZORPAY_KEY_ID` | public key id only (`rzp_live_...`) |

Never put `SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `SMTP_PASSWORD` or
`DATABASE_URL` in a `VITE_*` variable — they would be publicly readable.

If `VITE_API_URL` is unset, a production build falls back to the relative
path `/api` (same-origin reverse proxy), never to localhost.

Since this is a client-side SPA, configure a rewrite of all paths to
`/index.html` so deep links such as `/products` resolve.

---

## 4. Post-deploy verification

```bash
curl https://your-backend-domain/api/health
# {"status":"healthy","database":"connected", ...}

curl https://your-backend-domain/api/products
# {"total":13,"skip":0,"limit":20,"items":[...]}
```

Then open the frontend and confirm the products page renders. If it shows
"Unable to load products", check in this order:

1. `GET /api/health` — is `database` `connected`?
2. Browser devtools Network tab — is the request going to the right host?
   (verifies `VITE_API_URL` was set at build time)
3. Browser console — a CORS error means the frontend origin is missing from
   `CORS_ORIGINS`.

---

## 5. Secrets hygiene

`.env` files are gitignored (`.env`, `.env.*`, with `!.env.example`
preserved). `.venv/` and `frontend/dist/` are ignored too.

The `.env.example` files previously contained a live Razorpay key secret and
a Gmail app password. Those values have been removed, but **if they were
ever committed and pushed, they remain in the Git history and should be
rotated.**
