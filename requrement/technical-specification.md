# IT Asset Lifecycle Management SaaS — Technical Specification

> A multi-tenant IT Asset Lifecycle Management SaaS that helps organizations track hardware assets, manage maintenance lifecycle, handle IT support tickets, automate operational notifications, and provide audit-ready asset history.

---

## 1. Product Scope

**Produk:** IT Asset Lifecycle Management SaaS
**Bukan:** Homelab manager, network monitoring platform, ERP IT besar

**MVP Modules:**
- SaaS Foundation (Multi-tenant, Auth, RBAC, Subscription)
- Asset Management (CRUD, QR Tracking, Assignment, Lifecycle History)
- Operations (Maintenance, Ticketing, Notification)
- Enterprise Layer (Audit Log, Excel Import, PDF Export)

**Phase 2 (post-MVP):** Software License Manager, Knowledge Base, AI Ticket Classification, AI Knowledge Assistant, WhatsApp Notification, Advanced Analytics Dashboard

**Phase 3 (future):** Agent-based device monitoring, network discovery, mobile native app

---

## 2. Entity Relationship Diagram (ERD)

### 2.1 Tenancy & Billing

```
plans
├── id (PK)
├── name                 -- Free, Pro, Business
├── price_monthly
├── price_yearly
├── asset_limit
├── user_limit
├── features (json)      -- feature flags per plan
└── timestamps

tenants
├── id (PK)
├── name
├── slug (unique)
├── status               -- active, suspended, cancelled
├── trial_ends_at
└── timestamps

subscriptions
├── id (PK)
├── tenant_id (FK -> tenants)
├── plan_id (FK -> plans)
├── status               -- trialing, active, past_due, cancelled
├── started_at
├── ends_at
├── cancelled_at
└── timestamps

invoices
├── id (PK)
├── tenant_id (FK -> tenants)
├── subscription_id (FK -> subscriptions)
├── amount
├── status               -- pending, paid, failed, refunded
├── payment_provider     -- midtrans, xendit
├── provider_reference_id
├── paid_at
└── timestamps

webhook_logs                          -- idempotency guard
├── id (PK)
├── provider
├── event_id (unique per provider)    -- dedup key
├── payload (json)
├── processed_at
└── timestamps
```

### 2.2 Identity & Access

```
users
├── id (PK)
├── tenant_id (FK -> tenants)
├── name
├── email (unique per tenant)
├── password
├── role_id (FK -> roles)
├── status               -- active, invited, suspended
├── deleted_at           -- soft delete (preserve history references)
└── timestamps

roles
├── id (PK)
├── tenant_id (FK -> tenants, nullable for system roles)
├── name                 -- Admin, Technician, Employee
└── timestamps

permissions
├── id (PK)
├── name                 -- asset.create, ticket.assign, billing.manage
└── timestamps

role_permissions (pivot)
├── role_id (FK -> roles)
└── permission_id (FK -> permissions)
```

### 2.3 Asset Core

```
asset_categories
├── id (PK)
├── tenant_id (FK -> tenants)
├── name                 -- Laptop, Printer, Router, CCTV, etc.
└── timestamps

locations
├── id (PK)
├── tenant_id (FK -> tenants)
├── name
├── address
└── timestamps

departments
├── id (PK)
├── tenant_id (FK -> tenants)
├── name
└── timestamps

assets
├── id (PK)
├── tenant_id (FK -> tenants)
├── asset_code (unique per tenant)   -- e.g. AST-000123
├── name
├── category_id (FK -> asset_categories)
├── location_id (FK -> locations)
├── department_id (FK -> departments)
├── assigned_user_id (FK -> users, nullable)
├── brand
├── serial_number
├── purchase_date
├── purchase_price
├── warranty_end
├── status               -- active, repair, lost, retired, disposed
├── condition            -- good, fair, poor
├── qr_code_token (unique)
├── deleted_at
└── timestamps

asset_events                          -- lifecycle history (hybrid model)
├── id (PK)
├── asset_id (FK -> assets)
├── event_type           -- CREATED, ASSIGNED, MOVED, STATUS_CHANGED,
│                             MAINTAINED, RETIRED
├── old_value (json)
├── new_value (json)
├── actor_user_id (FK -> users, nullable)
├── actor_name_snapshot  -- preserved even if user later deleted
├── note
└── created_at

attachments
├── id (PK)
├── attachable_type      -- polymorphic: Asset, Ticket, Maintenance
├── attachable_id
├── file_path
├── file_name
├── file_size
├── uploaded_by (FK -> users)
└── timestamps
```

### 2.4 Operations

