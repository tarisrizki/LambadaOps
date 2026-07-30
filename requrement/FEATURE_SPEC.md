# FEATURE_SPEC.md

> Single source of truth untuk: behavior sistem (apa yang harus dilakukan sistem).
> Untuk skema database → lihat `DATABASE_DESIGN.md`.
> Untuk arsitektur → lihat `SYSTEM_ARCHITECTURE.md`.
> Untuk UI → lihat `UI_STYLE_GUIDE.md`.

---

## § 0. Permission Matrix (Berlaku untuk Semua Modul)

**Catatan model role — wajib dipatuhi:** Role bersifat **global/system-defined**, di-seed sekali, dipakai bersama oleh semua tenant. Tidak ada tabel `tenant_roles` atau role custom per tenant. Setiap user memiliki tepat satu role (`users.role_id`) dalam scope tenant-nya masing-masing — yang tenant-scoped adalah **assignment role ke user**, bukan definisi role itu sendiri. Detail skema → `DATABASE_DESIGN.md § 5`.

| Action | Owner/Admin | IT Manager | Technician | Employee |
|---|---|---|---|---|
| Manage billing/subscription | ✅ | ❌ | ❌ | ❌ |
| Create/delete user account | ✅ | ❌ | ❌ | ❌ |
| Manage tenant settings | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ | ❌ |
| Create/edit/delete asset | ✅ | ✅ | ❌ | ❌ |
| View all assets | ✅ | ✅ | ❌ (hanya assigned) | ❌ (hanya milik sendiri) |
| Assign asset ke technician/department | ✅ | ✅ | ❌ | ❌ |
| **Assign ticket ke technician existing** | ✅ | ✅ | ❌ | ❌ |
| Manage maintenance schedule | ✅ | ✅ | ❌ | ❌ |
| Update maintenance record (assigned task) | ✅ | ✅ | ✅ | ❌ |
| Create ticket | ✅ | ✅ | ✅ | ✅ |
| Handle assigned ticket | ✅ | ✅ | ✅ | ❌ |
| View own ticket | ✅ | ✅ | ✅ | ✅ |
| Import Excel | ✅ | ✅ | ❌ | ❌ |
| Export CSV | ✅ | ✅ | ❌ | ❌ |

**Klarifikasi penting — IT Manager vs Owner/Admin:**
- IT Manager **dapat** meng-assign task/ticket/asset ke technician yang **sudah ada** (existing user dengan role Technician).
- IT Manager **tidak dapat** membuat, menghapus, atau mengubah role akun user — itu eksklusif Owner/Admin.
- IT Manager **tidak dapat** mengakses billing/subscription dalam bentuk apapun.

---

## § 1. Authentication & Tenant

### 1.1 User Flow
```
Register (nama perusahaan, nama admin, email, password)
    → Create tenant (status: active, trial_ends_at: now + 14 hari)
    → Create user pertama dengan role Owner/Admin
    → Auto-assign plan Free (trialing)
    → Redirect ke dashboard
```

### 1.2 Login Flow — Tenant Identifier Wajib

Karena `email` unique **per tenant** (bukan global), sistem tidak bisa menentukan tenant hanya dari email. Login **wajib** menyertakan identifier tenant:

```
Input login:
- company_slug (atau tenant identifier lain, misal subdomain)
- email
- password

Proses:
1. Resolve tenant dari company_slug
2. Cari user dengan email tersebut DALAM tenant itu
3. Verifikasi password
4. Set TenantContext, generate session/token
```

Tidak boleh: `users.email` sebagai kolom unique global — itu bertentangan dengan model email-per-tenant yang sudah dipilih.

### 1.3 Acceptance Criteria
- [ ] User dari tenant A tidak bisa login menggunakan email yang terdaftar di tenant B dengan kredensial tenant B (isolasi penuh)
- [ ] Login gagal jika company_slug tidak valid, meski email+password benar untuk tenant lain
- [ ] Setelah register, tenant baru otomatis dapat trial 14 hari dengan plan Free
- [ ] Password disimpan hashed (bcrypt/argon2), tidak pernah plaintext
- [ ] Role pertama yang dibuat saat register selalu Owner/Admin

### 1.4 Validation Rules
- Email format valid, wajib unique dalam scope tenant yang sama (bukan unique global)
- Password minimum 8 karakter
- company_slug wajib diisi saat login, tidak boleh kosong

---

## § 2. Subscription & Plan Limit

