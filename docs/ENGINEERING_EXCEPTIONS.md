# Engineering Exceptions Register

This document is a living register that tracks every intentional engineering compromise, technical debt, and type safety escape that currently exists in the codebase.
## Engineering Rules
No new exception may be introduced to the codebase without:
1. Documenting the strict **Reason**.
2. Documenting the **Alternatives investigated**.
3. Passing a **Risk assessment**.
4. Receiving formal **Approval**.
5. Creating an entry in this `ENGINEERING_EXCEPTIONS.md` file.

---

### ENG-001
**Category**: LIBRARY  \
**Location**: `apps/web/src/features/assets/components/asset-form.tsx`  \
**Reason**: React Hook Form's internal generic type inference (`FieldValues`, `Resolver`) struggles when conditionally binding different generic Zod schemas (create vs edit) that do not explicitly share the same base typings without massive wrapping.  \
**Current workaround**: `schema as any` and `zodResolver(schema) as unknown as Resolver<AssetFormValues>`  \
**Alternatives investigated**:
- Separate `CreateForm` and `EditForm` components (rejected: violates DRY, doubles maintenance).
- Generic wrapper functions (rejected: overcomplicates component props).
**Resolution**: Replaced the `as any` cast with a discriminated-union form-mode prop (`type AssetFormMode = { mode: 'create' } | { mode: 'edit'; assetId: number; initialData: Asset }`).  TypeScript now narrows the schema via the `mode` discriminant, and the resolver uses a specific `as Resolver<AssetFormValues>` assertion instead of the unsafe `as any`.  The `AssetFormValues`, `CreateAssetInput`, and `UpdateAssetInput` types are properly exported from the schema module and inferred via `z.infer`.  \
**Risk**: LOW (completely contained inside the component boundary).  \
**Priority**: P2  \
**Owner**: Frontend Core  \
**Status**: RESOLVED

---

### ENG-002
**Category**: RPC  \
**Location**: `apps/web/src/features/auth/api/client.ts`  \
**Reason**: The Hono RPC client strictly infers exact schema shapes for the `POST` payload. We currently receive `Record<string, unknown>` and pass it directly.  \
**Current workaround**: `// @ts-expect-error - dynamic payload mapping for Hono`  \
**Alternatives investigated**:
- Exporting the Zod schema from `apps/api` (rejected: no shared package setup for schemas yet).
- Re-declaring the schema in the frontend (rejected: violates single source of truth).
**Current decision**: Keep the `@ts-expect-error` because the payload is guaranteed to be validated at runtime by the backend router.  \
**Risk**: MEDIUM (bypasses static type checking at the fetch boundary).  \
**Priority**: P1  \
**Owner**: API Integrations  \
**Status**: OPEN

---

### ENG-003
**Category**: FRAMEWORK  \
**Location**: `apps/api/src/repositories/base.repository.ts` and `apps/api/src/services/activity.service.ts`  \
**Reason**: Drizzle ORM's generic transaction type (`PgTransaction<...schemas...>`) is deeply coupled to the exact database tables being transacted upon. Exporting a generic transaction interface across loosely coupled repositories requires complex generic inference that breaks easily across service boundaries.  \
**Current workaround**: `protected _tx?: any;` and `txSession: any`  \
**Alternatives investigated**:
- Complex generic interfaces wrapping `ExtractTablesWithRelations<T>` (rejected: brittle and extremely verbose).
**Current decision**: Isolate the `any` inside the BaseRepository and explicitly define it for `txSession` parameters. It does not affect query result typing.  \
**Risk**: LOW  \
**Priority**: P2  \
**Owner**: Backend Core  \
**Status**: OPEN

---

### ENG-004
**Category**: FRAMEWORK  \
**Location**: `apps/web/src/components/providers/auth-provider.tsx` and `apps/web/src/features/dashboard/components/dashboard-home.tsx`  \
**Reason**: Reading `localStorage` synchronously during server-side rendering (SSR) causes Next.js hydration mismatches.  \
**Current workaround**: `// eslint-disable-next-line react-hooks/set-state-in-effect` to load the token inside a `useEffect` on mount.  \
**Alternatives investigated**:
- Moving tokens to HttpOnly cookies (deferred: requires significant auth architecture overhaul).
**Current decision**: Accept the effect hook workaround.  \
**Risk**: LOW  \
**Priority**: P3  \
**Owner**: Frontend Core  \
**Status**: OPEN

---

