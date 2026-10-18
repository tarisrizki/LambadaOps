# RFC-001 — Backend Stack
**Status**: Proposed · **Date**: 2026-08-05 · **Authors**: Engineering

Konteks kode aktual (bukan README): runtime Bun ≥1.1, framework **Hono 4** (bukan NestJS — README basi), Drizzle 0.44, Neon serverless Postgres, Inngest, argon2 (`@node-rs/argon2`), jose (JWT), deploy target Vercel functions + Render.

---

## ADR-BACKEND-001: Runtime

**Context**: API harus serverless-friendly (cold start rendah), compatible dengan Drizzle + Neon + jose + argon2, dan cocok dengan monorepo Bun workspace.

**Options Considered**
1. **Bun everywhere (dev + prod)** — instan cold start di dev, workspace manager bagus. Cons: Native addons (`@node-rs/argon2`) berisiko di Bun; Render/Vercel function runtime adalah Node, jadi prod tetap lewat Node. Ekosistem Bun runtime di serverless host belum sekuat Node.
2. **Node 22 LTS everywhere** — kompatibilitas engine penuh. Cons: dev iteration lebih lambat (tapi mitigasi via `tsx --watch` / `bun run --hot`).
3. **Deno** — isolated API surface, banyak tool harus porting; overkill untuk tim kecil.

**Decision**: **Bun untuk dev + workspace manager, Node 22 LTS untuk production** (status quo, pertahankan). Build via `tsup` ke ESM, start dengan `node dist/index.js` — sudah ada di `apps/api/package.json`.

**Rationale**: argon2 native binding wajib Node ABI. Dev speed dari Bun dipertahankan, prod determinisme dari Node.

**Trade-offs**: Dua runtime berarti wajib menjalankan test di Node-compatible path (`vitest` sudah Node).

**Rollback**: N/A — ini sudah konfigurasi hari ini; risiko migrasi nol.

---

## ADR-BACKEND-002: Web Framework

**Context**: README mengklaim NestJS; kenyataannya `apps/api` murni Hono. Framework menentukan: type inference ke frontend, middleware model, dan biaya cold start.

**Options Considered**
1. **Hono** — 13kb, edge-native, RPC typing end-to-end (`AppType` → `hono/client`). Cons: ekosistem lebih kecil dari NestJS; struktur modul manual.
2. **Fastify** — cepat, plugin besar. Cons: tidak ada RPC type inference ke Next.js; tetap butuh shared types manual.
3. **NestJS** — DI mature, enterprise-familiar. Cons: heavy (decorator metadata, runtime DI), cold start lebih tinggi, **tidak terpakai** di repo ini meski tertulis di README.

**Decision**: **Hono, pertahankan.** Hapus referensi NestJS dari README.

**Rationale**: End-to-end type inference via `@lambadaops/api` workspace import oleh `apps/web` adalah keunggulan konkret: nol duplikasi skema API di frontend. Kedua, modular monolith style sudah cocok dengan skala (10 route modules, bukan 100).

**Trade-offs**: Tidak ada DI framework; services di-wire manual. Acceptable pada skala ini. Struktur dijaga via konvensi folder `routes/ → services/ → repositories/`.

**Migration Plan**: Bukan migrasi — ini dokumentasi. Update README stack table: `Backend: Hono (TypeScript) — apps/api`.

**Rollback Plan**: N/A (hanya koreksi dokumen).

---

## ADR-BACKEND-003: ORM / Query Layer

**Context**: Multi-tenant artinya *setiap* query harus filter `tenantId`. ORM harus: SQL-transparent (audit query mudah), serverless-safe (tanpa engine binary), dan typed.

**Options Considered**
1. **Drizzle ORM** — SQL-first, zero codegen binary, migration via `drizzle-kit`, cocok dengan Neon HTTP driver. Cons: API muda, beberapa helper tidak ada.
2. **Prisma** — DX bagus, tapi runtime engine (Rust binary) menambah cold start & bundle size di serverless; `prisma` CLI juga ada di node_modules tapi **tidak dipakai** di source — indikasi sisa eksperimen lama.
3. **`postgres.js` raw** — kontrol penuh, ringan. Cons: kehilangan type-safe schema dan migration tooling; risiko query tanpa `tenantId`.

**Decision**: **Drizzle ORM, pertahankan.** Hapus sisa dependency Prisma dari `apps/api/node_modules` / `package.json` bila tidak dipakai (tersisa `@prisma/client` di lockfile).

**Rationale**: Neon HTTP driver stateless sangat cocok dengan Drizzle (tanpa pooling native). `drizzle-kit push` + migration SQL sudah berjalan (14 migrations). Type inference schema menolong `zod` validation di route layer.

**Trade-offs**: Kompleksnya snake_case/camelCase mapping manual via column name args — sudah eksis dan konsisten.

**Migration Plan**: Bersih-bersih — hilangkan `@prisma/client` dari dependency manifest jika memang tidak dipakai runtime (verifikasi dengan `grep -r "prisma" apps/api/src --include="*.ts"`, hasil: hanya `node_modules`. Aman dihapus).

**Rollback Plan**: Tidak berlaku — penghapusan dead dependency.

---

## ADR-BACKEND-004: Background Jobs

**Context**: Jobs yang dibutuhkan: import Excel besar, export CSV, print job QR, notifikasi, maintenance scheduler. Harus tenant-aware dan berjalan tanpa VPS.

