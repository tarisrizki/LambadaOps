# DATABASE_DESIGN.md

> Single source of truth untuk: skema database.
> Untuk arsitektur sistem → lihat `SYSTEM_ARCHITECTURE.md`.
> Untuk behavior fitur → lihat `FEATURE_SPEC.md`.

---

## 1. Database Overview

- Engine: **PostgreSQL**
- Multi-tenancy: **Shared database + kolom `tenant_id`** di semua tabel bisnis.
- Timestamps: semua tabel punya `created_at`, `updated_at` (Laravel default) kecuali disebutkan lain.
- Soft delete: diterapkan pada `users` dan `assets` (lihat § 8).

---

## 2. Domain Rules (WAJIB DIPATUHI)

| Rule | Penjelasan |
|---|---|
| `assets` = current state | Tabel `assets` selalu mencerminkan kondisi TERKINI saja. Tidak menyimpan histori. |
| `asset_assignments` = assignment history | Setiap perpindahan assignment (individual/shared) dicatat sebagai row baru di sini. Ini source of truth untuk histori "siapa pernah pegang aset apa". |
| `asset_events` = lifecycle timeline | Mencatat semua event penting sepanjang hidup aset (created, assigned, moved, status changed, maintained, retired) — dipakai untuk menampilkan timeline di UI. |
| `audit_logs` = system changes | Mencatat mutation level sistem (siapa mengubah apa, kapan, dari nilai apa ke apa) untuk keperluan audit/compliance, lintas semua modul — bukan cuma asset. |
| Assignment mutation wajib service layer | Perubahan assignment TIDAK BOLEH langsung update tabel `assets` dari controller. Wajib lewat `AssignAssetAction` (lihat `SYSTEM_ARCHITECTURE.md § 4.3`) yang menulis ke `asset_assignments`, `assets`, `asset_events`, dan `audit_logs` secara konsisten dalam satu transaction. |

---

## 3. ERD — High Level

```
plans ──< subscriptions >── tenants ──< users >── roles
                                │
                                ├──< asset_categories
                                ├──< locations
                                ├──< departments
                                │
                                └──< assets >──┬──< asset_assignments
                                                ├──< asset_events
                                                ├──< asset_attachments
                                                ├──< maintenance_schedules >── maintenance_records
                                                └──< tickets >──< ticket_comments

tenants ──< audit_logs
tenants ──< notifications
tenants ──< import_jobs >──< import_errors
tenants ──< webhook_logs (via subscriptions)
```

---

## 4. Tables — SaaS Foundation

### `plans`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | Free, Pro, Business |
| price_monthly | integer | dalam Rupiah, satuan terkecil (sen/rupiah penuh — tentukan konsisten) |
| asset_limit | integer nullable | null = unlimited |
| user_limit | integer nullable | null = unlimited |
| features | jsonb | feature flags per plan |

### `tenants`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | |
| slug | string unique | |
| status | enum | active, suspended, cancelled |
| trial_ends_at | timestamp nullable | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| plan_id | bigint FK → plans | |
| status | enum | trialing, active, past_due, cancelled |
| started_at | timestamp | |
| ends_at | timestamp nullable | |
| cancelled_at | timestamp nullable | |

### `webhook_logs`
Idempotency guard untuk payment webhook.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| provider | string | mock, midtrans, xendit |
| event_id | string | **unique per provider** — dedup key, cek sebelum proses webhook |
| payload | jsonb | raw payload dari provider |
| processed_at | timestamp nullable | null = belum diproses |

**Constraint:** `unique(provider, event_id)`.

---

## 5. Tables — Identity & Access

### `users`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| name | string | |
| email | string | **unique per tenant**, bukan unique global |
| password | string (hashed) | |
| role_id | bigint FK → roles | |
| status | enum | active, invited, suspended |
| deleted_at | timestamp nullable | **soft delete** — data historis (asset_events, dsb) tetap valid setelah user dihapus |

**Constraint:** `unique(tenant_id, email)`.

### `roles`
Fixed roles, tidak ada custom role builder di MVP.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | Owner/Admin, IT Manager, Technician, Employee |
| slug | string unique | owner_admin, it_manager, technician, employee |

Role bersifat **global/system-level** (seeded sekali, dipakai semua tenant), bukan per-tenant table.

### `permissions`
Referensi tetap untuk permission matrix — lihat `FEATURE_SPEC.md § Permission Matrix` untuk detail behavior per role.

---

## 6. Tables — Asset

### `asset_categories`, `locations`, `departments`
Struktur sederhana per tenant:

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| name | string | |

### `assets` (current state)
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| asset_code | string | **unique per tenant**, format `AST-000123` |
| name | string | |
| category_id | bigint FK → asset_categories | |
| location_id | bigint FK → locations | |
| department_id | bigint FK → departments, nullable | dipakai jika `assignment_type = shared` |
| current_assigned_user_id | bigint FK → users, nullable | dipakai jika `assignment_type = individual` |
| assignment_type | enum | `individual`, `shared`, `unassigned` |
| brand | string nullable | |
| serial_number | string nullable | |
| purchase_date | date nullable | |
| purchase_price | decimal nullable | |
| warranty_end | date nullable | |
| status | enum | active, repair, lost, retired, disposed |
| condition | enum | good, fair, poor |
| qr_code_token | string unique | dipakai untuk generate QR |
| version | integer default 1 | **optimistic locking** — increment tiap update |
| deleted_at | timestamp nullable | soft delete |

