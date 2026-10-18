# RFC-002 — Frontend Stack
**Status**: Proposed · **Date**: 2026-08-05 · **Authors**: Engineering

Kode aktual: Next.js 16.2 (App Router), React 19, TanStack Query v5, Tailwind v4, Base UI (`@base-ui/react`), RHF + Zod, sonner, next-themes, Hono RPC client ke `@lambadaops/api`.

---

## ADR-FRONTEND-001: Meta-framework

**Options Considered**
1. **Next.js 16 App Router** — RSC + streaming, deploy Vercel mulus, sudah dipakai.
2. **Remix/React Router 7** — loader/action model bagus untuk dashboard. Cons: mengganti seluruh routing + API integration; tidak ada keuntungan untuk B2B dashboard yang SEO-irrelevan.
3. **SvelteKit** — delightful DX. Cons: rewrite total frontend, rekrutmen lebih sulit, RPC typing ke Hono tetap harus dijembati. Eliminasi (cost of change ≫ manfaat).

**Decision**: **Next.js 16, pertahankan.**

**Rationale**: Dashboard internal B2B: SEO bukan syarat, tapi struktur App Router + Server Components berguna untuk data-berat. Migration cost ke alternatif tidak pernah bisa dijustifikasi.

**Trade-offs**: Vendor coupling ke Vercel (dimoderasi oleh RFC-004 — target deploy juga Render/Cloudflare-compatible).

**Rollback Plan**: N/A.

---

## ADR-FRONTEND-002: Component Library

**Options**
1. **Base UI + Tailwind (status quo)** — headless, aksesibel, unstyled. Butuh disiplin design system lokal.
2. **shadcn/ui (Radix)** — copy-in components, komunitas besar. Cons: Radix dependency berat; mix API dengan Base UI akan membuat design system tidak konsisten.
3. **Radix UI langsung** — headless mature. Cons: duplikasi peran Base UI.

**Decision**: **Base UI, pertahankan — satu headless library saja.** Jangan campur Radix + Base UI.

**Rationale**: Konsistensi API headless tunggal > kelengkapan template. DESIGN_SYSTEM.md (baru) menjadi kontrak komponen; komponen domain dibungkus di `src/components/ui/`.

**Trade-offs**: Lebih banyak komponen harus dibangun in-house (combobox aset, dsb.).

**Rollback Plan**: Komponen ui/ adalah wrapper — ganti implementasi headless di dalamnya tanpa mengubah konsumen.

---

## ADR-FRONTEND-003: CSS Strategy

**Options**: **Tailwind v4** (keep: token via CSS variables, cepat, tim familiar) vs CSS Modules (verbose, tapi tidak ada class soup) vs Panda CSS (type-safe tokens, compile-time; ecosystem kecil).

**Decision**: **Tailwind v4, pertahankan.** Tambahkan token layer eksplisit di `globals.css` (colors/spacing/typography scale) supaya konsisten dengan DESIGN_SYSTEM.md.

---

## ADR-FRONTEND-004: Forms

**Options**: **RHF + Zod** (keep — sudah di ARCHITECTURE_GUIDE §6, performa uncontrolled, `z.infer` typing) vs **Conform** (progressive enhancement, bagus untuk Server Actions — tapi kontrak project melarang Server Actions sebagai API) vs TanStack Form (masih muda).

**Decision**: **RHF + Zod, pertahankan.** Zero `useForm<any>` di-enforce lint (bukan konvensi lisan).

---

## ADR-FRONTEND-005: Server State

**Options**: **TanStack Query v5** (keep) vs SWR (lebih kecil, fitur lebih sedikit) vs RSC-only untuk sebagian read (incremental adoption untuk halaman read-only seperti dashboard summary).

**Decision**: **TanStack Query sebagai satu-satunya owner server state; RSC hanya untuk initial render halaman statis/marketing** — sama dengan aturan saat ini, dipertahankan. Evaluasi ulang saat Next.js 16 cache modes (`'use cache'`) stabil untuk data tenant.

---

## ADR-FRONTEND-006: Auth di Frontend (CRITICAL)

**Context**: Saat ini token di `localStorage` + Bearer header. Rentan XSS exfiltration; tidak ada flow refresh — 401 memaksa logout diam-diam.

**Options**
1. **httpOnly cookie + `/api/auth/me` bootstrap** (mengikuti RFC-001 ADR-BACKEND-005): `AuthProvider` fetch profile via TanStack Query; tidak ada token di JS sama sekali. CSRF: double-submit token disertakan pada mutasi.
2. Tetap Bearer + refresh queue di client: menutup sebagian celah tapi token tetap readable oleh XSS payload. Gagal di threat model aset SaaS multi-tenant.
3. Managed (Clerk): koheren dengan keputusan backend — ditolak (RFC-001).

**Decision**: **Opsi 1 — cookie + profile bootstrap.** localStorage token dihapus total dari `auth-provider.tsx` dan api client.

**Trade-offs**: Third-party script/api client scripts (mis. import massal dari integration) tetap butuh API-key/Bearer — didukung sebagai fallback eksplisit di middleware.

**Migration Plan**: bersamaan dengan backend; satu PR: (1) middleware cookie-first, (2) client `credentials:'include'`, (3) hapus localStorage, (4) E2E auth.spec.ts diperbarui. 

---

## ADR-FRONTEND-007: Theming

**Options**: **next-themes** (keep; SSR-safe, class strategy) vs pure CSS `prefers-color-scheme` (no dark/light toggle manual — UX regression untuk app internal) vs Radix Themes (bukan headless — konflik dengan ADR-002).

**Decision**: **next-themes, pertahankan.**

---

## Ringkasan Keputusan Frontend

| Decision | Pilihan | Berubah? |
|---|---|---|
| Framework | Next.js 16 | Tidak |
| Components | Base UI saja | Tidak (perkuat konvensi) |
| CSS | Tailwind v4 + token layer | Perkuat |
| Forms | RHF + Zod | Tidak |
| Server state | TanStack Query | Tidak |
| **Auth** | **httpOnly cookie + /api/auth/me** | **Ya — kritikal** |
| Theme | next-themes | Tidak |

Seperti backend: hanya **auth** yang berubah; sisanya penegasan konvensi yang sudah ada di ARCHITECTURE_GUIDE.
