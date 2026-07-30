# MIGRATION_PLAN.md — NestJS/Prisma/Render → Hono/Drizzle/Vercel

> **Status:** APPROVED — Planning phase. Tidak ada kode ditulis di dokumen ini.
> **Baseline:** ADR-000 (Serverless-first) dan ADR-001 (Hono + Drizzle + Vercel) — APPROVED, tidak dibuka ulang kecuali diminta eksplisit.
> **Referensi:** ADR-002 (Multi-Tenant Isolation) — di-scope-kan ulang di § 7 (Final Review) dokumen ini.

---

## 1. What Will Be Removed

### 1.1 Packages Removed (`apps/api`)

```
@nestjs/common
@nestjs/core
@nestjs/platform-express
@nestjs/config
@nestjs/jwt
@nestjs/passport
@nestjs/cli
@nestjs/schematics
@nestjs/testing
@prisma/client
prisma
class-validator
class-transformer
passport
passport-jwt
reflect-metadata
rxjs
supertest
ts-node
```

### 1.2 Files/Folders Deleted (`apps/api`)

```
apps/api/src/                      → full rewrite, semua module NestJS dihapus
apps/api/prisma/                   → schema.prisma, migrations/, seed.ts dihapus
apps/api/nest-cli.json
apps/api/tsconfig.build.json
apps/api/src/common/guards/*.guard.ts          (jwt-auth.guard.ts, roles.guard.ts)
apps/api/src/common/decorators/*.decorator.ts  (roles.decorator.ts, current-user.decorator.ts)
apps/api/src/common/interceptors/audit-log.interceptor.ts
apps/api/src/common/filters/http-exception.filter.ts
apps/api/src/common/pipes/validation.pipe.ts
apps/api/src/prisma/prisma.module.ts
apps/api/src/prisma/prisma.service.ts
```

**Yang TIDAK dihapus** (masih valid, dipindah lokasi — lihat § 2):
```
TenantContext logic (konsep AsyncLocalStorage — diimplementasi ulang, bukan dihapus)
Struktur module per domain (tenant, user, billing, asset, maintenance, ticket, notification, audit, import-export) — tetap 9 domain yang sama
```

### 1.3 Documents That Must Be Updated

| Dokumen | Status Update |
|---|---|
| `SYSTEM_ARCHITECTURE.md` | Update § 0-2 (stack table, module structure) — ganti referensi NestJS/Prisma/Redis-queue-note ke Hono/Drizzle |
| `DEVELOPMENT_TASKS.md` | Task 0.2 diganti total. Task lain disesuaikan bahasa implementasi (bukan scope) |
| `implementation_plan.md` | Superseded oleh dokumen ini untuk § 0, § 3, § 4, § 6. § 9 (testing) dan § 10 (Phase 0 breakdown) direvisi di § 5 dokumen ini |
| `PROJECT_BLUEPRINT.md` | Update § 5 Architecture Snapshot — 1 baris ganti nama stack |
| `DATABASE_DESIGN.md` | **Tidak berubah** — schema tetap sama, hanya dieksekusi lewat Drizzle bukan Prisma |
| `FEATURE_SPEC.md` | **Tidak berubah** — behavior/business rules stack-agnostic |
| `UI_STYLE_GUIDE.md` | **Tidak berubah** — frontend tetap Next.js |
| ADR-001 | Status: PROPOSED → **APPROVED** (update header) |
| ADR-002 | Status: PROPOSED → **PARTIALLY APPROVED** — lihat § 7 untuk scope final |

---

## 2. Old → New Mapping

