# LambadaOps

IT Asset Tracking & Operations Management SaaS — multi-tenant, modular monolith.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) — `apps/api` |
| Frontend | Next.js App Router — `apps/web` |
| Database | Neon Postgres (serverless) + Prisma |
| Auth | JWT + argon2 + httpOnly cookies |
| Background Jobs | Inngest |
| Storage | Cloudflare R2 |
| Deploy | Vercel (web) + Render (api) |

## Prerequisites

- [Bun](https://bun.sh) >= 1.1
- Node.js 20 LTS (for production builds / Prisma CLI)
- A [Neon](https://neon.tech) project with `dev` and `main` branches
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket
- An [Inngest](https://www.inngest.com) account (for background jobs)

## Local Development Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd LambadaOps
bun install
```

### 2. Configure environment variables

```bash
# Copy the example and fill in your values
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# Edit apps/api/.env  — fill in DATABASE_URL, DIRECT_DATABASE_URL, JWT_SECRET, etc.
# Edit apps/web/.env.local — set NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Run Prisma migration (development)

```bash
# From repo root — delegates to `npx prisma migrate dev` inside apps/api
bun run migrate
```

### 4. Seed the database

```bash
# Seeds roles (owner_admin, it_manager, technician, employee) and plans (Free, Pro, Business)
bun run seed
```

### 5. Start development servers

```bash
# Frontend only (http://localhost:4000 by default)
bun run dev:web

# Backend only (http://localhost:3000 by default)
bun run dev:api
```

## Key Commands

| Command | Description |
|---|---|
| `bun install` | Install all workspace dependencies |
| `bun run dev:web` | Start Next.js dev server |
| `bun run dev:api` | Start NestJS dev server |
| `bun run migrate` | Run Prisma migrate dev (development) |
| `bun run generate` | Run Prisma generate (after schema changes) |
| `bun run seed` | Seed database with roles and plans |
| `bun run test` | Run backend unit + integration tests |
| `bun run test:isolation` | Run tenant isolation tests (Phase 0 gate) |
| `bun run lint` | Lint all workspaces |

## Project Structure

```
LambadaOps/
├── apps/
│   ├── web/          → Next.js App Router (frontend)
│   └── api/          → NestJS backend (modular monolith)
├── packages/
│   ├── types/        → Shared TypeScript types
│   └── config/       → Shared technical configuration (env validation)
├── .env.example      → Environment variable template
├── package.json      → Bun workspace root
└── tsconfig.base.json → Shared TypeScript base config
```

## Architecture Notes

- **Multi-tenancy:** Shared database with `tenant_id` column on all business tables. Resolved from JWT — never from request body.
- **API communication:** All `apps/web` → `apps/api` calls go through typed API client in `lib/api/`. Next.js Server Actions are not used as a REST API replacement.
- **Background jobs:** Inngest (not Redis). All async jobs receive `tenant_id` explicitly in event payload.
- **Storage:** Cloudflare R2 only. No local persistent disk in production.
- **Notifications:** Polling-based (30–60s interval). No WebSocket/SSE.

See `requrement/` for full locked architecture documents.
