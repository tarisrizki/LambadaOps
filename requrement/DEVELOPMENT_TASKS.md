# DEVELOPMENT_TASKS.md

> Navigation layer / execution roadmap. Dokumen ini adalah entry point utama saat coding — setiap task merujuk ke bagian spesifik dokumen lain, tidak perlu membaca ulang seluruh dokumen tiap sesi.
>
> Stack: NestJS (backend) + Next.js (frontend) + Neon Postgres + Prisma + Inngest + Cloudflare R2 — lihat `SYSTEM_ARCHITECTURE.md § 0` untuk detail.

---

## Urutan Wajib

```
Phase 0: Foundation
    ↓
Phase 1: SaaS Layer
    ↓
Phase 2: Asset Core
    ↓
Phase 3: QR Tracking
    ↓
Phase 4: Maintenance + Ticket
    ↓
Phase 5: Enterprise Layer
```

Urutan ini **tidak boleh diubah** — setiap phase bergantung pada phase sebelumnya.

---

## Phase 0 — Foundation

| Task | Dependency | Reference | Acceptance Criteria |
|---|---|---|---|
| Setup project structure (NestJS backend + Next.js frontend, repo terpisah/monorepo) | - | `SYSTEM_ARCHITECTURE.md § 1, 2, 7` | Kedua project bisa dijalankan lokal (`npm run start:dev` / `npm run dev`) |
| Setup Neon Postgres project + Prisma schema base (tenants, users, roles) | Project structure | `DATABASE_DESIGN.md § 4, 5` | `npx prisma migrate dev` jalan tanpa error |
| Implement tenant resolution middleware + Prisma Client Extension untuk tenant filter | DB migration | `SYSTEM_ARCHITECTURE.md § 3` | Query otomatis ter-filter tenant_id |
| Implement authentication (register, login dengan company_slug, logout) | Tenant middleware | `FEATURE_SPEC.md § 1` | User bisa register & login, password hashed (argon2) |
| Seed fixed roles (Owner/Admin, IT Manager, Technician, Employee) | Auth | `DATABASE_DESIGN.md § 5` | 4 role tersedia di database |
| Implement RBAC Guard (NestJS) | Roles seeded | `FEATURE_SPEC.md § 0` | Endpoint restricted sesuai permission matrix |
| Setup migration audit_logs | DB migration base | `DATABASE_DESIGN.md § 8` | Migration jalan tanpa error — dibuat lebih awal karena sudah dipakai `AssignAssetAction` sejak Phase 2 |

### Definition of Done — Phase 0
- [ ] Dua tenant berbeda dapat register & login secara independen (dengan company_slug)
- [ ] Data antar tenant terisolasi penuh (tenant A tidak bisa akses data tenant B)
- [ ] Tenant isolation test otomatis (Jest) berhasil (lihat `SYSTEM_ARCHITECTURE.md § 3.1`)
- [ ] Role-based access berfungsi sesuai permission matrix di `FEATURE_SPEC.md § 0`
- [ ] Tabel audit_logs sudah tersedia (siap dipakai modul lain sejak Phase 2)

---

## Phase 1 — SaaS Layer

| Task | Dependency | Reference | Acceptance Criteria |
|---|---|---|---|
| Migration plans, subscriptions, webhook_logs | Phase 0 | `DATABASE_DESIGN.md § 4` | Migration jalan tanpa error |
| Seed plans (Free, Pro, Business) | Migration | `PROJECT_BLUEPRINT.md § 4` | 3 plan tersedia |
| Implement trial logic saat tenant register | Plans seeded | `FEATURE_SPEC.md § 2.1` | Tenant baru dapat trial 14 hari plan Free otomatis |
| Implement payment gateway abstraction (mock driver) | - | `SYSTEM_ARCHITECTURE.md § 7.3` | Interface `PaymentGatewayInterface` + mock implementation |
| Implement webhook handler dengan idempotency check | Payment abstraction | `FEATURE_SPEC.md § 2.1`, `DATABASE_DESIGN.md § 4` | Webhook duplikat (event_id sama) tidak diproses dua kali |
| Implement plan limit enforcement (asset & user count) | Subscription aktif | `FEATURE_SPEC.md § 2.2` | Create asset/user melebihi limit ditolak dengan pesan jelas |