```
maintenance_schedules
├── id (PK)
├── tenant_id (FK -> tenants)
├── asset_id (FK -> assets)
├── type                 -- cleaning, toner_replacement, inspection
├── interval_days
├── next_due_at
├── is_active
└── timestamps

maintenance_records
├── id (PK)
├── tenant_id (FK -> tenants)
├── asset_id (FK -> assets)
├── schedule_id (FK -> maintenance_schedules, nullable)
├── description
├── cost
├── technician_id (FK -> users, nullable)
├── performed_at
└── timestamps

tickets
├── id (PK)
├── tenant_id (FK -> tenants)
├── asset_id (FK -> assets, nullable)
├── creator_id (FK -> users)
├── assigned_to (FK -> users, nullable)
├── title
├── description
├── category              -- hardware, software, network, other
├── priority               -- low, medium, high, urgent
├── status                 -- open, assigned, in_progress, resolved, closed
├── resolved_at
└── timestamps

ticket_comments
├── id (PK)
├── ticket_id (FK -> tickets)
├── user_id (FK -> users)
├── comment
└── created_at
```

### 2.5 Enterprise Layer

```
audit_logs
├── id (PK)
├── tenant_id (FK -> tenants)
├── user_id (FK -> users, nullable)
├── action                -- created, updated, deleted, status_changed
├── model_type
├── model_id
├── old_value (json)
├── new_value (json)
├── ip_address
└── created_at

notifications
├── id (PK)
├── tenant_id (FK -> tenants)
├── user_id (FK -> users)
├── type                  -- warranty_expiring, ticket_assigned, maintenance_due
├── channel                -- email, whatsapp (phase 2), in_app
├── title
├── body
├── read_at
└── created_at

import_jobs
├── id (PK)
├── tenant_id (FK -> tenants)
├── uploaded_by (FK -> users)
├── file_path
├── status                -- pending, processing, completed, failed
├── total_rows
├── success_rows
├── failed_rows
├── error_report (json)   -- row-level errors with reasons
└── timestamps

export_jobs
├── id (PK)
├── tenant_id (FK -> tenants)
├── requested_by (FK -> users)
├── type                  -- asset_report, ticket_report
├── file_path
├── status
└── timestamps
```

### 2.6 High-Level Relationship Diagram

```
plans ──< subscriptions >── tenants ──< users >── roles ──< permissions
                                │
                                ├──< asset_categories
                                ├──< locations
                                ├──< departments
                                │
                                └──< assets >──┬──< asset_events
                                                ├──< attachments
                                                ├──< maintenance_schedules >── maintenance_records
                                                └──< tickets >──< ticket_comments

tenants ──< audit_logs
tenants ──< notifications
tenants ──< import_jobs / export_jobs
```

---

## 3. Key Engineering Safeguards

| Risiko | Mitigasi |
|---|---|
| Tenant data bocor lewat raw query / queue job / cache | Global scope untuk Eloquent + eksplisit pass `tenant_id` ke setiap Job; tidak boleh bergantung pada session context di background job |
| Webhook payment double-processed | `webhook_logs` dengan unique `event_id` per provider, cek duplikat sebelum proses |
| Excel import gagal diam-diam | `import_jobs.error_report` — setiap baris gagal dicatat dengan alasan spesifik, ditampilkan ke user, bukan generic "import failed" |
| History hilang saat user dihapus | Soft delete di `users` + snapshot nama di `asset_events.actor_name_snapshot` |
| Tenant isolation regression | Wajib ada automated test "tenant isolation" di tiap modul baru sebelum merge |
| Notification tidak terkirim saat load tinggi | Semua notification lewat queue (Redis), bukan synchronous |

---

## 4. Core User Flows

### 4.1 Onboarding & Trial
```
Register (company name, email, password)
    → Create tenant + assign Free/Trial plan
    → trial_ends_at = now + 14 days
    → Send welcome email
    → Redirect to onboarding wizard (create first location, invite team)
```

### 4.2 Subscription Upgrade
```
User clicks "Upgrade Plan"
    → Select plan (Pro/Business)
    → Redirect to payment gateway (Midtrans/Xendit)
    → Payment completed → provider sends webhook
    → Verify webhook signature
    → Check webhook_logs for duplicate event_id → skip if exists
    → Create invoice (status: paid)
    → Update subscription (plan_id, status: active, ends_at)
    → Send confirmation email
```

### 4.3 Asset Creation + QR
```
Admin creates asset (name, category, location, purchase info)
    → System generates asset_code (AST-000123)
    → System generates unique qr_code_token
    → asset_events: CREATED
    → Admin prints QR label (PDF sticker sheet)
```

### 4.4 QR Scan → Ticket Creation
```
Technician/Employee scans QR (mobile browser, PWA)
    → Public/authenticated asset detail page
    → "Report Issue" button
    → Create ticket (pre-filled asset_id, creator_id)
    → Notify: available technicians (queue → email/in-app)
```

