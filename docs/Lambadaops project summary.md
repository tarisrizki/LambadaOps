# LambadaOps — Project Handoff Summary

> Dokumen ini merangkum seluruh keputusan produk, arsitektur, dan status pengerjaan project LambadaOps sampai titik ini. Dibuat untuk di-transfer ke AI/tool lain agar konteks tidak hilang.

---

## 1. Apa Ini

**LambadaOps** = IT Asset Management (ITAM) SaaS multi-tenant untuk melacak aset hardware (laptop, printer, dll), assignment ke karyawan, maintenance, dan tiket IT terkait aset.

**PENTING — Konteks proyek:** Ini adalah **project portofolio/demo**, BUKAN produk komersial yang akan dijual. Tujuannya menunjukkan kemampuan engineering ke recruiter/klien, bukan bersaing dengan Snipe-IT/GLPI/Freshservice secara nyata. Semua keputusan scope harus dikalibrasi ke tujuan ini — hindari over-engineering, hindari fitur enterprise yang tidak menambah nilai demo.

---

## 2. Tech Stack (Final — sudah dimigrasi)

Stack sempat berubah dua kali. Versi **final/current**:

| Layer | Teknologi |
|---|---|
| Backend | **Hono** (bukan NestJS — sudah di-deprecate) |
| ORM | **Drizzle** + `drizzle-orm/neon-http` (bukan Prisma — sudah di-deprecate) |
| Database | Neon Postgres (serverless, HTTP driver, bukan TCP pooler) |
| Frontend | Next.js 15 App Router, shadcn/ui, TanStack Query, TanStack Table |
| Auth | Custom — `jose` untuk JWT (bukan Passport), `@node-rs/argon2` untuk password hash |
| Validasi | Zod + `@hono/zod-validator` |
| Storage | Cloudflare R2 (S3-compatible) |
| Background job | Inngest (status dipertanyakan ulang — lihat § 7 Open Questions) |
| Testing | Vitest (bukan Jest), Playwright untuk E2E |
| Package manager | Bun (workspace monorepo) |
| Deployment (rencana) | Vercel untuk `apps/web` DAN `apps/api` (dua project terpisah, keduanya serverless functions — Render sudah dieliminasi) |

**Struktur monorepo:**
```
LambadaOps/
├── apps/
│   ├── web/        → Next.js
│   └── api/        → Hono, src/{routes,services,repositories,db/schema,middleware,schemas,inngest}
├── packages/
│   ├── types/      → shared enum/types non-API
│   └── config/     → Zod env validation
```

**Prinsip arsitektur kunci (LOCKED):**
- Tenant isolation: shared DB + kolom `tenant_id`, TenantContext (AsyncLocalStorage) + Repository Pattern sebagai dua layer wajib. PostgreSQL RLS (layer ketiga) sengaja **ditunda ke Phase 1**, bukan blocker Phase 0.
- Layer akses DB: HANYA `repositories/` yang boleh import `db` langsung. `services/` panggil repository, `routes/` panggil service. Di-enforce lewat ESLint `no-restricted-imports`.
- Semua mutasi assignment aset WAJIB lewat `AssignAssetAction` — satu transaction yang menulis konsisten ke `asset_assignments`, `assets`, `asset_events`, `audit_logs`.
- Type safety end-to-end: `hono/client` — tidak ada generate manual, tipe API terinfer otomatis dari route Hono ke frontend.

---

## 3. Skema Database (Ringkas — Full di DATABASE_DESIGN.md, LOCKED)

