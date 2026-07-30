# SYSTEM_ARCHITECTURE.md

> Single source of truth untuk: bagaimana sistem dibangun.
> Untuk skema database → lihat `DATABASE_DESIGN.md`.
> Untuk behavior fitur → lihat `FEATURE_SPEC.md`.
> Untuk UI → lihat `UI_STYLE_GUIDE.md`.

---

## 0. Stack Revision Notice

Stack telah direvisi dari draft awal (Laravel/SvelteKit/Docker Compose) berdasarkan final architecture review dengan constraint: tanpa VPS, deployment serverless/managed platform, solo developer, portfolio yang harus terlihat production-grade. Keputusan final:

| Layer | Teknologi |
|---|---|
| Backend | NestJS (TypeScript) |
| Frontend | Next.js (App Router) |
| Database | Neon Postgres (serverless) |
| ORM | Prisma |
| Auth | Custom — NestJS + Passport + JWT, password hashing argon2 |
| Queue/Background Job | Inngest |
| Storage | Cloudflare R2 (S3-compatible) |
| Deployment | Vercel (frontend) + Render (backend, container) |

`DATABASE_DESIGN.md` dan `FEATURE_SPEC.md` tidak berubah — skema dan business rules di sana stack-agnostic, dieksekusi lewat Prisma/NestJS alih-alih Eloquent/Laravel.

---

## 1. System Overview

Produk: **IT Asset Tracking & Operations Management SaaS**, multi-tenant, modular monolith.

```
Browser (Web + Mobile PWA)
        │
        ▼
   Next.js App Router (Frontend)
        │  HTTP/REST (JSON)
        ▼
   NestJS API (Backend)
        │
   ┌────┴────────────┬─────────────┐
   ▼                  ▼             ▼
Neon Postgres      Inngest      Cloudflare R2
(primary data)   (background)    (file storage)
```

- Frontend dan backend terpisah, dua deployment unit berbeda (Vercel & Render), berkomunikasi via REST API JSON.
- Tidak ada server-side rendering coupling antara Next.js dan NestJS di luar pemanggilan API biasa.

---

## 2. Architecture Pattern: Modular Monolith

Satu aplikasi NestJS, dipecah menjadi module dengan tanggung jawab jelas menggunakan dependency injection container native NestJS. Bukan microservices — semua module berjalan dalam satu deployment unit, berbagi satu database.

```
src/modules/
├── tenant/         → tenant lifecycle, tenant context resolution
├── user/            → authentication, RBAC, user profile
├── billing/          → plans, subscriptions, webhook handling
├── asset/           → asset CRUD, category, location, department, assignment, lifecycle events
├── maintenance/     → maintenance schedule & record
├── ticket/           → IT support ticketing
├── notification/     → in-app notification generation & delivery
├── audit/           → audit log recording
└── import-export/    → Excel import, CSV export (bukan analytics/reporting dashboard)
```

### 2.1 Module Responsibility

| Module | Bertanggung jawab atas |
|---|---|
| tenant | Membuat tenant baru, resolve tenant context per-request, tenant status |
| user | Login/logout (dengan tenant identifier), password reset, fixed RBAC role assignment |
| billing | Plan, subscription, trial, plan-limit enforcement, webhook payment |
| asset | Asset CRUD, category/location/department, assignment (individual/shared), QR token, lifecycle event |
| maintenance | Jadwal maintenance, reminder generation, riwayat maintenance |
| ticket | Ticket lifecycle (open → closed), comment |
| notification | Membuat notification record, endpoint polling |
| audit | Mencatat semua mutation penting lintas modul |
| import-export | Excel import (dengan validasi row-level), CSV export |

### 2.2 Cross-Module Rule

- Module **tidak boleh** langsung mengakses Prisma model milik module lain. Komunikasi antar module melalui **injected Service class** milik module pemilik data (contoh: `TicketService` yang perlu data Asset meng-inject `AssetService`, bukan query langsung ke tabel `assets`).
- Semua mutation pada entity `assets` **wajib** melalui service layer module Asset (lihat § 4.3).

---

## 3. Tenant Isolation Strategy

**Model:** Shared database, kolom `tenant_id` di semua tabel bisnis.

### 3.1 Mekanisme

1. **Guard/Middleware `TenantResolutionMiddleware`** — jalan di setiap authenticated request, resolve tenant dari user yang login (JWT payload berisi `tenant_id`), set ke request-scoped `TenantContext` (menggunakan NestJS `REQUEST`-scoped provider atau `AsyncLocalStorage`).
2. **Prisma Middleware/Client Extension** — semua query Prisma pada model bertenant otomatis di-filter `WHERE tenant_id = current_tenant` lewat Prisma Client Extension yang membaca `TenantContext`.
3. **Background Job Tenant Propagation** — job Inngest **tidak boleh** bergantung pada `TenantContext` dari HTTP request (job jalan di proses terpisah, tanpa request context). Setiap Inngest function wajib menerima `tenant_id` secara eksplisit sebagai bagian dari event payload, dan function wajib men-set `TenantContext` di awal eksekusi sebelum query apapun.
4. **Tenant Isolation Test** — wajib ada automated test (Jest) untuk setiap module baru: buat 2 tenant, pastikan tenant A tidak bisa membaca/menulis data tenant B (lihat Definition of Done per phase di `DEVELOPMENT_TASKS.md`).

### 3.2 Non-negotiable Rules

- Tidak ada raw query yang skip tenant filter tanpa alasan eksplisit dan comment.
- Tidak ada endpoint yang menerima `tenant_id` dari client (selalu resolve dari JWT/auth context, tidak pernah dari request body/query param).