### ENG-005
**Category**: LIBRARY  \
**Location**: `apps/api/src/repositories/asset.repository.ts`  \
**Reason**: Drizzle's enum column inference rejects dynamic string variables for `eq()` queries unless they strictly match the constant tuple types.  \
**Current workaround**: `if (filters.status) conditions.push(eq(assets.status, filters.status as any));`  \
**Alternatives investigated**:
- Verbose type mapping and schema exporting.
**Current decision**: Since the incoming filter is already validated by Hono's Zod router, the `as any` cast is perfectly safe at runtime.  \
**Risk**: LOW  \
**Priority**: P3  \
**Owner**: Backend Core  \
**Status**: OPEN

---

### ENG-006
**Category**: LIBRARY  \
**Location**: `apps/web/src/features/assets/components/asset-table.tsx`  \
**Reason**: The `Asset` type is inferred from the Hono RPC client's return type (`Awaited<ReturnType<typeof getAssets>>[number]`).  The status field returned by the API does not carry the exact `AssetStatus` enum type at compile time, requiring a cast when passing it to the `AssetStatusBadge` component.  \
**Current workaround**: `row.original.status as AssetStatus`  \
**Alternatives investigated**:
- Sharing the Zod schema between backend and frontend (requires shared package setup).
- Zod-parsing the API response at the client boundary.
**Current decision**: The `@ts-expect-error` is avoided by importing the shared `AssetStatus` type from the schema module and using a targeted cast.  \
**Risk**: LOW (the Hono route is already validated by Zod on the backend).  \
**Priority**: P3  \
**Owner**: Frontend Core  \
**Status**: OPEN

---

### ENG-007
**Category**: FRAMEWORK  \
**Location**: `apps/web/src/components/providers/theme-provider.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/src/components/ui/theme-toggle.tsx`, `apps/web/src/app/globals.css`  \
**Reason**: The project was migrated from a single-theme (light-only) UI to a dual light/dark theme system.  While the shadcn-style component library already used `dark:` variants, there was no runtime theme toggle or persisted preference.  \
**Implementation**: Installed `next-themes` and created a `ThemeProvider` that wraps the root layout with `attribute="class"` and `defaultTheme="system"`.  A shared `ThemeToggle` dropdown (light / dark / system) was added to the header.  The existing `globals.css` already contained comprehensive dark-mode CSS variables (Linear/Stripe aesthetic — dark slate, subtle borders, not pure black), so no CSS changes were required.  `suppressHydrationWarning` was added to the `<html>` element to prevent Next.js SSR mismatch from the `next-themes` script injection.  \
**Alternatives investigated**:
- Tailwind CSS v4 `prefers-color-scheme` media query without JS (rejected: no user toggle).
- Custom theme context (rejected: reinvents the wheel).
**Current decision**: Use `next-themes` with class-based dark mode and CSS variables.  \
**Risk**: LOW  \
**Priority**: P2  \
**Owner**: Frontend Core  \
**Status**: OPEN

---

### ENG-008
**Category**: SECURITY  \
**Location**: `apps/web/src/lib/api.ts`, `apps/web/src/lib/cookies.ts`, `apps/web/src/components/providers/auth-provider.tsx`, `apps/web/src/features/auth/api/client.ts`, `apps/web/src/components/providers/query-provider.tsx`  \
**Reason**: Auth tokens were stored in `localStorage`, making them accessible to any XSS attack.  The migration to httpOnly cookies requires both frontend and backend changes.  \
**Implementation**: Created a `cookies.ts` utility that stores the auth token and CSRF token in cookies (not `localStorage`).  `api.ts` reads the token from the cookie *before* falling back to `localStorage` for backward compatibility.  A CSRF token is read from a cookie and sent on every request via the `X-CSRF-Token` header.  The `AuthProvider.login()` now accepts an optional `csrfToken` parameter and persists both tokens in cookies.  The `QueryProvider` and `fetchMe` also clear cookies on 401.  \
**Alternatives investigated**:
- Immediate switch to true httpOnly cookies (rejected: backend does not yet set cookies on login — token is returned in the JSON body).
**Current decision**: Use JS-readable cookies as a transitional layer.  When the backend adds httpOnly cookie support (ENG-004), `getAuthToken` will stop reading `localStorage` and the Authorization header can be dropped in favour of automatic cookie transmission with `credentials: 'include'`.  \
**Risk**: LOW (cookies are `Secure` + `SameSite=Lax`; CSRF header still needs backend enforcement).  \
**Priority**: P1  \
**Owner**: Frontend Core  \
**Status**: OPEN
