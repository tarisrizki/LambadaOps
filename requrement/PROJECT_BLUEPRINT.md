# PROJECT_BLUEPRINT.md

> Dokumen orientasi. Untuk detail teknis, lihat dokumen yang dirujuk di § Document Map.

---

## 1. Product Summary

**Nama kategori produk:** IT Asset Tracking & Operations Management SaaS

**Positioning statement:**
Platform B2B multi-tenant yang membantu perusahaan melacak aset IT — dari pencatatan, penugasan (assignment), maintenance, hingga penanganan tiket IT — dalam satu dashboard operasional, menggantikan pencatatan manual berbasis Excel.

*(Visi jangka panjang, di luar MVP: "IT Asset Lifecycle Management Platform" — mencakup procurement, depreciation, dan disposal workflow.)*

---

## 2. Problem Statement

Perusahaan Indonesia dengan banyak perangkat IT umumnya menghadapi:
- Inventaris aset masih dikelola manual via Excel/spreadsheet
- Tidak ada visibilitas jelas: aset berada di mana, digunakan siapa
- Warranty sering terlupakan hingga lewat masa berlaku
- Riwayat maintenance hilang atau tidak terdokumentasi
- Teknisi baru kesulitan mengetahui riwayat perangkat
- Audit aset sulit dilakukan karena data tersebar

---

## 3. Target Customer

| Prioritas | Segment |
|---|---|
| **Primary** | Perusahaan Indonesia dengan 50-500 karyawan, memiliki tim IT internal |
| **Secondary** | Sekolah/kampus/organisasi dengan kebutuhan serupa |
| **Future consideration** | MSP/IT outsourcing (butuh arsitektur multi-client terpisah, di luar MVP) |

---

## 4. MVP Scope

### In Scope

**SaaS Foundation**
- Multi tenant, Authentication, Fixed RBAC, Subscription model, Plan limit enforcement

**Asset Operations**
- Asset management, QR tracking, Individual/shared assignment, Assignment history, Lifecycle events

**IT Operations**
- Maintenance schedule & history, Ticketing, In-app notification

**Enterprise Layer**
- Audit log, Excel import, CSV export

### Out of Scope (Non-Goals MVP)

- AI features (ticket classification, asset recommendation, dsb)
- WhatsApp notification, Email automation
- Real-time notification (WebSocket/SSE)
- Device monitoring agent, Network discovery
- Native mobile app (cukup PWA)
- Custom RBAC / permission builder
- MSP multi-client management
- PDF reporting (cukup CSV)
- Procurement approval workflow, depreciation, disposal calculation

---

## 5. Architecture Snapshot

Modular Monolith — NestJS (backend, TypeScript) + Next.js App Router (frontend) + Neon Postgres (serverless) + Inngest (background job) + Cloudflare R2 (storage). Deployment: Vercel (frontend) + Render (backend) — tanpa VPS, seluruhnya managed/serverless platform.

*(Revisi dari stack awal Laravel/SvelteKit/Docker Compose berdasarkan final architecture review — lihat `SYSTEM_ARCHITECTURE.md § 0` untuk detail justifikasi.)*

Detail lengkap → `SYSTEM_ARCHITECTURE.md`.

---

## 6. Document Map

| Dokumen | Kapan dirujuk |
|---|---|
| `SYSTEM_ARCHITECTURE.md` | Setup struktur project, modul, tenant isolation, queue, deployment |
| `DATABASE_DESIGN.md` | Membuat migration & model Eloquent |
| `FEATURE_SPEC.md` | Membuat business logic, validation, permission check per modul |
| `UI_STYLE_GUIDE.md` | Membuat komponen & halaman frontend |
| `DEVELOPMENT_TASKS.md` | Menentukan urutan pengerjaan & acceptance criteria per task |

**Aturan penting:** Semua keputusan dalam dokumen-dokumen ini bersifat **LOCKED**. Tidak ada penambahan fitur atau perubahan arsitektur tanpa proses revisi konsep terpisah di luar sesi implementasi.