| Lama (NestJS/Prisma) | Baru (Hono/Drizzle) | Catatan |
|---|---|---|
| NestJS Module | Hono Router (`app.route('/assets', assetsRouter)`) | 1:1 per domain, struktur folder tetap 9 domain yang sama |
| NestJS Controller | Hono route handler function | Digabung dengan router file, tidak perlu file terpisah |
| NestJS Service (injected via DI) | Plain class, manual constructor injection | Instance dibuat sekali per module load (module-scope singleton) |
| NestJS Guard (`JwtAuthGuard`, `RolesGuard`) | Hono Middleware (`requireAuth`, `requireRole(...roles)`) | Middleware chain eksplisit di setiap route, bukan decorator global |
| `@Roles()` decorator | `requireRole('owner_admin', 'it_manager')` sebagai middleware call | Sama-sama declarative, beda syntax |
| `PrismaService` (global module) | `db` export dari `src/db/index.ts` (Drizzle instance) | Tidak lagi diinject via DI container — diimport langsung, tapi **hanya di repository layer** (lihat § 7) |
| Prisma Client Extension (`$extends()`) | Repository pattern + `TenantContext.get()` di base repository | Lihat § 7 untuk detail keamanan |
| `class-validator` + DTO decorator | Zod schema + `@hono/zod-validator` middleware | Validasi di route level, schema didefinisikan sekali dipakai untuk request + type inference |
| Passport JWT strategy | `jose` library — manual JWT verify di middleware | Lebih ringan, tanpa strategy pattern Passport |
| `argon2` (Node native binding) | `@node-rs/argon2` | Tetap dipakai — kompatibel dengan Vercel Node.js runtime (bukan Edge runtime, jadi native binding tetap jalan) |
| `@nestjs/config` + Zod validation | Manual Zod schema di `packages/config`, load via `process.env` | Sama prinsipnya, tanpa NestJS DI wrapper |
| `@nestjs/testing` (module bootstrap) | `app.request()` — Hono testing helper, tanpa bootstrap | Test jauh lebih cepat (tidak build DI graph) |
| Prisma migration (`prisma migrate dev/deploy`) | Drizzle Kit (`drizzle-kit generate` + `drizzle-kit migrate`) | Schema didefinisikan sebagai TypeScript, bukan DSL terpisah |
| `DATABASE_URL` (Neon pooler, TCP) | `DATABASE_URL` (Neon HTTP endpoint) | Connection string beda format — HTTP bukan TCP |
| Render Web Service | Vercel Functions (`apps/api` sebagai Vercel project terpisah) | Serverless function per route group, bukan persistent container |
| `refresh_tokens` table + DB lookup | **Tetap sama** — tabel dan logic rotation tidak berubah | Tidak terpengaruh migrasi framework |
| Inngest, Cloudflare R2 | **Tidak berubah** | Sudah serverless-native sejak awal |

---

## 3. Repository Structure (Final)

```
LambadaOps/
├── apps/
│   ├── web/                        → Next.js App Router (TIDAK BERUBAH dari implementation_plan.md § 5)
│   │
│   └── api/                        → Hono, deploy sebagai Vercel Functions
│       ├── src/
│       │   ├── index.ts             → Entry point, compose semua router, export untuk Vercel handler
│       │   ├── db/
│       │   │   ├── index.ts          → `db` instance (drizzle-orm/neon-http), TIDAK diexport ke routes/services
│       │   │   └── schema/           → Drizzle table definitions, satu file per domain
│       │   │       ├── tenant.schema.ts
│       │   │       ├── user.schema.ts
│       │   │       ├── billing.schema.ts
│       │   │       ├── asset.schema.ts
│       │   │       ├── maintenance.schema.ts
│       │   │       ├── ticket.schema.ts
│       │   │       ├── notification.schema.ts
│       │   │       ├── audit.schema.ts
│       │   │       └── import-export.schema.ts
│       │   ├── repositories/         → SATU-SATUNYA layer yang mengakses `db` langsung
│       │   │   ├── base.repository.ts        → TenantRepository abstract class
│       │   │   ├── global.repository.ts      → GlobalRepository (untuk tenants/roles/plans/webhook_logs)
│       │   │   ├── asset.repository.ts
│       │   │   ├── user.repository.ts
│       │   │   └── ... (satu per model utama)
│       │   ├── services/             → Business logic, import repositories (bukan db)
│       │   │   ├── asset.service.ts
│       │   │   ├── assign-asset.action.ts     → AssignAssetAction, tetap 1 transaction
│       │   │   └── ...
│       │   ├── routes/               → Hono router per domain, import services (bukan db/repositories)
│       │   │   ├── assets.ts
│       │   │   ├── tickets.ts
│       │   │   ├── auth.ts
│       │   │   └── ... (9 domain)
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts         → requireAuth (verify JWT via jose)
│       │   │   ├── role.middleware.ts         → requireRole(...roles)
│       │   │   └── tenant-context.middleware.ts → set TenantContext per request
│       │   ├── lib/
│       │   │   ├── tenant-context.ts           → AsyncLocalStorage wrapper
│       │   │   ├── jwt.ts                      → sign/verify helper (jose)
│       │   │   └── errors.ts                   → typed error classes
│       │   ├── schemas/               → Zod schema untuk request validation (per domain)
│       │   │   ├── asset.schema.ts
│       │   │   └── ...
│       │   └── inngest/               → Inngest functions (reminder, import, export)
│       │       ├── client.ts
│       │       └── functions/
│       ├── drizzle/
│       │   └── migrations/            → Generated oleh drizzle-kit
│       ├── drizzle.config.ts
│       ├── vercel.json                → Vercel Functions config
│       └── package.json
│
├── packages/
│   ├── types/                       → Domain types (interface) yang tidak auto-inferred dari Hono client
│   │                                    Scope MENGECIL — API request/response type sekarang inferred via `hono/client`,
│   │                                    packages/types isi: enum, domain constants shared, non-API types
│   └── config/                       → Zod env validation schema, shared technical config (TIDAK BERUBAH konsepnya)
│
├── .env.example
├── bun.lockb
├── bunfig.toml
├── package.json
└── turbo.json
```