Tabel-tabel utama:
- **SaaS/Billing:** `plans`, `tenants`, `subscriptions`, `webhook_logs` (idempotency guard dengan `unique(provider, event_id)`)
- **Identity:** `users` (email unique **per tenant**, bukan global — lihat § 6 soal ini), `roles` (fixed, global/seeded — Owner/Admin, IT Manager, Technician, Employee)
- **Asset Core:** `asset_categories`, `locations`, `departments`, `assets` (current state, ada kolom `version` untuk optimistic locking), `asset_assignments` (history), `asset_events` (lifecycle timeline), `asset_attachments`
- **Identity/QR (Task 2.11, SUDAH SELESAI diimplementasi):** `asset_identities`, `identity_print_jobs`, `identity_scans` — pakai Signed UUID + HMAC, bukan sequential token
- **Operations:** `maintenance_schedules`, `maintenance_records`, `tickets` (juga ada `version` untuk optimistic locking), `ticket_comments`
- **Enterprise:** `notifications`, `audit_logs`, `import_jobs`, `import_errors`

Rules penting:
- `assets` = current state saja (tidak simpan histori)
- `asset_assignments` = source of truth histori assignment
- `asset_events` = lifecycle timeline untuk UI
- `audit_logs` = system-level mutation log, append-only, hanya Owner/Admin yang bisa lihat
- Soft delete di `users` dan `assets`, dengan snapshot nama (`actor_name_snapshot`) supaya histori tetap valid meski user dihapus

---

## 4. Product Blueprint (Ringkas)

**Vision:** ITAM tercepat & paling intuitif untuk SMB, tanpa bloat.

**Target market MVP:** SMB 50-500 karyawan (hipotesis, belum divalidasi riset pasar — perlu ditandai sebagai asumsi, bukan fakta).

**Positioning:** Lebih cepat & modern dari Snipe-IT (UI dated) dan lebih ringan dari ManageEngine/Freshservice (bloated, enterprise-heavy).

**Product boundaries — TIDAK AKAN dibangun:**
- MDM (remote wipe/lock)
- Network scanning/device discovery otomatis
- General helpdesk (tiket HARUS selalu terikat ke asset_id, bukan tiket umum "email saya rusak")
- HR/Payroll/CRM/ERP

**RBAC — 4 role fixed (tidak ada custom role builder):**
| Role | Kewenangan kunci |
|---|---|
| Owner/Admin | Semua akses termasuk billing, user management, audit log |
| IT Manager | CRUD asset, assign, maintenance — TIDAK bisa billing/user management |
| Technician | Handle assigned ticket/maintenance, lihat asset yang di-assign ke dia |
| Employee | Lihat aset miliknya sendiri, buat/lihat tiket miliknya |

---

## 5. Keputusan Login & Register (Sudah Divalidasi)

**Login:** email + password sederhana.

**Register — dua konsep yang harus dipisah, jangan digabung:**
1. **Registrasi organisasi/tenant baru** (self-serve, standar B2B SaaS seperti Notion/Slack) — yang daftar otomatis jadi Owner pertama. Ini WAJAR dan dipertahankan.
2. **Registrasi user individual di dalam tenant yang sudah ada** — TIDAK ADA halaman publik untuk ini. User lain (Technician, Employee) dibuat via Invite/Create User oleh Owner/IT Manager dari dalam aplikasi. Pola ini dikonfirmasi standar industri (Snipe-IT, dkk pakai admin-provisioning, bukan self-register untuk user internal).

Skema saat ini: `email unique per tenant` (bukan global). Ini SUDAH diputuskan dipertahankan (tidak jadi migrasi ke global-email) — versi awal blueprint sempat merekomendasikan global-email tapi itu **ditolak** setelah direview karena tidak sesuai konteks portofolio (effort migrasi tidak sepadan dengan value demo).

---

## 6. Hasil Validasi Fitur MVP (Per Modul — FINAL, sudah disepakati)