### 2.1 User Flow
```
User klik "Upgrade Plan"
    → Pilih plan (Pro/Business)
    → Redirect ke payment gateway (driver: mock di MVP)
    → Payment selesai → provider kirim webhook
    → Cek webhook_logs untuk event_id duplikat → skip jika sudah pernah diproses
    → Update subscription (plan_id, status: active, ends_at)
```

### 2.2 Plan Limit Enforcement
```
User mencoba create asset ke-51 (plan Free, limit 50)
    → Service layer cek current asset count vs plan.asset_limit
    → Jika melebihi: tolak dengan pesan "Asset limit reached. Upgrade your plan."
```

### 2.3 Acceptance Criteria
- [ ] Webhook dengan `event_id` yang sama diproses hanya sekali (idempotent)
- [ ] Percobaan create asset/user melebihi limit plan ditolak dengan pesan jelas, bukan silent fail
- [ ] Trial otomatis berakhir setelah `trial_ends_at` terlewati — status subscription berubah, bukan asset/data dihapus

---

## § 3. Asset Management

### 3.1 User Flow
```
IT Manager/Owner buat asset baru
    → Input: nama, kategori, lokasi, brand, serial, purchase info
    → System generate asset_code (format AST-000123, sequential per tenant)
    → System generate qr_code_token unik
    → Create asset_event: CREATED
```

### 3.2 Acceptance Criteria
- [ ] asset_code unique per tenant, format konsisten
- [ ] Setiap create/update/delete asset menghasilkan entry di audit_logs
- [ ] Update asset menggunakan optimistic locking — jika `version` tidak cocok, tolak update dengan pesan conflict
- [ ] Asset yang di-soft-delete tidak muncul di listing default tapi tetap bisa diakses lewat riwayat (asset_events, ticket lama)

### 3.3 Validation Rules
- Nama asset wajib diisi
- Kategori dan lokasi wajib dipilih dari master data tenant (tidak bisa free text)
- purchase_price jika diisi harus angka positif

---

## § 4. QR Tracking

### 4.1 User Flow
```
Admin cetak QR label (berisi qr_code_token, di-encode sebagai URL)
    → Tempel di perangkat fisik

Technician/Employee scan QR (browser mobile)
    Step 1: Scan QR → buka URL berisi qr_code_token
    Step 2: Jika belum authenticated → redirect ke halaman login,
            simpan qr_code_token sebagai return target
    Step 3: Setelah login berhasil → redirect kembali ke halaman
            detail asset (via qr_code_token yang tersimpan)
    Step 4: Tombol "Report Issue" → create ticket, asset_id ter-prefill otomatis
```

### 4.2 Acceptance Criteria
- [ ] Halaman scan QR berfungsi di Chrome Android dan Safari iOS
- [ ] Akses via QR tetap memerlukan login (bukan public page) — user harus authenticated dalam tenant yang sama dengan asset
- [ ] qr_code_token tidak bisa ditebak (random string, bukan sequential ID)

---

## § 5. Assignment (Individual/Shared)

### 5.1 User Flow
```
IT Manager assign asset:
    Pilih tipe: individual (ke user) atau shared (ke department)
        → Panggil AssignAssetAction (lihat SYSTEM_ARCHITECTURE.md § 4.3)
        → Jika assignment sebelumnya masih aktif: set returned_at pada record lama
        → Create record baru di asset_assignments
        → Update assets.current_assigned_user_id / department_id / assignment_type
        → Create asset_event: ASSIGNED
        → Create audit_log
```

### 5.2 Acceptance Criteria
- [ ] Asset hanya bisa punya satu assignment aktif pada satu waktu (assignment lama otomatis "returned" saat assignment baru dibuat)
- [ ] Riwayat assignment lengkap bisa ditampilkan per asset (dari asset_assignments, bukan dari assets)
- [ ] Assignment individual mengisi `user_id`, assignment shared mengisi `department_id` — tidak boleh keduanya kosong atau keduanya terisi

### 5.3 Validation Rules
- User yang di-assign (individual) harus user aktif dalam tenant yang sama
- Department yang di-assign (shared) harus department yang terdaftar dalam tenant yang sama

---

## § 6. Maintenance

### 6.1 User Flow
```
IT Manager buat maintenance_schedule (asset, tipe, interval hari, technician_id opsional sebagai PIC)
    → System hitung next_due_at

Scheduled job (daily):
    → Cari schedule dengan next_due_at <= today + 7 hari
    → Recipient notification:
        - Jika schedule.technician_id terisi → kirim ke technician tersebut
        - Jika kosong → kirim ke semua user dengan role IT Manager di tenant tersebut

Technician selesaikan maintenance:
    → Create maintenance_record (description, cost, performed_at)
    → System update next_due_at pada schedule terkait (+ interval_days)
    → Create asset_event: MAINTAINED
```