### Kenapa Setiap Package Ada

| Path | Alasan |
|---|---|
| `apps/api/src/db/` | Isolasi definisi schema + koneksi Drizzle — satu-satunya tempat yang tahu detail koneksi database |
| `apps/api/src/repositories/` | Structural enforcement tenant isolation (lihat § 7) — layer wajib sebelum data menyentuh business logic |
| `apps/api/src/services/` | Business logic murni, tidak tahu HTTP maupun SQL — testable tanpa mock database, cukup mock repository |
| `apps/api/src/routes/` | HTTP layer tipis — parsing request, panggil service, return response. Tidak ada logic di sini |
| `apps/api/src/schemas/` | Zod schema dipakai dua kali: validasi request DAN sumber type inference — single source of truth per endpoint |
| `packages/types/` | Tetap ada untuk domain types yang dipakai lintas app tapi bukan bagian dari API contract (misal: shared enum status) |
| `packages/config/` | Tidak berubah — env validation tetap perlu dipakai backend dan (sebagian) frontend |

---

## 4. Development Workflow

### 4.1 Membuat Route/Endpoint Baru

```
1. Definisikan Zod schema di src/schemas/<domain>.schema.ts
   → export const createAssetSchema = z.object({ name: z.string(), ... })

2. Buat/tambah method di repository (src/repositories/<domain>.repository.ts)
   → method mengembalikan data, tenant filter otomatis dari this.tenantId

3. Buat/tambah method di service (src/services/<domain>.service.ts)
   → panggil repository, terapkan business rule (validation, limit check, dsb)

4. Tambah route handler di src/routes/<domain>.ts
   → validate request via @hono/zod-validator(createAssetSchema)
   → requireAuth, requireRole(...) sesuai permission matrix di FEATURE_SPEC.md
   → panggil service, return c.json(result)

5. Route otomatis ter-compose di src/index.ts via app.route('/assets', assetsRouter)
```

### 4.2 Membuat/Mengubah Schema Database

```
1. Edit file di src/db/schema/<domain>.schema.ts (Drizzle table definition, TypeScript)
2. Jalankan: bun run db:generate
   → drizzle-kit generate — membuat file migration SQL baru di drizzle/migrations/
3. Review file migration yang dihasilkan (selalu review sebelum apply)
4. Jalankan: bun run db:migrate
   → drizzle-kit migrate — apply ke Neon development branch
5. Commit migration file bersama perubahan schema
```

### 4.3 Generate Types (Frontend ↔ Backend)

```
Tidak ada langkah generate manual untuk API types.

apps/api/src/index.ts:
  export type AppType = typeof app   ← inferred otomatis dari semua route

apps/web/lib/api/client.ts:
  import type { AppType } from '@lambadaops/api-types' (re-export dari apps/api)
  const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!)
  → client.assets.$get() sudah fully typed tanpa langkah build terpisah

Domain types non-API (enum, shared constants) → tetap manual di packages/types
```

### 4.4 Testing

```
Unit test (service layer):
  → mock repository (bukan mock db) → test business logic murni
  → file: services/<domain>.service.test.ts

Integration test (route layer):
  → app.request('/api/assets', { method: 'GET', headers: {...} })
  → tidak ada bootstrap module — test langsung jalan ke Hono app instance
  → file: routes/<domain>.route.test.ts

Tenant isolation test (wajib per domain baru):
  → buat tenant A & B, assert tenant B tidak bisa akses resource tenant A
  → file: test/tenant-isolation/<domain>.isolation.test.ts

Runner: Vitest (menggantikan Jest — lebih cepat, native ESM, cocok dengan Hono ecosystem)
```