| Fitur | Keputusan | Detail |
|---|---|---|
| **Asset Assignment** | Improve | Ganti istilah UI dari "Assignment" → **"Check Out / Check In"** (lebih dikenal di industri ITAM). Tambah target ketiga: **Location** (selain User & Department) — untuk aset bersama seperti proyektor ruang meeting. Implementasi: cukup tambah `location_id` sederhana, JANGAN bikin relasi polymorphic. |
| **QR Tracking** | Keep (Differentiator utama) | Signed UUID + HMAC, sudah selesai diimplementasi (Task 2.11). Ini nilai jual terkuat untuk demo — JANGAN diganti jadi barcode biasa. |
| **Maintenance** | Keep, manual only | Cukup log manual (ubah status ke Repair + catat record). TOLAK scheduler/cron reminder otomatis untuk MVP. |
| **Ticketing** | Keep, scope ketat | WAJIB selalu terikat ke `asset_id`. Jangan jadi helpdesk umum. |
| **Dashboard** | **Improve — PRIORITAS TINGGI** | Saat ini FAKE (hardcoded static data di `features/dashboard/api/client.ts`). Harus diganti data real. Cukup: 3 metric cards (Total Assets, Broken/Repair, Active Tickets) + 1 activity feed (recent check-outs). Jangan bikin BI dashboard executive. |
| **Import Excel** | **Improve — PRIORITAS TINGGI** | Flow Upload → Preview → Validate → Commit valid rows → Download error CSV **WAJIB dipertahankan penuh** (ini talking point kuat untuk demo). Yang disederhanakan HANYA UI column-mapping-nya → jadi auto-match otomatis, bukan drag-drop manual. JANGAN downgrade jadi "upload sekali jalan tanpa preview" (ini kesalahan yang pernah direkomendasikan lalu dikoreksi). |
| **Audit Log** | Keep, sederhana | Tabel read-only kronologis: timestamp, actor_id, action, target_id. Tanpa filter lanjutan/analytics. |
| **Notification** | Keep sistem yang sudah ada | Polling `GET /api/notifications/unread` tiap 30-60 detik + dropdown bell icon, record tersimpan permanen (read_at, bukan delete). Toast (Sonner) BOLEH ditambah sebagai pelengkap UX instan, TAPI BUKAN pengganti sistem polling. (Ini pernah salah diinterpretasikan sebagai "ganti total ke toast" — sudah dikoreksi.) |
| **RBAC** | Keep | 4 role fixed seperti di § 4. Tolak custom role builder. |

**Yang SENGAJA tidak dikerjakan (out of scope demo):**
- Employee ≠ User (holder abstraction untuk vendor/magang tanpa akun)
- Asset polymorphism / Asset Model hierarchy
- Multi-identifier asset (IMEI/MAC/hostname selain serial number)
- Formal state machine untuk lifecycle asset
- Multi-workspace switching, SSO, MSP workflow
- Depreciation, Webhooks, API Keys, Custom RBAC

---

## 7. Open Questions (BELUM DIPUTUSKAN — perlu keputusan user)

### 7.1 Billing/Subscription & Background Jobs (Inngest)
Modul Billing (`plans`, `subscriptions`, trial 14 hari, webhook idempotency) **sudah pernah diimplementasikan** di histori kerja sebelumnya (sebelum migrasi stack). Pertanyaan: apakah ini masih masuk prioritas demo, atau dibiarkan ada tapi tidak dikembangkan lebih jauh?

**Rekomendasi yang sedang dipertimbangkan (belum final):**
- Billing/Subscription: pertahankan kode yang sudah ada, TIDAK perlu dikembangkan UI baru — nilai demo rendah untuk tool internal seperti ITAM.
- Background Jobs (Inngest): karena maintenance reminder & warranty reminder sudah ditolak untuk MVP (§ 6, manual only), satu-satunya use case Inngest tersisa adalah async Excel import/export. Dipertimbangkan untuk diproses **synchronous saja** untuk demo (file kecil, tidak perlu infra job terpisah) — TAPI kode Inngest yang sudah ada jangan dihapus, cukup tidak dipakai dulu.

