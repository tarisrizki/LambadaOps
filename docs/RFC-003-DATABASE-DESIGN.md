# RFC-003 — Database Design
**Status**: Proposed · **Date**: 2026-08-05 · **Authors**: Engineering

Kode aktual: Drizzle ORM + Neon Postgres HTTP driver. 13 schema files. Migration history 14 versi. Schema dibaca langsung dari `apps/ai/src/db/schema/*.schema.ts`.
<br>
**Critical finding dari audit fase sebelumnya**: mixed `integer`/`bigint`, missing FK constraints, tidak ada cascade, tidak ada soft-delete di assets. Grade D. Ini bukan "bagus tapi perlu polish" — ini data corruption risk.

---

## ADR-DB-001: Fix vs Redesign dari Awal

**Context**: Apakah lebih murah memperbaiki 13 file schema atau menulis ulang? Decision ini menentukan semua keputusan lain.

**Options Considered**
1. **Fix existing schema** — perbaiki integer→bigint, tambah FK, tambah indexes. Bertahan pada keputusan desain yang sudah ada (shared DB, row-level tenant isolation via `tenantId`).
2. **Redesign from scratch** — ERD baru dari ground up. Tidak ada constraint: waktu rewrite > 2 sprint, risiko regresi tinggi, tidak ada guarantee arsitektur baru lebih baik hanya karena baru.
3. **Incremental redesign** — rewrite hanya tabel bermasalah (tickets, asset_attachments) + add migration baru untuk fix kritis. Midpoint.

**Decision**: **Opsi 3 — Incremental redesign.**

**Rationale**: Schema core (assets, users, tenant) sudah tepat arahnya. Yang rusak adalah: (a) execution gaps — integer/bigint, missing FKs, (b) missing capabilities — soft-delete, indexes, cascade. Fix bukan rewrite. Architecture underlying (shared DB + row-level tenant isolation) sudah benar untuk B2B SaaS <100k tenants. Tidak ada business reason mengganti ini.

**Trade-offs**: Beberapa keputusan desain lama (mis. `serial()` di tickets) akan konsisten tapi tetap sebagai integer — acceptable, upgrade nanti saat rebuild tickets module.

---

## ADR-DB-002: ID Strategy — bigint vs UUID

**Options Considered**
1. **bigserial / bigint everywhere** — PostgreSQL native, compact (8 byte), monotonic insert, index-bleeding minimal. Cons: tidak readable; migrasi dari `serial()` perlu cast di beberapa tempat.
2. **UUID v7** — URL-safe, globally unique, sortable by time. Cons: 16 byte per row (double), GIN index berat, cold insert fragmentation.
3. **UUID v4** — tidak sortable — eliminasi.

**Decision**: **bigint (bigserial) tetap untuk hampir semua tabel; UUID hanya untuk token/secret yang harus unguessable** (`asset_identities.token`, `users.password_reset_token`, `refresh_tokens.jti`).

**Rationale**: Untuk B2B internal, bigint memberikan semua benefit: compact, fast, monotonic. Row count target 10M+ assets: 8 byte vs 16 byte × 10M = 80MB tabungan. UUID hanya untuk domain yang security-critical (token harus tidak guessable — ini sudah di-spec `asset_identified.token`).

**Trade-offs**: Jika future requirement berubah ke distributed generation atau multi-region primary, reassess. Neon sudah mendukung это.

---

## ADR-DB-003: Tenant Isolation — Fix Cross-Tenant Vulnerability

**Context**: `asset_identities` punya `tenantId: bigint('tenant_id', { mode: 'number' })` tanpa `.notNull().references(() => tenants.id)`. Ini berarti: query tanpa tenant filter akan return row tanpa FK enforcement; row-level tenant isolation sepenuhnya bergantung pada aplikasi (repository layer), bukan database. Di Postgres shared DB, ini berarti: satu bug di repository = cross-tenant data leak.

**Options Considered**
1. **Enforce di application layer saja** — repository pattern wajib filter tenantId; DB tanpa constraint. Cons: defense-in-depth hilang; satu developer mistake = breach.
2. **DB-level NOT NULL + FK reference** — constraint di DB; query tanpa tenantId akan error foreign key violation. Cons: migrasi perlu careful sequencing (tenant harus ada dulu).
3. **Postgres Row-Level Security (RLS)** — policy per table; setiap query otomatis prepend tenant filter. Cons: Neon HTTP driver tidak native support RLS session变量; menambah kompleksitas operacional.

**Decision**: **Opsi 2 + layer application tetap** — DB constraint + aplikasi sebagai second line defense.

**Migration**: Tabel `asset_identities` perlu migration: tambah `NOT NULL REFERENCES tenants` pada `tenant_tenant`. Tabel lain sudah memiliki FK (`assets`, `users`, `asset_events`). Verifikasi semua tabel business dengan `grep -r "tenantId" apps/api/src/db/schema/`.