### 4.5 Deployment

```
Frontend (apps/web):
  git push → Vercel auto-deploy (project terpisah, root directory: apps/web)

Backend (apps/api):
  git push → Vercel auto-deploy (project terpisah, root directory: apps/api)
  → drizzle migration TIDAK auto-run saat deploy (safety) — dijalankan manual/CI step terpisah:
    bun run db:migrate:prod (menggunakan DIRECT connection ke Neon main branch)

Database:
  Neon main branch = production
  Neon dev branch = development (dipakai saat `bun run dev`)

Environment variables:
  Dikonfigurasi terpisah di masing-masing Vercel project (web & api) melalui Vercel dashboard
```

---

## 5. Implementation Order (Revised Roadmap)

> Prinsip: **reuse semua yang masih kompatibel**. Task 0.1, 0.3, 0.9, 0.10 dari `implementation_plan.md` tetap valid — hanya disesuaikan bahasa implementasi minor. Task 0.2, 0.4, 0.5, 0.6, 0.7 diganti signifikan.

| Task | Status | Perubahan |
|---|---|---|
| **Task 0.1 — Monorepo Init** | ✅ Reuse | Tidak berubah — Bun workspace tetap sama |
| **Task 0.2 — Backend Init** | ❌ **REPLACED** | NestJS init → **Hono init**. Lihat § 5.1 |
| **Task 0.3 — Next.js Init** | ✅ Reuse | Tidak berubah |
| **Task 0.4 — Database Setup** | 🔄 **REVISED** | Prisma+Neon pooler → **Drizzle + Neon HTTP**. Lihat § 5.2 |
| **Task 0.5 — Tenant Foundation** | 🔄 **REVISED** | Ditambah: repository pattern setup. RLS **tidak** masuk Phase 0 (lihat § 7) |
| **Task 0.6 — Auth Foundation** | 🔄 **REVISED** | Passport JWT → jose. Logic tetap sama (company_slug login, argon2, refresh token rotation) |
| **Task 0.7 — RBAC Foundation** | 🔄 **REVISED** | NestJS Guard → Hono middleware. Permission matrix (`FEATURE_SPEC.md § 0`) tidak berubah |
| **Task 0.8 — Tenant Isolation Test** | ✅ Reuse (scope sama) | Test tetap wajib sebagai phase gate, hanya tooling test berubah (Vitest + `app.request()`) |
| **Task 0.9 — Audit Logs Table** | ✅ Reuse | Schema sama, dieksekusi via Drizzle migration bukan Prisma |
| **Task 0.10 — Env Config** | 🔄 Minor revision | Tetap Zod validation, hilangkan referensi `@nestjs/config` |

### 5.1 Task 0.2 (Replaced) — Hono Project Initialization

**Acceptance Criteria:**
- [ ] `apps/api` berisi project Hono valid, bisa dijalankan `bun run dev` lokal
- [ ] `vercel.json` sudah dikonfigurasi untuk deploy sebagai Vercel Functions
- [ ] Struktur folder `src/routes/`, `src/services/`, `src/repositories/`, `src/db/`, `src/middleware/`, `src/schemas/`, `src/inngest/` sudah dibuat
- [ ] `src/index.ts` sebagai entry point, meng-compose router kosong (placeholder), export `AppType`
- [ ] ESLint dikonfigurasi dengan rule `no-restricted-imports` untuk `src/db` (lihat § 7)

### 5.2 Task 0.4 (Revised) — Neon + Drizzle Setup

**Acceptance Criteria:**
- [ ] Neon project dengan dua branch: `main` (production) dan `dev` (development) — **tidak berubah dari sebelumnya**
- [ ] `drizzle.config.ts` dikonfigurasi dengan dialect `postgresql`, driver HTTP
- [ ] `src/db/index.ts` — `db` instance menggunakan `drizzle-orm/neon-http` + `@neondatabase/serverless`
- [ ] `bun run db:generate` dan `bun run db:migrate` berhasil jalan ke Neon dev branch (schema masih kosong)
- [ ] `DATABASE_URL` di `.env` menggunakan Neon **HTTP endpoint** (bukan pooler TCP connection string lama)