**Env var terkait (JANGAN dihapus sampai keputusan ini final):** `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `PAYMENT_GATEWAY_DRIVER`.

### 7.2 File `bruno-setup.ts` (apps/api)
Hasil audit dependency (`depcheck`) menemukan file ini memanggil `bcryptjs` dan `jsonwebtoken` yang **TIDAK terinstall** di `package.json` — berarti file ini akan crash kalau dijalankan. Kedua package itu juga bukan yang dipakai stack saat ini (stack pakai `@node-rs/argon2` + `jose`). Perlu diputuskan: file ini masih dipakai (untuk Bruno API testing collection) dan perlu diperbaiki dependency-nya, atau memang sisa kode usang yang harus dihapus.

### 7.3 Halaman `apps/web/.../(dashboard)/assignments/*`
Ditemukan oleh Knip sebagai "unreferenced/incomplete". Ambigu: apakah ini fondasi yang memang belum selesai dibangun (akan diisi saat kerja improvement Assignment di § 6), atau kode usang. Perlu direview sebelum dihapus — JANGAN dihapus otomatis, karena ini terkait langsung dengan fitur Assignment yang sedang jadi prioritas.

---

## 8. Status Cleanup Codebase (Sudah Dieksekusi)

Menggunakan `depcheck` + `knip` untuk audit menyeluruh. Yang **sudah selesai dihapus/dibersihkan:**
- Dependency unused: `jwt-decode`, `tw-animate-css` (dari `apps/web`), `@vitest/coverage-v8` (dev dependency `apps/api`)
- Aturan `.prisma/` di `.gitignore` (sisa stack lama)
- Komentar/referensi NestJS di `.env.example` diupdate jadi Hono
- Dikonfirmasi: `package.json` di semua workspace SUDAH bersih dari `@nestjs`, `prisma`, `passport`, `redis` (migrasi stack berhasil, tidak ada sisa)
- Dikonfirmasi: `auth.routes.ts` SUDAH terdaftar dan dipakai di `index.ts` — laporan awal Knip yang bilang "unreferenced" adalah false positive, sudah diverifikasi manual.

**Belum selesai / masih pending:** § 7.2 dan § 7.3 di atas.

---

## 9. Roadmap Berikutnya (Urutan Kerja)

1. **Jawab Open Questions § 7** dulu (Billing/Inngest scope, bruno-setup.ts, halaman assignments) — supaya tidak ada keputusan diam-diam yang bertentangan dengan scope MVP.
2. **Dashboard** — ganti fake data jadi real (prioritas tinggi, paling kelihatan saat demo).
3. **Assignment** — rename UI ke Check Out/In, tambah `location_id` sebagai target ketiga.
4. **Import Excel** — refactor UI column-mapping jadi auto-match, TETAP pertahankan preview/validate/error-CSV flow.

---

## 10. Prinsip Kerja yang Disepakati Sepanjang Proses Ini

Beberapa pelajaran dari histori panjang diskusi yang penting dipegang oleh siapapun/apapun yang melanjutkan project ini:

1. **Selalu cek ulang: apakah rekomendasi ini untuk produk komersial atau untuk demo/portofolio?** Banyak rekomendasi "best practice enterprise" yang justru salah arah kalau diterapkan mentah-mentah ke project portofolio dengan waktu terbatas.
2. **Jangan campur "menyederhanakan UI" dengan "menghapus fitur inti".** Contoh kasus nyata: instruksi "sederhanakan Import Excel" pernah salah dieksekusi jadi "hapus fitur preview/validate", padahal yang dimaksud cuma sederhanakan UI column-mapping-nya.
3. **Cleanup/audit tidak boleh menghapus sesuatu yang statusnya "belum dibangun" seolah itu "sengaja dibuang".** Env var atau kode yang terkait modul yang memang belum lengkap dikerjakan (misal Billing) bukan otomatis "dead code" — itu keputusan scope yang perlu ditanya balik ke user, bukan diputuskan sepihak saat cleanup.
4. **Semua dokumen strategi/arsitektur besar (Blueprint, Architecture Review, Migration Plan) sudah dianggap LOCKED/selesai.** Jangan buka ulang diskusi arsitektur dari nol — kalau ada perubahan, harus spesifik dan terpisah dari planning besar, bukan re-planning penuh.
5. **Prioritaskan penyelesaian dua item yang sudah setengah jalan (Dashboard fake, Import belum transactional) di atas menambah fitur baru apapun.**