**Constraint:** `unique(tenant_id, asset_code)`.

### `asset_assignments` (history — source of truth)
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| asset_id | bigint FK → assets | |
| assignment_type | enum | individual, shared |
| user_id | bigint FK → users, nullable | diisi jika individual |
| department_id | bigint FK → departments, nullable | diisi jika shared |
| assigned_at | timestamp | |
| returned_at | timestamp nullable | null = masih berlaku |
| created_by | bigint FK → users | siapa yang melakukan assignment |

### `asset_events` (lifecycle timeline)
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| asset_id | bigint FK → assets | |
| event_type | enum | CREATED, ASSIGNED, MOVED, STATUS_CHANGED, MAINTAINED, RETIRED |
| old_value | jsonb nullable | |
| new_value | jsonb nullable | |
| actor_user_id | bigint FK → users, nullable | |
| actor_name_snapshot | string | **snapshot nama** — tetap valid meski user dihapus |
| note | text nullable | |
| created_at | timestamp | |

### `asset_attachments`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| asset_id | bigint FK → assets | |
| file_path | string | |
| file_name | string | |
| file_size | integer | |
| uploaded_by | bigint FK → users | |

---

## 7. Tables — Operations

### `maintenance_schedules`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| asset_id | bigint FK → assets | |
| type | string | cleaning, toner_replacement, inspection, dsb |
| interval_days | integer | |
| next_due_at | date | |
| technician_id | bigint FK → users, nullable | PIC/penerima reminder; jika null, reminder dikirim ke semua IT Manager tenant tersebut |
| is_active | boolean default true | |

### `maintenance_records`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| asset_id | bigint FK → assets | |
| schedule_id | bigint FK → maintenance_schedules, nullable | |
| description | text | |
| cost | decimal nullable | |
| technician_id | bigint FK → users, nullable | |
| performed_at | date | |

### `tickets`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| asset_id | bigint FK → assets, nullable | |
| creator_id | bigint FK → users | |
| assigned_to | bigint FK → users, nullable | |
| title | string | |
| description | text | |
| category | enum | hardware, software, network, other |
| priority | enum | low, medium, high, urgent |
| status | enum | open, assigned, in_progress, resolved, closed |
| resolved_at | timestamp nullable | |
| version | integer default 1 | **optimistic locking** |

### `ticket_comments`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| ticket_id | bigint FK → tickets | |
| user_id | bigint FK → users | |
| comment | text | |
| created_at | timestamp | |

---

## 8. Tables — Enterprise Layer

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| user_id | bigint FK → users | |
| type | string | warranty_expiring, ticket_assigned, maintenance_due |
| title | string | |
| body | text | |
| read_at | timestamp nullable | |
| created_at | timestamp | |

Catatan: kolom `channel` tidak diperlukan di MVP karena hanya ada satu channel (in-app). Skip untuk sekarang.

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| user_id | bigint FK → users, nullable | |
| action | string | created, updated, deleted, status_changed |
| model_type | string | nama model yang berubah |
| model_id | bigint | |
| old_value | jsonb nullable | |
| new_value | jsonb nullable | |
| ip_address | string nullable | |
| created_at | timestamp | |

### `import_jobs`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| uploaded_by | bigint FK → users | |
| file_path | string | |
| status | enum | pending, processing, completed, failed |
| total_rows | integer | |
| success_rows | integer | |
| failed_rows | integer | |

### `import_errors`
Row-level error detail — terpisah dari `import_jobs` agar query lebih rapi untuk data besar.

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| import_job_id | bigint FK → import_jobs | |
| row_number | integer | |
| field | string nullable | kolom mana yang error |
| error_message | string | alasan spesifik, bukan generic |
| raw_row_data | jsonb | data mentah baris tersebut untuk debugging |

---

## 9. Tenant-Scoped Unique Constraints (Ringkasan)

| Table | Constraint |
|---|---|
| users | `unique(tenant_id, email)` |
| assets | `unique(tenant_id, asset_code)` |
| assets | `unique(qr_code_token)` — global unique, dipakai sebagai public token di URL scan |
| webhook_logs | `unique(provider, event_id)` |

---

## 10. Optimistic Locking

Diterapkan **hanya** pada `assets` dan `tickets` (kolom `version`, increment tiap update, cek di WHERE clause saat update — reject jika version tidak cocok).

**Tidak diterapkan** pada: categories, locations, departments, maintenance_records, notifications, ticket_comments — entity ini dianggap low-contention untuk MVP.

---

## 11. Non-Goals

- Tidak ada full event sourcing (hanya hybrid state + event log).
- Tidak ada schema-per-tenant atau database-per-tenant.
- Tidak ada custom role/permission table per tenant (roles bersifat fixed & global).
- Tidak ada kolom `channel` di notifications (single channel: in-app).
- Tidak ada partitioning/sharding di MVP.