---

## 4. Background Job Architecture (Inngest)

**Kenapa Inngest, bukan Redis+Queue:** Redis+worker process memerlukan proses yang harus selalu hidup — bertentangan dengan constraint "tanpa VPS". Inngest event-driven dan serverless-native: function di-trigger oleh event atau cron, dieksekusi sebagai HTTP call ke endpoint NestJS yang terdaftar sebagai Inngest handler, tanpa perlu infrastruktur worker terpisah.

### 4.1 Job/Function yang Wajib Async (lewat Inngest)

| Function | Trigger | Alasan |
|---|---|---|
| `generateMaintenanceReminder` | Cron (daily, dijadwalkan di Inngest) | Batch processing, tidak boleh blocking request |
| `generateWarrantyReminder` | Cron (daily) | Sama seperti di atas |
| `processExcelImport` | Event: `import.file.uploaded` | File besar, tidak boleh blocking HTTP request |
| `generateCsvExport` | Event: `export.requested` | Bisa berjalan lama untuk data besar |

### 4.2 Operasi yang TIDAK perlu Inngest (synchronous)

- Semua operasi CRUD standar (asset create, ticket update, dsb) — synchronous request/response biasa di NestJS.
- Notification untuk event tunggal langsung (contoh: ticket di-assign) — cukup insert langsung di service yang sama, tidak perlu lewat Inngest (lihat § 5).

### 4.3 Service Layer Wajib (Asset Assignment)

Semua perubahan assignment asset **wajib** melalui `AssignAssetAction` (injectable service di module Asset, dipanggil dari controller, bukan mutasi langsung ke Prisma dari controller). Urutan operasi wajib di dalam action ini, dibungkus satu Prisma transaction:

```
1. Validate tenant context
2. Create record baru di asset_assignments (history)
3. Update current state di assets (assigned_user_id / department_id / assignment_type)
4. Create record di asset_events (lifecycle timeline)
5. Create record di audit_logs
```

Detail skema tabel terkait → lihat `DATABASE_DESIGN.md § Asset`.

---

## 5. Notification Architecture

**Mekanisme: Polling. Bukan WebSocket, bukan SSE.**

```
Trigger event (ticket assigned, maintenance due, warranty expiring)
        │
        ▼
Create record di tabel `notifications` (source of truth)
        │
        ▼
Frontend polling: GET /api/notifications/unread
Interval: 30-60 detik
```

- Pembuatan notification record boleh **synchronous** (event langsung dalam request-response, contoh: ticket di-assign → langsung insert 1 row notification di service yang sama) **atau asynchronous lewat Inngest** (untuk proses batch/terjadwal, contoh: reminder maintenance & warranty — lihat § 4.1). Aturan sederhana: kalau notifikasi dipicu oleh scheduled job yang memproses banyak data sekaligus, wajib lewat Inngest; kalau dipicu oleh satu aksi user tunggal, cukup synchronous.
- **Delivery ke frontend murni via polling**, terlepas dari apakah pembuatan record-nya sync atau async.
- Real-time notification (WebSocket/SSE) eksplisit **di luar MVP** — lihat Non-Goals.

---

## 6. Deployment Topology

```
Frontend:  Next.js App Router  → deploy Vercel (serverless, free tier)
Backend:   NestJS (container)  → deploy Render (background worker/cron native, plan-based pricing predictable)
Database:  Neon Postgres        → serverless, pooled connection, branching
Job:       Inngest Cloud         → event/cron-driven, tanpa worker process terpisah
Storage:   Cloudflare R2          → S3-compatible, zero egress fee
```

- Storage: **wajib** menggunakan R2 sejak awal (bukan local disk) — konsisten dengan model serverless (container Render tidak menjamin persistent local filesystem antar deploy).
- Tidak ada Docker Compose lokal untuk seluruh stack (karena dependency utama adalah managed service), tapi NestJS tetap bisa dijalankan lokal dengan `npm run start:dev` terhubung ke Neon branch development.

---

## 7. Environment & Configuration

### 7.1 Required Environment Variables (minimum)

**Backend (NestJS, di Render):**
```
NODE_ENV=production
PORT=3000

DATABASE_URL=            # Neon Postgres pooled connection string
DIRECT_DATABASE_URL=     # Neon direct connection (untuk migration)

JWT_SECRET=
JWT_EXPIRES_IN=

INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

PAYMENT_GATEWAY_DRIVER=mock   # abstraction: mock untuk MVP, ganti ke midtrans/xendit nanti
```

**Frontend (Next.js, di Vercel):**
```
NEXT_PUBLIC_API_URL=      # URL backend NestJS di Render
```

### 7.2 Local Development Setup

```bash
# Backend
cd backend
npm install
npx prisma migrate dev        # jalan ke Neon development branch
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### 7.3 Payment Gateway Abstraction

Payment gateway diimplementasikan sebagai interface (`PaymentGatewayInterface`) dengan driver `mock` untuk MVP development — tidak wajib integrasi Midtrans/Xendit nyata untuk menyelesaikan MVP. Driver nyata adalah implementasi tambahan yang plug-in ke interface yang sama.

---

## 8. Non-Goals

Tidak termasuk dalam arsitektur MVP:

- WebSocket / Server-Sent Events untuk notification
- Microservices — tetap modular monolith
- Multi-region / multi-database sharding
- VPS / self-managed server dalam bentuk apapun
- Redis sebagai queue infrastructure (digantikan Inngest)
- Real payment gateway integration wajib (cukup abstraction + mock driver)
- Schema-per-tenant atau database-per-tenant