### 6.2 Acceptance Criteria
- [ ] Reminder muncul sebagai notification maksimal 7 hari sebelum jatuh tempo
- [ ] Setelah maintenance_record dibuat, next_due_at otomatis terupdate — tidak perlu input manual
- [ ] Riwayat maintenance per asset dapat ditampilkan kronologis

---

## § 7. Ticketing

### 7.1 User Flow
```
Employee/Technician buat ticket (title, description, category, priority, asset_id opsional)
    → status: open

IT Manager/Owner assign ke technician existing
    → status: assigned
    → Create notification untuk technician

Technician mulai kerjakan
    → status: in_progress
    → Tambah comment (progress notes)

Technician selesaikan
    → status: resolved
    → resolved_at diisi

Auto/manual close
    → status: closed
```

### 7.2 Acceptance Criteria
- [ ] Setiap perubahan status ticket menghasilkan entry di audit_logs
- [ ] Update ticket menggunakan optimistic locking (kolom `version`)
- [ ] Employee hanya bisa melihat ticket miliknya sendiri; Technician hanya ticket yang di-assign ke dirinya; IT Manager/Owner melihat semua

### 7.3 Validation Rules
- Title dan description wajib diisi
- Priority harus salah satu dari: low, medium, high, urgent

---

## § 8. Notification

### 8.1 Behavior
- Notification dibuat oleh sistem (bukan user-generated) untuk event: ticket assigned, maintenance due, warranty expiring.
- Frontend polling `GET /api/notifications/unread` tiap 30-60 detik (lihat `SYSTEM_ARCHITECTURE.md § 5`).
- User bisa mark-as-read.

### 8.2 Acceptance Criteria
- [ ] Notification hanya terlihat oleh user yang dituju (tenant + user scoped)
- [ ] Notification tidak hilang otomatis — tetap ada di riwayat setelah dibaca (read_at terisi, bukan delete)

---

## § 9. Audit Log

### 9.1 Behavior
Setiap create/update/delete/status-change pada entity penting (asset, ticket, subscription, user) mencatat entry di `audit_logs` dengan old_value dan new_value.

### 9.2 Acceptance Criteria
- [ ] Audit log hanya bisa dilihat oleh Owner/Admin
- [ ] Audit log tidak bisa diedit atau dihapus oleh siapapun (append-only)

---

## § 10. Excel Import

### 10.1 User Flow
```
Admin/IT Manager upload assets.xlsx
    → Preview + mapping kolom (map kolom spreadsheet ke field asset)
    → Submit → create import_job (status: pending)
    → Queue job ProcessExcelImportJob (async)
    → Proses tiap baris:
        - Validasi field wajib, format, duplikasi asset_code/serial_number
        - Baris valid → create asset
        - Baris gagal → create import_error dengan alasan spesifik
    → Update import_job (status: completed, success_rows, failed_rows)
    → User bisa download error report
```

### 10.2 Acceptance Criteria
- [ ] Baris yang gagal validasi TIDAK menggagalkan seluruh import — baris valid tetap diproses
- [ ] Setiap baris gagal punya alasan spesifik (bukan generic "import failed"), tersimpan di import_errors
- [ ] User bisa lihat progress import (pending → processing → completed)

### 10.3 Validation Rules (per baris)
- Nama asset wajib
- Kategori dan lokasi harus cocok dengan master data tenant (case-insensitive match, gagal jika tidak ditemukan)
- asset_code jika diisi harus unique dalam tenant (baik terhadap data existing maupun sesama baris dalam file yang sama)

---

## § 11. CSV Export

### 11.1 User Flow
```
User request export (misal: daftar asset)
    → Queue job GenerateCsvExportJob (async untuk data besar)
    → Generate file CSV
    → User download hasil
```

### 11.2 Acceptance Criteria
- [ ] Export hanya berisi data dalam scope tenant user yang request
- [ ] Kolom CSV konsisten dengan field yang ditampilkan di listing UI

---

## Non-Goals

Tidak termasuk MVP:
- Custom role/permission builder
- PDF report (hanya CSV di MVP)
- Email/WhatsApp notification (hanya in-app)
- AI ticket classification / AI assistant
- Real-time notification (WebSocket/SSE)
- Approval workflow untuk procurement
- Depreciation/disposal calculation otomatis