**Trade-offs**: Setiap migration harus run dalam urutan topologically (tenant → semua yang reference tenant). Sudah dikelola via Drizzle migration journal.

---

## ADR-DB-004: Cascade Delete Strategy

**Context**: Tidak ada `onDelete` di FK. Orphaned records bila parent dihapus.

**Decision**: **Cascade on child→parent untuk lifecycle yang tight-coupled; set null untuk yang loose-coupled.**
- `users.tenantId` → `tenants.id`: **restrict** (tidak boleh hapus tenant yang punya users — harus deaktivasi).
- `assets.tenantId` → `tenants.id`: **restrict** (set null akan orphan aset).
- `asset_assignments.assetId` → `assets.id`: **cascade** (asset dihapus → assignment tidak ada meaning).
- `asset_events.assetId` → `assets.id`: **cascade** (event log tetap berguna untuk audit, tapi orphan audit trail dimaklumi — cascade keep the DB clean).
- `asset_attachments.assetId` → `assets.id`: **cascade** (file orphaned in R2 anyway).
- `ticket_comments.ticketId` → `tickets.id`: **cascade** (sudah ada `onDelete: 'cascade'` di migration 0012).

**Migration**: Add `onDelete` ke setiap relation di schema. Migration baru.

---

## ADR-DB-005: Soft Delete Pattern

**Context**: Assets tidak punya `deletedAt`. User sudah punya. Asset events tidak masuk soft-delete scope (audit trail immutable).

**Decision**: **Add deletedAt ke assets, asset_categories, locations, departments.** Assets di-retire dengan status `retired` + `deletedAt` timestamp — dual mechanism (status untuk UI logic, deletedAt untuk query scope). User tetap soft-delete (biaya perubahan role, audit trail tetap valid).

**Migration**: `ALTER TABLE assets ADD COLUMN deleted_at TIMESTAMP;` — non-breaking. Semua query existing tetap jalan; hanya tambah WHERE clause `(deleted_at IS NULL)` untuk active records.

---

## ADR-DB-006: Refresh Token Storage (Auth critical path)

**Context**: RFC-001 ADR-BACKEND-005 butuh tempat menyimpan refresh token untuk rotation + revocation.

**Decision**: **Tabel `refresh_tokens` di DB schema baru.**

```sql
CREATE TABLE refresh_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti         VARCHAR(255) NOT NULL UNIQUE,   -- UUID untuk revocation
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMP,                        -- NULL = active
  user_agent  VARCHAR(255),
  ip_address  VARCHAR(45)
);
CREATE INDEX ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
CREATE INDEX ON refresh_tokens(jti);
```

**Rationale**: Rotation dengan jti: old token di-revoke (revoked_at = NOW()), new token issued. Max 1 active token per user (atau per device dengan `user_agent`). Revocation list di-memory Set temporary (untuk speed) tapi persist di DB untuk session across restarts.

---

## ADR-DB-007: Index Strategy

**Context**: Missing composite indexes di FK utama. Query tanpa index = sequential scan = lambat saat tenant scale.

**Decision**: **Tambah composite indexes di (tenantId, id) + (tenantId, created_at) untuk semua business tables.** Single-column tenantId index juga di setiap tabel business.

Minimum required (migration baru):
```sql
-- sudah ada di asset_events, audit_logs
-- perlu ditambah:
CREATE INDEX IF NOT EXISTS assets_tenant_id_idx          ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS assets_tenant_code_idx         ON assets(tenant_id, asset_code); -- unique constraint already does this
CREATE INDEX IF NOT EXISTS users_tenant_id_idx           ON users(tenant_id);
CREATE INDEX IF NOT EXISTS tickets_tenant_id_idx         ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS asset_identities_tenant_id_idx ON asset_identities(tenant_id);
CREATE INDEX IF NOT EXISTS asset_assignments_tenant_id_idx ON asset_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS notifications_tenant_id_idx  ON notifications(tenant_id);
```

**Trade-offs**: Write overhead negligible (index per-tenant inserts); read improvement signifikan untuk query scoped.

---

## ADR-DB-008: tickets Schema Fix (from serial to bigserial)

**Context**: `tickets.id` adalah `serial()` (integer, max ~2.1B), sementara `users.id`, `tenants.id` adalah `bigserial()`.

**Decision**: **Ubah `tickets.id` ke `bigserial()` + `tenantId` → `bigint`.** Migration non-breaking untuk read; write API tidak perlu berubah (integer coerce ke bigint). Priority: HIGH tapi non-blocking karena current max tickets jauh dari integer overflow.

**Migration**: `ALTER TABLE tickets ALTER COLUMN id TYPE BIGINT USING id;` + `ALTER COLUMN tenant_id TYPE BIGINT;` via migration baru.

---

## ERD (Simplified — Business Domain)

