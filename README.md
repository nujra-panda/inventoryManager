# InventoryManager — FastAPI Backend

A FastAPI backend for inventory management with JWT auth, robust password hashing (Argon2 primary, bcrypt fallback), SQL database support, and interactive API docs at /docs. The static frontend (index.html, login.html, JS/CSS) lives under /static and can be deployed on Netlify, while the API and database run on Railway.

## Features

- FastAPI with OpenAPI and Swagger UI at /docs.
- JWT authentication with secure password hashing and strict validation (8–64 chars).
- Argon2 primary hashing to avoid bcrypt’s 72‑byte limit; bcrypt fallback with 72‑byte truncation in hash/verify.
- SQL database via SQLAlchemy/SQLModel with managed Postgres (Railway/Neon/Supabase).
- Simple static frontend served from /static for quick testing; production deploy via Netlify.

## Project Structure

.
├─ alembic/ # Database migrations
├─ app/
│ ├─ core/
│ │ └─ security.py # CryptContext + hash/verify (argon2 primary, bcrypt fallback)
│ ├─ db/
│ │ ├─ base.py # Session/engine setup
│ │ └─ models.py # SQLAlchemy/SQLModel models
│ ├─ routers/
│ │ ├─ auth.py # /auth/register, /auth/login
│ │ └─ products.py # Product CRUD routes
│ ├─ schemas/
│ │ ├─ product.py # Product Pydantic schemas
│ │ └─ user.py # User Pydantic schemas (validation: 8–64 char passwords)
│ ├─ services/
│ │ └─ inventory.py # Inventory service logic
│ └─ main.py # FastAPI app, router include, CORS, static mount
├─ static/
│ ├─ _redirects # SPA routing for Netlify (optional)
│ ├─ favicon.png
│ ├─ index.html # Dashboard/UI
│ ├─ login.html # Login page
│ ├─ login.js # Login flow (calls /auth/login)
│ ├─ script.js # App logic (calls product APIs)
│ └─ style.css
├─ .env # Local dev env vars (do not commit)
├─ netlify.toml # Netlify config for static site
├─ render.yaml # (Optional) Render config if used previously
├─ requirements.txt # Pinned Python deps
├─ runtime.txt # Python runtime hint (e.g., python-3.10.x)


## Tech Stack

- Python 3.10+, FastAPI, Pydantic
- SQLAlchemy/SQLModel + Postgres
- passlib + argon2-cffi (primary) and bcrypt (fallback)
- Uvicorn for local dev
- Netlify (static frontend), Railway (API + Postgres)

## Quick Start (Local)

Prerequisites:
- Python 3.10+
- Postgres instance (Docker or managed)
- Create a .env with DATABASE_URL, SECRET_KEY, CORS_ORIGINS

Install and run:
1. python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
2. pip install -r requirements.txt
3. Export env (or use a .env loader):
   - DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname
   - SECRET_KEY=replace_with_strong_random_value
   - CORS_ORIGINS=http://localhost:3000,http://localhost:5500
4. Run server:
   - uvicorn app.main:app --reload
5. Open Swagger UI: http://localhost:8000/docs

## Environment Variables

- DATABASE_URL: Postgres connection string
- SECRET_KEY: JWT signing key (strong random value)
- CORS_ORIGINS: Comma‑separated allowed origins for the frontend

## Password Hashing Hardening

- Primary: Argon2 via passlib (recommended).
- Fallback: bcrypt with explicit 72‑byte truncation in both hash and verify.
- Validation: Enforce password length 8–64 chars at schema level to avoid oversized inputs and improve performance.

## API Endpoints

- POST /auth/register — Create user with validated password, securely hashed.
- POST /auth/login — Verify password and return JWT access token.
- GET /users/me — Return current user with Authorization: Bearer <token>.
- Products API (typical):
  - GET /products
  - POST /products
  - PUT /products/{id}
  - DELETE /products/{id}

See full details in /docs.

## Local Development Workflow

- Apply migrations (Alembic) or enable auto‑create on startup (dev only).
- Run: uvicorn app.main:app --reload
- Open /docs to test endpoints.
- Use the static pages in /static for quick UI testing by serving them locally (e.g., simple http server) and pointing API base URL to http://localhost:8000.

## Deploy — Railway (API + Postgres)

1. Create a Railway project and add:
   - A Service from your GitHub repo (select this repo).
   - A Postgres plugin (or link external Postgres).
2. Set environment variables in Railway service:
   - DATABASE_URL (Railway will provide if using its Postgres)
   - SECRET_KEY
   - CORS_ORIGINS (include your Netlify URL and local dev origins)
3. Configure start command (via Railway UI or config) to run:
   - uvicorn app.main:app --host 0.0.0.0 --port $PORT
4. Commit and push; Railway will build and deploy automatically.
5. Generate a domain in the Networking tab and verify:
   - <railway-domain>/docs renders Swagger
   - Register/login flow returns 201/200 respectively

Tips:
- Pin passlib and bcrypt in requirements.txt (e.g., passlib==1.7.4, bcrypt==4.0.1 or 4.1.2).
- Keep argon2-cffi installed for primary hashing.

## Deploy — Netlify (Static Frontend)

Option A: Deploy the /static folder as the site
- In Netlify UI, “Add new site” → “Import from Git”.
- Build command: none
- Publish directory: static
- Add a _redirects file (already present) for SPA routing if needed.
- Set environment variables for the frontend if it reads an API base URL from a config or inline script (alternatively, hardcode the Railway API base URL in login.js/script.js).

Option B: Separate frontend repo
- Move static assets to a dedicated frontend repo.
- In Netlify, set environment variables like VITE_API_URL pointing to the Railway API.
- Rebuild and deploy.

CORS:
- Ensure CORS_ORIGINS includes your Netlify URL (e.g., https://your-site.netlify.app).

## Example Config Snippets

CORS in app.main:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
CORSMiddleware,
allow_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()],
allow_credentials=True,
allow_methods=[""],
allow_headers=[""],
)


CryptContext in app/core/security.py:

from passlib.context import CryptContext

pwd_context = CryptContext(
schemes=["argon2", "bcrypt"],
deprecated="auto",
)

Bcrypt truncation (fallback safe-guard):

def _truncate72_bytes(s: str) -> bytes:
b = s.encode("utf-8")
return b[:72]

def hash_password(plain: str) -> str:
try:
return pwd_context.hash(plain) # argon2 path
except Exception:
return pwd_context.hash(_truncate72_bytes(plain)) # bcrypt path

def verify_password(plain: str, hashed: str) -> bool:
try:
return pwd_context.verify(plain, hashed)
except Exception:
return pwd_context.verify(_truncate72_bytes(plain), hashed)

## Testing Checklist

- /docs loads on Railway domain.
- POST /auth/register with a 12–32 char password returns 201.
- POST /auth/login returns 200 and a JWT.
- From Netlify site:
  - Login form hits Railway API and stores token
  - Product CRUD calls succeed with Authorization header

## Troubleshooting

- 500 on register/login:
  - Verify argon2-cffi installed and passlib/bcrypt pinned.
  - Ensure schema validation limits password length.
  - Confirm DB reachable and migrations applied.
- 401 on login:
  - Ensure verify() mirrors any truncation logic.
  - Check SECRET_KEY consistency and token algorithm.
- CORS errors:
  - Add Netlify site URL to CORS_ORIGINS and redeploy.

## Roadmap

- Refresh tokens, password reset, email verification
- Role-based access control for inventory operations
- CI/CD (GitHub Actions) for tests, lint, type-check

## License

MIT