### 4.5 Ticket Lifecycle
```
Ticket created (status: open)
    → Admin/Technician assigns to self or team member (status: assigned)
    → Technician starts work (status: in_progress)
    → Comments added (troubleshooting notes)
    → Technician resolves (status: resolved) → resolved_at set
    → Creator confirms / auto-close after N days (status: closed)
    → audit_logs entry for every status change
```

### 4.6 Maintenance Reminder (Scheduled Job)
```
Daily cron (08:00)
    → Query maintenance_schedules where next_due_at <= today + 7 days
    → Create notification per matched schedule
    → Queue → email/in-app delivery
    → After maintenance_record logged → recalculate next_due_at
```

### 4.7 Warranty Expiry Reminder
```
Daily cron (08:00)
    → Query assets where warranty_end BETWEEN today AND today+30
    → Create notification → assigned admin/PIC
```

### 4.8 Excel Import
```
Admin uploads assets.xlsx
    → Preview + column mapping (map spreadsheet columns to asset fields)
    → Validate each row (required fields, duplicate serial, enum values)
    → Queue import_job (async — large files shouldn't block request)
    → Progress shown to user (processing → completed)
    → Result: success_rows, failed_rows + downloadable error report
```

### 4.9 Plan Limit Enforcement
```
User attempts to create asset #51 (Free plan, limit 50)
    → Middleware/Service checks current asset count vs plan.asset_limit
    → If exceeded: reject with "Asset limit reached. Upgrade your plan."
    → Frontend shows upgrade CTA
```

---

## 5. Pricing Model (Draft — untuk divalidasi ke market)

| Plan | Harga | Asset Limit | User Limit | Fitur |
|---|---|---|---|---|
| **Free** | Rp 0 | 50 aset | 3 user | Asset + Ticket dasar, tanpa export/import |
| **Pro** | Rp 199.000/bulan | 500 aset | Unlimited | + QR, Maintenance, Excel Import, PDF Export |
| **Business** | Rp 499.000/bulan | Unlimited | Unlimited | + Audit log lengkap, prioritas support, (Phase 2: WhatsApp notif, AI features) |

Catatan: harga ini draft awal untuk keperluan pengembangan produk, bukan hasil riset pasar. Sebelum benar-benar dijual, perlu divalidasi dengan wawancara calon pengguna (UMKM/sekolah/klinik) untuk willingness-to-pay yang sesungguhnya.

---

## 6. Technical Stack

```
Frontend:   SvelteKit (dashboard), PWA-enabled (QR scan mobile)
Backend:    Laravel 12 (modular monolith)
Database:   PostgreSQL
Queue/Cache: Redis + Laravel Queue Worker
Storage:    Local disk (MVP) → S3-compatible (later)
Payment:    Midtrans / Xendit (webhook-based)
Email:      Laravel Mail (SMTP) — WhatsApp via provider API in Phase 2
Deployment: Docker Compose (Laravel + Postgres + Redis + Nginx)
```

### Laravel Module Structure
```
app/Modules/
├── Tenant/
├── User/
├── Billing/
├── Asset/
├── Maintenance/
├── Ticket/
├── Notification/
├── Audit/
└── Report/
```

---

## 7. Build Order (Dependency-Based)

| Phase | Durasi | Output |
|---|---|---|
| 0. Foundation | 2-3 minggu | Auth, tenant isolation, RBAC — multi-company login berfungsi |
| 1. SaaS Layer | 1 minggu | Plans, subscription, trial, limit enforcement, webhook payment |
| 2. Asset Core | 2 minggu | CRUD asset, category, location, assignment, lifecycle events |
| 3. QR + Mobile | 1 minggu | Generate/print QR, scan flow, tested di Chrome Android & Safari iOS |
| 4. Maintenance + Ticket | 2 minggu | Schedule, reminder, ticket workflow, comments |
| 5. Enterprise Polish | 1-2 minggu | Audit log, notification queue, Excel import, PDF export |
| Buffer | 2 minggu | Bug fixing, UI polish, deployment |

**Total realistis: 11-13 minggu (termasuk buffer)**

---

## 8. Open Questions (perlu divalidasi, bukan diasumsikan)

1. Apakah target pasar (UMKM/sekolah/klinik) benar-benar mau bayar bulanan, atau lebih suka model sekali beli/tahunan?
2. Siapa kompetitor lokal langsung (kalau ada) dan berapa harga mereka?
3. Apakah WhatsApp notification (Phase 2) cukup penting untuk jadi alasan upgrade ke plan lebih mahal?
4. Berapa jumlah aset rata-rata target pelanggan — apakah limit 50/500 di atas realistis?