### 5.3 Task Phase 1-5

**Tidak ada perubahan scope.** Semua acceptance criteria di `DEVELOPMENT_TASKS.md` Phase 1-5 tetap berlaku — hanya referensi implementasi (misal "Migration X via Prisma" → "via Drizzle Kit", "NestJS Guard" → "Hono middleware") yang perlu disesuaikan saat eksekusi, tidak mengubah definition of done.

---

## 6. Dead Code Audit

### 6.1 Obsolete Packages (Wajib Dihapus dari `package.json`)

Sudah dilist lengkap di § 1.1. Checklist verifikasi setelah migrasi:
```bash
grep -r "@nestjs" apps/api/package.json     # harus 0 hasil
grep -r "prisma" apps/api/package.json      # harus 0 hasil
grep -r "passport" apps/api/package.json    # harus 0 hasil
```

### 6.2 Obsolete Documents

| Dokumen | Tindakan |
|---|---|
| `implementation_plan.md` § 0, § 3, § 4, § 6 | Ditandai **SUPERSEDED BY MIGRATION_PLAN.md**, jangan dihapus (histori keputusan), tapi beri header jelas agar tidak jadi sumber kebingungan |
| ADR-001 | Update status: PROPOSED → APPROVED |
| ADR-002 | Update status: PROPOSED → PARTIALLY APPROVED, scope direvisi (lihat § 7) |
| `technical-specification.md` (draft lama) | Sudah di-bypass sebelumnya — tetap di-bypass, tidak relevan untuk audit ini |

### 6.3 Obsolete Scripts

```
package.json root — hapus/ganti:
  "dev:api": "bun --cwd apps/api run start:dev"   → ganti ke Hono dev command
  "migrate": referensi ke "npx prisma migrate"     → ganti ke "bun run db:migrate" (drizzle-kit)
  "seed": referensi ke "npx prisma db seed"        → ganti ke drizzle seed script (tooling beda, isi seed sama: roles + plans)
```

### 6.4 Obsolete TODOs

Tidak ada TODO tercatat di dokumen sebelumnya yang spesifik NestJS/Prisma implementation detail — karena implementasi belum dimulai (masih planning phase), tidak ada TODO in-code yang perlu diaudit. Item ini otomatis clear.

### 6.5 Obsolete Configs

```
apps/api/nest-cli.json              → dihapus
apps/api/tsconfig.build.json        → dihapus, diganti tsup config (build tool baru untuk Hono)
prisma schema config di package.json → dihapus
```

### 6.6 Obsolete Environment Variables

| Variable Lama | Status | Pengganti |
|---|---|---|
| `DATABASE_URL` (Neon pooler TCP format) | Diganti formatnya | `DATABASE_URL` (Neon HTTP endpoint format) — nama variable sama, **isi/format berbeda**, perlu update di semua `.env` |
| `DIRECT_DATABASE_URL` | Tetap ada | Dipakai untuk `drizzle-kit migrate` (perlu direct connection untuk DDL), bukan lagi untuk `prisma migrate deploy` |
| — | Baru ditambah | `JWT_SECRET` tetap ada (dipakai `jose`, bukan `@nestjs/jwt`) — tidak ada perubahan nama, hanya library konsumsi berbeda |

**Tidak ada environment variable baru yang murni spesifik NestJS/Prisma untuk dihapus** — sebagian besar env var (`INNGEST_EVENT_KEY`, `R2_ACCOUNT_ID`, dst) sudah generic dan tetap dipakai apa adanya.

---

## 7. Final Review

### 7.1 Konsistensi Antar Dokumen

| Cek | Status |
|---|---|
| ADR-001 vs constraint ADR-000 baru | ✅ Konsisten — Vercel Functions untuk backend dan frontend, tidak ada persistent server |
| `DATABASE_DESIGN.md` vs Drizzle schema | ✅ Konsisten — tidak ada perubahan tabel/kolom, hanya tooling |
| `FEATURE_SPEC.md` vs implementasi baru | ✅ Konsisten — semua business rule stack-agnostic, tidak terpengaruh |
| `DEVELOPMENT_TASKS.md` Phase 1-5 vs migration plan ini | ✅ Konsisten — acceptance criteria tidak berubah, hanya cara eksekusi |

### 7.2 Resolusi ADR-002 (Titik yang Perlu Diputuskan Eksplisit)