**Options Considered**
1. **Inngest** — event-driven, SDK bagus, retries/observability bawaan, event payload eksplisit membawa `tenantId` (sesuai kebijakan repo). Cons: vendor lock, free tier terbatas.
2. **Trigger.dev** — mirip Inngest, DX serupa. Cons: mengulang setup tanpa keuntungan nyata.
3. **BullMQ + Redis** — kontrol penuh. Cons: butuh Redis long-lived — bertentangan dengan "no VPS / full serverless". Eliminasi.

**Decision**: **Inngest, pertahankan.**

**Rationale**: Kontrak project sudah benar: semua event payload membawa `tenant_id` eksplisit (tidak bergantung pada request context). Observability bawaan (retry, dead-letter) menghapus kebutuhan monitoring infra sendiri pada fase awal.

**Trade-offs**: Biaya naik saat volume job besar; evaluasi ulang saat >100k runs/bulan.

**Rollback Plan**: Jobs adalah pure functions atas event payload; migrasi ke Cloudflare Queues atau Trigger.dev possible dengan wrapper — payload shape kekal.

---

## ADR-BACKEND-005: Auth Strategy (CRITICAL — menutup Grade D)

**Context**: Saat ini: JWT 15m, single secret, middleware hanya baca `Authorization: Bearer`, frontend simpan token di `localStorage` (XSS-exfiltratable), tidak ada refresh/logout/CSRF/rate-limit. `env.ts` sudah siapkan `JWT_REFRESH_EXPIRES_IN` tapi tidak ada `JWT_REFRESH_SECRET` dan tidak ada kode refresh-nya.

**Options Considered**
1. **Perbaiki custom JWT** — access token 15m + refresh token 7d (secret terpisah, `jti` rotation + revocation table), keduanya via **httpOnly, Secure, SameSite=Lax cookies**, double-submit CSRF token untuk mutasi, rate limit `/api/auth/*` (`hono-rate-limiter` sudah ada di dependency root).
2. **Clerk** — managed auth, session/refresh/MFA out of the box. Cons: user model pindah ke vendor (sync via webhook diperlukan), **biaya per MAU signifikan untuk B2B multi-user tenant**, integrasi tenant harus tetap custom (Clerk Organizations ≈ tenant, tapi mapping plan/subscription tetap milik kita).
3. **Auth.js v5** — library, bukan service; tetap kita yang implement RBAC + tenant. Tidak memecahkan masalah cookie/CSRF sendiri — sama dengan opsi 1 plus dependency baru.

**Decision**: **Opsi 1 — perbaiki custom JWT** (detail schema table baru di RFC-003).

**Rationale**: Auth kita tenant-coupled (`users.tenantId`, email unik per-tenant) — managed provider memindahkan sumber kebenaran users keluar dari DB, menambah kompleksitas sync, bukan menguranginya. Biaya Clerk untuk tenant B2B tiap perusahaan punya puluhan user menjadikannya tidak ekonomis. Yang hilang sekarang hanyalah *eksekusi*: refresh rotation, cookie, CSRF middleware (`csurf.middleware.ts` sudah ada — belum dipasang), rate limiter.

**Trade-offs**: Kita memelihara token lifecycle sendiri; menerima tanggung jawab keamanan penuh (revocation list, rotasi secret).

**Migration Plan** (urutan wajib):
1. `env.ts`: tambah `JWT_REFRESH_SECRET` (min 32 chars).
2. DB: tabel `refresh_tokens` (userId, jti, expiresAt, revokedAt) — RFC-003 ADR-DB-006.
3. `jwt.ts`: `generateRefreshToken`/`verifyRefreshToken` dengan jti.
4. `auth.routes.ts`: login → set 2 cookie; tambah `POST /api/auth/refresh`, `POST /api/auth/logout`.
5. `auth.middleware.ts`: baca cookie dulu, fallback Bearer (untuk API clients).
6. `index.ts`: pasang CSRF middleware pada mutasi non-webhook + `hono-rate-limiter` di auth routes; tambah header `X-CSRF-Token` di CORS allowHeaders.
7. Frontend: hapus token dari localStorage; api client pakai `credentials: 'include'`.
8. Test: isolation test untuk cookie flow + CSRF rejection.

**Rollback Plan**: Bearer header tetap didukung sebagai fallback selama 1 minor release; revert middleware order jika cookie flow mengganggu client lama.

---

## ADR-BACKEND-006: Database Provider

**Context**: Serverless Postgres dengan pooling HTTP.

**Options**: **Neon** (keep: branching dev/main berguna untuk isolasi test) vs Supabase (Postgres + Auth + Storage — sebagian sudah kita punya sendiri; overlap) vs Railway (Postgres managed murah, tanpa HTTP driver & branching).

**Decision**: **Neon, pertahankan.** Branching database adalah keunggulan nyata untuk test isolation (branch per CI run).

---

## Ringkasan Keputusan Backend

| Decision | Pilihan | Berubah dari status quo? |
|---|---|---|
| Runtime | Bun dev / Node 22 prod | Tidak (dokumentasi) |
| Framework | Hono | Dokumentasi saja (hapus klaim NestJS) |
| ORM | Drizzle | Tidak + cleanup Prisma sisa |
| Jobs | Inngest | Tidak |
| Auth | Custom JWT diperkuat | **Ya — refresh/cookie/CSRF/rate-limit** |
| DB | Neon | Tidak |

Satu-satunya kerja keras: **Auth**. Sisanya konsolidasi.