### Definition of Done — Phase 1
- [ ] Tenant baru otomatis dapat trial plan Free
- [ ] Upgrade plan (via mock payment) berhasil update subscription
- [ ] Webhook idempotency terverifikasi (kirim event_id sama 2x, hanya diproses sekali)
- [ ] Limit enforcement aktif dan teruji

---

## Phase 2 — Asset Core

| Task | Dependency | Reference | Acceptance Criteria |
|---|---|---|---|
| Migration asset_categories, locations, departments | Phase 1 | `DATABASE_DESIGN.md § 6` | Migration jalan tanpa error |
| Migration assets (dengan version column) | Migration master data | `DATABASE_DESIGN.md § 6` | Migration jalan tanpa error |
| Migration asset_assignments, asset_events, asset_attachments | Migration assets | `DATABASE_DESIGN.md § 6` | Migration jalan tanpa error |
| Setup Cloudflare R2 bucket + S3 client di NestJS | - | `SYSTEM_ARCHITECTURE.md § 6, 7.1` | Upload/download file ke R2 berfungsi |
| Implement Asset CRUD (create, read, update, soft delete) | Migration lengkap | `FEATURE_SPEC.md § 3` | CRUD berfungsi sesuai validation rules |
| Implement optimistic locking pada update asset | Asset CRUD | `DATABASE_DESIGN.md § 10` | Update dengan version tidak cocok ditolak |
| Implement `AssignAssetAction` (injectable service, Prisma transaction) | Asset CRUD | `SYSTEM_ARCHITECTURE.md § 4.3`, `FEATURE_SPEC.md § 5` | Assignment menulis konsisten ke 4 tabel (assignments, assets, events, audit) dalam satu transaction |
| Implement audit log recording untuk asset mutation | Asset CRUD | `FEATURE_SPEC.md § 3.2, § 9` | Setiap create/update/delete asset tercatat di audit_logs |

### Definition of Done — Phase 2
- [ ] Asset dapat dibuat, diedit, dihapus (soft delete) sesuai role permission
- [ ] Assignment individual & shared berfungsi lewat `AssignAssetAction`, riwayat tersimpan di asset_assignments
- [ ] Lifecycle timeline (asset_events) terisi otomatis untuk setiap perubahan signifikan
- [ ] Audit log tercatat untuk semua mutation asset
- [ ] File attachment tersimpan di R2, bukan local disk

---

## Phase 3 — QR Tracking

| Task | Dependency | Reference | Acceptance Criteria |
|---|---|---|---|
| Generate qr_code_token unik saat asset dibuat | Phase 2 | `DATABASE_DESIGN.md § 6`, `FEATURE_SPEC.md § 4` | Token unik, tidak sequential/tebakable |
| Implement halaman scan QR (Next.js) | QR token tersedia | `UI_STYLE_GUIDE.md § 2.5` | Scan berhasil di Chrome Android & Safari iOS |
| Implement redirect-login flow dari QR scan | Halaman scan | `FEATURE_SPEC.md § 4.1` | User belum login diarahkan ke login, kembali ke asset page setelah berhasil |
| Implement quick "Report Issue" dari halaman scan | Halaman scan | `FEATURE_SPEC.md § 4.1` | Create ticket dengan asset_id ter-prefill |
| Implement QR label print/export view | Halaman scan | `UI_STYLE_GUIDE.md § 2.3` | Admin bisa cetak QR untuk ditempel di aset fisik |

### Definition of Done — Phase 3
- [ ] QR dapat digenerate, dicetak, dan discan dari device mobile nyata
- [ ] Scan QR memerlukan login (bukan public access), dengan redirect flow yang benar
- [ ] Report issue dari scan berhasil membuat ticket dengan asset ter-link otomatis

---

## Phase 4 — Maintenance + Ticket

