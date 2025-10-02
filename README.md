# FastAPI Auth API

A production-ready FastAPI backend with JWT auth, robust password hashing (Argon2 primary, bcrypt fallback), SQL database support, and interactive API docs at /docs. Built for serverless deployment on Vercel.

## Features

- FastAPI with automatic OpenAPI schema and Swagger UI at /docs.
- JWT authentication with secure password hashing and strict validation.
- Argon2 primary hashing to avoid bcrypt’s 72‑byte limit; bcrypt fallback with manual truncation.
- SQL database via SQLAlchemy/SQLModel; works with managed Postgres (Neon, Supabase, Railway).
- Serverless-ready configuration and CORS setup for modern frontends.

## Tech Stack

- Python 3.10+, FastAPI, Pydantic
- SQLAlchemy/SQLModel + Postgres
- passlib + argon2-cffi (primary) and bcrypt (fallback)
- Uvicorn for local development

## Quick Start

Prerequisites:
- Python 3.10+ installed
- A Postgres DATABASE_URL (Neon/Supabase/Railway recommended)

Setup:
1. Clone the repo and create a virtual environment.
2. Install dependencies:
   - pip install -r requirements.txt
3. Set environment variables:
   - DATABASE_URL
   - SECRET_KEY
   - CORS_ORIGINS (comma-separated, e.g., https://your-frontend.vercel.app,http://localhost:3000)
4. Run locally:
   - uvicorn app.main:app --reload
   - Open http://localhost:8000/docs

## Environment Variables

- DATABASE_URL: Postgres connection string (e.g., postgresql+psycopg://user:pass@host/db)
- SECRET_KEY: JWT signing key (use a strong random value)
- CORS_ORIGINS: Comma-separated list of allowed origins

## Password Hashing

- Primary: Argon2 via passlib for robust hashing without bcrypt’s 72‑byte constraint.
- Fallback: bcrypt with explicit 72‑byte truncation in both hash and verify paths.
- Validation: Enforce password length (e.g., 8–64 chars) at the schema layer.

Rationale: Prevents runtime errors from long inputs and avoids backend compatibility issues.

## API Endpoints (Auth)

- POST /auth/register: Create user with validated password, hashed securely.
- POST /auth/login: Verify password and return JWT access token.
- GET /users/me: Retrieve current user using Authorization: Bearer <token>.

Full request/response models are documented in /docs.

## Project Structure (example)

- app/main.py — FastAPI app, middleware (CORS), router includes
- app/routers/auth.py — register/login endpoints
- app/models.py — SQLAlchemy/SQLModel models
- app/schemas.py — Pydantic schemas and validations
- app/core/security.py — CryptContext, hash/verify helpers (argon2 primary, bcrypt fallback)
- api/index.py — Vercel entrypoint exporting the FastAPI app
- vercel.json — Vercel function/runtime routing config
- requirements.txt — pinned dependencies

## Local Development

- Create DB/migrations (Alembic recommended) or auto-create tables at startup if configured.
- Start server: uvicorn app.main:app --reload
- Run tests: pytest

## Deployment (Vercel)

1. Ensure api/index.py exports your FastAPI app, e.g.:
   - from app.main import app as app
2. vercel.json example:
   - {
     "functions": { "api/index.py": { "runtime": "python3.10" } },
     "routes": [{ "src": "/(.*)", "dest": "/api/index.py" }]
     }
3. Set env vars in Vercel Project Settings:
   - DATABASE_URL, SECRET_KEY, CORS_ORIGINS
4. Use a managed Postgres (do not rely on local files in serverless).
5. Deploy:
   - vercel (preview)
   - vercel --prod (production)

Post-deploy checks:
- Open /docs on the Vercel URL
- Register a user (12–32 char password)
- Login and call /users/me with the Bearer token

## Security Notes

- Prefer Argon2 as primary scheme; retain bcrypt for legacy compatibility (with 72‑byte truncation).
- Validate inputs (email format, password length), and consider rate limiting auth routes.
- Configure CORS to only trusted origins and serve over HTTPS.

## Troubleshooting

- If register/login returns 500:
  - Check hashing configuration (Argon2 installed; bcrypt pinned).
  - Ensure password length validation and 72‑byte truncation for bcrypt fallback.
- If 401 on login:
  - Verify hashing verify() path mirrors the hash truncation.
  - Confirm JWT SECRET_KEY and algorithm match in creation and validation.

## Roadmap

- Refresh tokens and revocation
- Email verification and password reset flows
- CI via GitHub Actions (tests, lint, type-check)
- Structured logging and metrics

## License

MIT
