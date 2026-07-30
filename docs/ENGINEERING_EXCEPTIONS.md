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
**Category**: LIBRARY  
**Location**: `apps/web/src/features/assets/components/asset-form.tsx`  
**Reason**: React Hook Form's internal generic type inference (`FieldValues`, `Resolver`) struggles when conditionally binding different generic Zod schemas (create vs edit) that do not explicitly share the same base typings without massive wrapping.  
**Current workaround**: `schema as any` and `zodResolver(schema) as unknown as Resolver<AssetFormValues>`  
**Alternatives investigated**:
- Separate `CreateForm` and `EditForm` components (rejected: violates DRY, doubles maintenance).
- Generic wrapper functions (rejected: overcomplicates component props).
**Current decision**: Keep the workaround until React Hook Form supports better runtime schema inference or a cleaner abstraction is adopted.  
**Risk**: LOW (completely contained inside the component boundary).  
**Priority**: P2  
**Owner**: Frontend Core  
**Status**: OPEN

---

### ENG-002
**Category**: RPC  
**Location**: `apps/web/src/features/auth/api/client.ts`  
**Reason**: The Hono RPC client strictly infers exact schema shapes for the `POST` payload. We currently receive `Record<string, unknown>` and pass it directly.  
**Current workaround**: `// @ts-expect-error - dynamic payload mapping for Hono`  
**Alternatives investigated**:
- Exporting the Zod schema from `apps/api` (rejected: no shared package setup for schemas yet).
- Re-declaring the schema in the frontend (rejected: violates single source of truth).
**Current decision**: Keep the `@ts-expect-error` because the payload is guaranteed to be validated at runtime by the backend router.  
**Risk**: MEDIUM (bypasses static type checking at the fetch boundary).  
**Priority**: P1  
**Owner**: API Integrations  
**Status**: OPEN

---

### ENG-003
**Category**: FRAMEWORK  
**Location**: `apps/api/src/repositories/base.repository.ts` and `apps/api/src/services/activity.service.ts`  
**Reason**: Drizzle ORM's generic transaction type (`PgTransaction<...schemas...>`) is deeply coupled to the exact database tables being transacted upon. Exporting a generic transaction interface across loosely coupled repositories requires complex generic inference that breaks easily across service boundaries.  
**Current workaround**: `protected _tx?: any;` and `txSession: any`  
**Alternatives investigated**:
- Complex generic interfaces wrapping `ExtractTablesWithRelations<T>` (rejected: brittle and extremely verbose).
**Current decision**: Isolate the `any` inside the BaseRepository and explicitly define it for `txSession` parameters. It does not affect query result typing.  
**Risk**: LOW  
**Priority**: P2  
**Owner**: Backend Core  
**Status**: OPEN

---

### ENG-004
**Category**: FRAMEWORK  
**Location**: `apps/web/src/components/providers/auth-provider.tsx` and `apps/web/src/features/dashboard/components/dashboard-home.tsx`  
**Reason**: Reading `localStorage` synchronously during server-side rendering (SSR) causes Next.js hydration mismatches.  
**Current workaround**: `// eslint-disable-next-line react-hooks/set-state-in-effect` to load the token inside a `useEffect` on mount.  
**Alternatives investigated**:
- Moving tokens to HttpOnly cookies (deferred: requires significant auth architecture overhaul).
**Current decision**: Accept the effect hook workaround.  
**Risk**: LOW  
**Priority**: P3  
**Owner**: Frontend Core  
**Status**: OPEN

---

### ENG-005
**Category**: LIBRARY  
**Location**: `apps/api/src/repositories/asset.repository.ts`  
**Reason**: Drizzle's enum column inference rejects dynamic string variables for `eq()` queries unless they strictly match the constant tuple types.  
**Current workaround**: `if (filters.status) conditions.push(eq(assets.status, filters.status as any));`  
**Alternatives investigated**:
- Verbose type mapping and schema exporting.
**Current decision**: Since the incoming filter is already validated by Hono's Zod router, the `as any` cast is perfectly safe at runtime.  
**Risk**: LOW  
**Priority**: P3  
**Owner**: Backend Core  
**Status**: OPEN