| Task | Dependency | Reference | Acceptance Criteria |
|---|---|---|---|
| Migration maintenance_schedules (dengan technician_id), maintenance_records | Phase 2 | `DATABASE_DESIGN.md § 7` | Migration jalan tanpa error |
| Migration tickets (dengan version), ticket_comments | Phase 2 | `DATABASE_DESIGN.md § 7` | Migration jalan tanpa error |
| Implement maintenance schedule CRUD + next_due_at calculation | Migration | `FEATURE_SPEC.md § 6` | Schedule dapat dibuat, next_due_at terhitung otomatis |
| Setup Inngest function: reminder maintenance (cron daily) | Schedule CRUD | `SYSTEM_ARCHITECTURE.md § 4.1`, `FEATURE_SPEC.md § 6.2` | Reminder muncul max 7 hari sebelum jatuh tempo, recipient sesuai technician_id atau semua IT Manager |
| Implement maintenance record + auto-update next_due_at | Schedule CRUD | `FEATURE_SPEC.md § 6.1` | next_due_at terupdate otomatis setelah record dibuat |
| Implement ticket CRUD + status workflow | Migration ticket | `FEATURE_SPEC.md § 7` | Status transition sesuai flow (open→assigned→in_progress→resolved→closed) |
| Implement optimistic locking pada ticket update | Ticket CRUD | `DATABASE_DESIGN.md § 10` | Update dengan version tidak cocok ditolak |
| Implement ticket comment | Ticket CRUD | `FEATURE_SPEC.md § 7.1` | Comment tersimpan dan tampil kronologis |
| Implement notification table + polling endpoint | Migration notifications | `SYSTEM_ARCHITECTURE.md § 5`, `FEATURE_SPEC.md § 8` | GET /api/notifications/unread berfungsi, di-polling frontend tiap 30-60s |
| Setup Inngest function: warranty expiry reminder (cron daily) | Phase 2 (assets) | `SYSTEM_ARCHITECTURE.md § 4.1` | Notification muncul untuk asset dengan warranty_end mendekati (30 hari) |

### Definition of Done — Phase 4
- [ ] Maintenance schedule + reminder (via Inngest) berfungsi end-to-end
- [ ] Ticket lifecycle lengkap berfungsi sesuai role permission
- [ ] Notification (in-app, polling) berfungsi untuk ticket assigned, maintenance due, warranty expiring

---

## Phase 5 — Enterprise Layer

| Task | Dependency | Reference | Acceptance Criteria |
|---|---|---|---|
| Verifikasi audit log coverage lintas semua modul | Semua CRUD selesai (Phase 0-4) | `FEATURE_SPEC.md § 9` | Audit log lengkap untuk asset, ticket, subscription, user — tabel migration sudah dibuat sejak Phase 0 |
| Migration import_jobs, import_errors | Phase 2 | `DATABASE_DESIGN.md § 8` | Migration jalan tanpa error |
| Implement Excel upload + column mapping UI (Next.js) | Migration import | `FEATURE_SPEC.md § 10`, `UI_STYLE_GUIDE.md` | User bisa upload & mapping kolom |
| Setup Inngest function: process Excel import (row-level validation) | Upload UI | `SYSTEM_ARCHITECTURE.md § 4.1`, `FEATURE_SPEC.md § 10` | Baris valid diproses, baris gagal tercatat dengan alasan spesifik |
| Setup Inngest function: generate CSV export | Phase 2 (assets) | `SYSTEM_ARCHITECTURE.md § 4.1`, `FEATURE_SPEC.md § 11` | Export hanya data tenant terkait, kolom konsisten dengan listing, hasil disimpan di R2 |

### Definition of Done — Phase 5
- [ ] Audit log lengkap dan tidak bisa diedit/dihapus (append-only)
- [ ] Excel import berhasil memproses file besar secara async (Inngest), error report jelas per baris
- [ ] CSV export berfungsi dan hanya berisi data tenant yang benar

---

## Deployment Checklist (Sebelum Demo Portfolio)

- [ ] Frontend live di Vercel (Next.js)
- [ ] Backend live di Render (NestJS container)
- [ ] Database Neon production branch terpisah dari development branch
- [ ] Environment variables lengkap sesuai `SYSTEM_ARCHITECTURE.md § 7.1`
- [ ] Inngest function terdaftar dan cron berjalan di environment production
- [ ] R2 bucket production terpisah dari development (opsional untuk MVP, boleh sama)

---

## Non-Goals (Berlaku untuk Seluruh Roadmap)

- Estimasi jam/hari per task tidak dicantumkan di sini (project management terpisah, di luar dokumen ini)
- Tidak ada detail implementasi kode spesifik — merujuk ke `FEATURE_SPEC.md`/`DATABASE_DESIGN.md`/`SYSTEM_ARCHITECTURE.md` untuk itu
- Tidak ada task untuk fitur di luar MVP (lihat Non-Goals di masing-masing dokumen sumber)
- Tidak ada task setup VPS/Docker Compose penuh — seluruh infrastruktur managed/serverless