```mermaid
erDiagram
    tenants {
        bigint id PK
        varchar name
        varchar slug UK
        tenant_status status
        timestamp trial_ends_at
        timestamp created_at
        timestamp updated_at
    }
    roles {
        bigint id PK
        varchar name
        varchar slug UK
        timestamp created_at
        timestamp updated_at
    }
    users {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        varchar name
        varchar email
        varchar password
        bigint role_id FK roles(id) NOT NULL
        user_status status
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }
    assets {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        varchar asset_code
        varchar name
        bigint category_id FK
        bigint location_id FK
        bigint department_id FK
        bigint current_assigned_user_id FK
        assignment_type assignment_type
        asset_status status
        asset_condition condition
        varchar qr_code_token
        integer version
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }
    asset_identities {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        bigint asset_id FK assets(id) NOT NULL
        identity_medium medium
        varchar token UK
        varchar hash
        identity_status status
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
        timestamp updated_at
    }
    asset_events {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        bigint asset_id FK assets(id) NOT NULL
        asset_event_type event_type
        event_category category
        event_severity severity
        jsonb old_value
        jsonb new_value
        bigint actor_user_id FK
        varchar actor_name_snapshot
        text note
        varchar correlation_id
        timestamp created_at
    }
    asset_assignments {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        bigint asset_id FK assets(id) NOT NULL
        assignment_type assignment_type
        bigint user_id FK
        bigint department_id FK
        timestamp assigned_at
        timestamp returned_at
        bigint created_by FK
    }
    tickets {
        serial id PK
        integer tenant_id FK tenants(id) NOT NULL
        varchar title
        text description
        varchar category
        ticket_priority priority
        ticket_status status
        integer asset_id FK
        integer creator_id FK NOT NULL
        integer assigned_to_id FK
        integer version
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }
    maintenance_jobs {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        bigint asset_id FK assets(id) NOT NULL
        varchar title
        maintenance_status status
        maintenance_priority priority
        timestamp scheduled_at
        timestamp completed_at
        bigint created_by FK
        timestamp created_at
        timestamp updated_at
    }
    notifications {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        bigint user_id FK
        varchar type
        varchar title
        text message
        boolean is_read
        timestamp created_at
    }
    audit_logs {
        bigint id PK
        bigint tenant_id FK tenants(id) NOT NULL
        varchar entity_type
        bigint entity_id
        varchar action
        bigint user_id FK
        jsonb old_data
        jsonb new_data
        varchar ip_address
        timestamp created_at
    }
    refresh_tokens {
        bigint id PK
        bigint user_id FK users(id) ON DELETE CASCADE NOT NULL
        varchar jti UK
        timestamp expires_at
        timestamp created_at
        timestamp revoked_at
        varchar user_agent
        varchar ip_address
    }

    tenants ||--o{ users : "tenant"
    tenants ||--o{ assets : "tenant"
    tenants ||--o{ asset_events : "tenant"
    tenants ||--o{ asset_identities : "tenant"
    tenants ||--o{ asset_assignments : "tenant"
    tenants ||--o{ tickets : "tenant"
    tenants ||--o{ maintenance_jobs : "tenant"
    tenants ||--o{ notifications : "tenant"
    tenants ||--o{ audit_logs : "tenant"
    users ||--o{ assets : "current_assigned"
    users ||--o{ asset_events : "actor"
    users ||--o{ asset_assignments : "assigned"
    users ||--o{ asset_assignments : "created_by"
    users ||--o{ notifications : "recipient"
    users ||--o{ refresh_tokens : "owns"
    roles ||--o{ users : "grants"
    assets ||--o{ asset_identities : "identifies"
    assets ||--o{ asset_events : "has"
    assets ||--o{ asset_assignments : "assigned"
    assets ||--o{ maintenance_jobs : "scheduled_for"
    assets ||--o{ tickets : "related_to"
    tenants ||--|| roles : "system"
    tickets ||--o{ ticket_comments : "has"
```

## Migration Checklist (RFC-003 Execution)

| # | Migration | Priority | Breaking | Risk |
|---|---|---|---|---|
| M1 | Fix asset_Identities tenantId FK constraint | CRITICAL | Low | Medium |
| M2 | Add cascade deletes ke schema | HIGH | Low | Low |
| M3 | Add deletedAt ke assets + reference tables | HIGH | Low | Low |
| M4 | Create refresh_tokens table | CRITICAL | Low | Low |
| M5 | Add tenantId indexes (all business tables) | HIGH | Low | Low |
| M6 | tickets id/tenantId → bigint | MEDIUM | Low | Medium |
| M7 | Hapus Prisma dependencies | LOW | None | None |

Execution order: M4 (refresh_tokens) dulu agar auth dapat diimplement paralel; M1 (asset_identities) kedua karena celah keamanan; lalu M2-M3-M5; M6-M7 dapat kapan saja.