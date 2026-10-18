# RFC-004 — System Architecture
**Status**: Proposed · **Date**: 2026-08-05 · **Authors**: Engineering

Kode aktual: monorepo Turborepo dengan `apps/api` (Hono) + `apps/web` (Next.js 16), shared packages, deploy Vercel + Render.

---

## ADR-SYSTEM-001: Deployment Target

**Context**: Serverless-first, global deployment (APAC priority), cost-efficient at scale, enterprise security.

**Options Considered**
1. **Vercel** — edge-native, serverless functions, zero-config Next.js. Cons: vendor lock, cold start, regional deployment limited.
2. **Cloudflare Pages + Workers** — edge-native, global deployment, D1 database. Cons: Next.js tidak native support; ekosistem lebih kecil.
3. **Render** — full-stack serverless, regional deployment, database managed. Cons: cold start lebih tinggi dari Vercel.

**Decision**: **Vercel (frontend) + Render (backend)** — status quo, pertahankan.

**Rationale**: Vercel sudah optimal untuk Next.js; Render lebih stabil untuk Hono + Drizzle. Cloudflare Pages tidak cocok untuk Next.js.

**Trade-offs**: Vendor lock-in (Vercel/Render); edge deployment terbatas (Render tidak support edge functions).

---

## ADR-SYSTEM-002: Multi-Tenancy Pattern

**Context**: Shared DB vs schema-per-tenant vs database-per-tenant.

**Options Considered**
1. **Shared DB + row-level tenant isolation** — status quo. Cons: satu bug di repository = cross-tenant data leak.
2. **Schema-per-tenant** — schema PostgreSQL terpisah per tenant. Cons: migrasi kompleks, biaya operasional tinggi.
3. **Database-per-tenant** — database PostgreSQL terpisah per tenant. Cons: biaya operasional sangat tinggi.

**Decision**: **Shared DB + row-level tenant isolation, pertahankan.**

**Rationale**: Untuk B2B SaaS <100k tenants, shared DB dengan tenantId filter di aplikasi sudah cukup. Schema-per-tenant tidak memberikan keuntungan nyata untuk skala ini.

**Trade-offs**: Keamanan bergantung pada aplikasi layer (repository pattern).

---

## ADR-SYSTEM-003: Cache Strategy

**Context**: TanStack Query di frontend; backend perlu cache?

**Options Considered**
1. **Redis** — in-memory cache, low-latency. Cons: biaya operasional, cold start, tidak serverless-friendly.
2. **Neon read replicas** — serverless-friendly, tetapi Neon HTTP driver tidak support read replicas.
3. **In-memory cache di Hono** — `hono/cache` middleware. Cons: tidak scalable, tidak persistent.

**Decision**: **In-memory cache di Hono untuk reference data (categories, locations, departments)** — status quo, pertahankan.

**Rationale**: Data reference tidak berubah sering; TanStack Query di frontend sudah cukup untuk server state.

**Trade-offs**: Cache invalidation manual (via TanStack Query invalidation).

---

## ADR-SYSTEM-004: Observability

**Context**: Logging, metrics, tracing.

**Options Considered**
1. **Structured JSON logs** — `pino` atau `winston`. Cons: tidak native support di Vercel/Render.
2. **Sentry** — error tracking, performance monitoring. Cons: biaya operasional.
3. **OpenTelemetry** — standard observability. Cons: konfigurasi kompleks.

**Decision**: **Structured JSON logs (pino) + Sentry untuk error tracking** — status quo, pertahankan.

**Rationale**: Sentry sudah cukup untuk error tracking; pino untuk logging.

**Trade-offs**: Tidak ada tracing.

---

## ADR-SYSTEM-005: CI/CD

**Context**: GitHub Actions vs Render/Cloudflare CI.

**Options Considered**
1. **GitHub Actions** — status quo. Cons: vendor lock-in.
2. **Render CI** — native integration. Cons: tidak fleksibel.
3. **Cloudflare Pages CI** — native integration. Cons: tidak fleksibel.

**Decision**: **GitHub Actions, pertahankan.**

**Rationale**: GitHub Actions sudah cukup untuk kebutuhan saat ini.

**Trade-offs**: Vendor lock-in.

---

## ADR-SYSTEM-006: Network Architecture

**Context**: API gateway, rate limiting, CORS.

**Options Considered**
1. **Cloudflare API Gateway** — edge-native, rate limiting. Cons: biaya operasional.
2. **Hono middleware** — `hono-rate-limiter`. Cons: tidak edge-native.
3. **Render API Gateway** — native integration. Cons: tidak fleksibel.

**Decision**: **Hono middleware (hono-rate-limiter) + Cloudflare CDN untuk static assets** — status quo, pertahankan.

**Rationale**: Hono middleware sudah cukup untuk kebutuhan saat ini; Cloudflare CDN untuk static assets.

**Trade-offs**: Tidak ada API gateway.

---

## ADR-SYSTEM-007: Security Architecture

**Context**: Zero trust network, tenant isolation, secrets management, DDoS protection, WAF.

**Options Considered**
1. **Cloudflare Zero Trust** — edge-native, DDoS protection, WAF. Cons: biaya operasional.
2. **Render security** — native integration. Cons: tidak fleksibel.
3. **Vercel security** — native integration. Cons: tidak fleksibel.

**Decision**: **Cloudflare Zero Trust untuk DDoS protection dan WAF** — status quo, pertahankan.

**Rationale**: Cloudflare Zero Trust sudah cukup untuk kebutuhan saat ini.

**Trade-offs**: Biaya operasional.

---

## ADR-SYSTEM-008: Cost Modeling

**Context**: Cost-efficient at scale.

**Options Considered**
1. **Vercel + Render** — status quo. Cons: biaya operasional.
2. **Cloudflare Pages + Workers** — edge-native, global deployment. Cons: tidak native support Next.js.
3. **AWS Lambda + API Gateway** — scalable, but not serverless-friendly.

**Decision**: **Vercel + Render, pertahankan.**

**Rationale**: Vercel + Render sudah cukup untuk kebutuhan saat ini.

**Trade-offs**: Biaya operasional.

---

## Ringkasan Keputusan System

| Decision | Pilihan | Berubah? |
|---|---|---|
| Deployment | Vercel (frontend) + Render (backend) | Tidak |
| Multi-Tenancy | Shared DB + row-level tenant isolation | Tidak |
| Cache | In-memory cache di Hono | Tidak |
| Observability | Structured JSON logs (pino) + Sentry | Tidak |
| CI/CD | GitHub Actions | Tidak |
| Network | Hono middleware (hono-rate-limiter) + Cloudflare CDN | Tidak |
| Security | Cloudflare Zero Trust | Tidak |
| Cost | Vercel + Render | Tidak |

Seperti RFC-001 dan RFC-002: hanya **auth** yang berubah; sisanya penegasan konvensi yang sudah ada di ARCHITECTURE_GUIDE.