ADR-002 mengusulkan **tiga layer defense**: TenantContext + Repository Pattern + PostgreSQL Row-Level Security (RLS). Saya perlu jujur soal ini sebelum implementasi dimulai:

- **Layer 1 (TenantContext)** dan **Layer 2 (Repository Pattern + ESLint rule)** — **disetujui masuk Phase 0**. Ini analisis yang solid, menutup celah nyata (raw query bypass, unconstrained client), dan effort implementasinya wajar untuk portofolio — bukan penambahan besar dari desain yang sudah ada, hanya menstrukturkan layer yang memang perlu ada.

- **Layer 3 (PostgreSQL RLS + `app_user` role + `set_config` per-transaction wrapper)** — **saya sarankan DITUNDA ke Phase 1, bukan Phase 0**, sama seperti draft asli ADR-002 sendiri sebenarnya sudah mengusulkan (lihat tabel implementation scope di ADR-002: RLS ditandai "Phase 1", bukan Phase 0 blocker). Alasan: RLS menambah kompleksitas debugging nyata di awal (query yang "diam-diam" mengembalikan empty result karena RLS, bukan karena bug logic, itu sumber kebingungan umum saat development), dan `FEATURE_SPEC.md`/`DEVELOPMENT_TASKS.md` yang sudah di-lock tidak pernah mensyaratkan level proteksi database ini untuk Definition of Done Phase 0. Layer 1+2 saja sudah memberi proteksi yang jauh lebih kuat dari Prisma `$extends()` yang sebelumnya jadi baseline — menambah RLS di Phase 0 adalah over-delivery terhadap requirement yang sudah disepakati, bukan kebutuhan minimum.

**Keputusan final saya untuk dokumen ini:** ADR-002 status menjadi **PARTIALLY APPROVED** — Layer 1+2 masuk Task 0.5 (Phase 0), Layer 3 (RLS) dipindah eksplisit sebagai task terpisah di awal Phase 1, ditandai sebagai *enhancement* bukan *blocker*. Kalau kamu ingin RLS tetap masuk Phase 0, itu keputusan produk yang perlu kamu konfirmasi eksplisit — sama seperti pola sebelumnya, saya tidak akan mengasumsikan sendiri.

### 7.3 Dead Code — Verifikasi

Tidak ada dead code tersisa berdasarkan audit § 6, karena implementasi kode NestJS/Prisma sebelumnya **belum pernah ditulis** (masih planning phase sesuai catatan di `implementation_plan.md` dan ADR-001). Audit ini bersifat preventif untuk memastikan saat implementasi dimulai, tidak ada package/file yang tertinggal dari asumsi arsitektur lama.

### 7.4 Kontradiksi yang Sudah Diselesaikan

Kontradiksi cold-start Render (15-30 detik dianggap "acceptable") vs NestJS-di-Vercel (500ms-2 detik dianggap "unacceptable") yang saya angkat sebelumnya **tidak lagi relevan** — karena keputusan sekarang bukan lagi soal cold start NestJS vs Hono, melainkan keputusan produk eksplisit "no persistent server sama sekali". Render sudah keluar dari pertimbangan bukan karena argumen cold start, tapi karena melanggar constraint baru "No Render Web Service" secara langsung. Ini menyelesaikan inkonsistensi tersebut secara bersih.

---

## Ringkasan Status

| Item | Status |
|---|---|
| ADR-000 (Serverless-first) | ✅ APPROVED (keputusan produk final) |
| ADR-001 (Hono + Drizzle + Vercel) | ✅ APPROVED |
| ADR-002 Layer 1 (TenantContext) | ✅ APPROVED — Phase 0 |
| ADR-002 Layer 2 (Repository Pattern) | ✅ APPROVED — Phase 0 |
| ADR-002 Layer 3 (PostgreSQL RLS) | ⏸️ APPROVED tapi **dipindah ke Phase 1** — perlu konfirmasi jika ingin tetap di Phase 0 |
| Dead code | ✅ Clear (belum ada kode ditulis) |
| Dokumentasi lain (DATABASE_DESIGN, FEATURE_SPEC, UI_STYLE_GUIDE) | ✅ Tidak berubah, tetap valid |

**Siap untuk mulai implementasi Task 0.1 → 0.2 (Hono init) → 0.4 (Drizzle+Neon) → 0.5 (Tenant Foundation, Layer 1+2) → 0.6 → 0.7 → 0.8 (gate).**
