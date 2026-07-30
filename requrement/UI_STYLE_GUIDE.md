# UI_STYLE_GUIDE.md

> Single source of truth untuk: konsistensi frontend.
> Untuk behavior/data → lihat `FEATURE_SPEC.md`.
> Untuk skema data yang ditampilkan → lihat `DATABASE_DESIGN.md`.

---

## 1. Design Direction

Produk ini adalah **operational B2B SaaS tool**, bukan marketing site atau consumer app. Prinsip visual:

- **Clean** — minim dekorasi, fokus pada fungsi
- **Data-dense** — prioritaskan menampilkan banyak informasi relevan per layar (table-first), bukan whitespace besar ala landing page
- **Table-first** — listing data (asset, ticket, dsb) menggunakan table, bukan card grid besar, kecuali untuk kasus spesifik (misal dashboard summary cards)
- **Efficient workflow** — minimalkan klik untuk task umum (create ticket dari QR scan, assign asset, dsb)

Referensi mood: mirip dashboard SaaS B2B seperti Linear, Retool, atau admin panel enterprise — bukan gaya consumer app/marketing.

---

## 2. Layout Patterns

### 2.1 Shell Layout (halaman umum setelah login)
```
┌─────────────────────────────────────┐
│ Top bar: logo, tenant name, notif 🔔, user menu │
├───────────┬───────────────────────────┤
│ Sidebar   │  Content area              │
│ nav       │  (page-specific)           │
│ (role-    │                            │
│  aware)   │                            │
└───────────┴───────────────────────────┘
```
- Sidebar navigation **role-aware**: item menu yang tidak diizinkan untuk role tersebut tidak ditampilkan (bukan ditampilkan tapi disabled).

### 2.2 Asset List Page
- Table dengan kolom: asset_code, name, category, location, assigned to, status, warranty_end
- Filter bar di atas table: kategori, lokasi, status, assignment type
- Search by nama/asset_code/serial number
- Action per row: view detail, edit (jika permission)

### 2.3 Asset Detail Page
- Header: info utama asset (code, name, status, QR code visual)
- Tab/section:
  - Info umum (editable jika permission)
  - Assignment history (dari `asset_assignments`)
  - Lifecycle timeline (dari `asset_events`) — tampilkan sebagai vertical timeline
  - Maintenance history
  - Attachments
  - Related tickets

### 2.4 Create/Edit Form Pattern
- Form standar: label di atas input, validasi inline (bukan alert popup)
- Field wajib ditandai jelas
- Dropdown untuk category/location/department (bukan free text) — sesuai validation rule di `FEATURE_SPEC.md`

### 2.5 QR Scan Page
- Halaman minimal, dioptimalkan mobile (kemungkinan tanpa sidebar penuh — layout ringkas)
- Setelah scan: tampilkan detail asset ringkas + tombol besar "Report Issue"
- Tetap memerlukan login (bukan public page — lihat `FEATURE_SPEC.md § 4.2`)

### 2.6 Ticket Board
- Default view: table/list dengan filter status (open, assigned, in_progress, resolved, closed)
- Opsional: kanban-style board per status (jika waktu memungkinkan — tidak wajib untuk MVP, table view cukup)
- Detail ticket: history comment, status change log

### 2.7 Notification Dropdown
- Icon bell di top bar dengan badge jumlah unread
- Dropdown list singkat (title + waktu), klik → redirect ke halaman terkait
- Data dari polling `GET /api/notifications/unread` (lihat `SYSTEM_ARCHITECTURE.md § 5`)

---

## 3. Reusable Components

| Component | Dipakai di |
|---|---|
| **Data Table** | Asset list, ticket list, user list, audit log — dengan sorting, pagination, filter |
| **Filter Bar** | Di atas semua data table |
| **Status Badge** | Warna berbeda per status (asset status, ticket status, subscription status) |
| **Modal** | Confirm action (delete, dsb), quick-create form |
| **Form** | Create/edit asset, ticket, maintenance schedule — konsisten struktur validasi |
| **Timeline** | Asset lifecycle events, ticket comment history |
| **Notification Center** | Dropdown notifikasi (lihat § 2.7) |

---

## 4. Non-Goals

- Tidak perlu desain pixel-perfect untuk setiap halaman — cukup pattern & prinsip di atas, konsistensi dijaga lewat reuse komponen
- Tidak perlu dark mode di MVP
- Tidak perlu animasi/transisi kompleks
- Tidak perlu halaman marketing/landing page (di luar scope dokumen ini — fokus pada aplikasi setelah login)
- Tidak perlu design system token lengkap (warna hex spesifik dsb) — gunakan default clean neutral palette (grays + satu accent color) kecuali ditentukan lain

---

## 5. Frontend Architecture Decisions (Revised)

- **Authentication Strategy**: Strict Client-Side `localStorage` paired with React Context (`AuthContext`). Prevents dual-strategy confusion.
- **Folder Structure**: **Feature-First Architecture** (`apps/web/src/features/asset`, `ticket`, `maintenance`, `notification`, `billing`, `shared`). Generic UI components remain in `src/components/ui`.
- **Navigation Configuration**: Sidebar links and RBAC are driven dynamically by `src/config/navigation.config.ts`.
- **Permission Guards**: UI elements (buttons, forms, links) should be conditionally rendered using the declarative `<RoleGuard allowedRoles={[...]} />` or `<PermissionGuard>` component based on backend RBAC.
- **Data Fetching**: **TanStack Query** is the exclusive standard for polling, fetching, caching, and optimistic UI updates for client components (e.g., ticket status changes, notification polling).
