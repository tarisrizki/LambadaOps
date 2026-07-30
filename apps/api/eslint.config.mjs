// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // ─── Files ──────────────────────────────────────────────────────────────
    files: ['src/**/*.ts'],
    rules: {
      // ─── Tenant Isolation Enforcement (ADR-002 Layer 2) ───────────────────
      //
      // The `db` instance (Drizzle client) MUST only be imported inside:
      //   - src/repositories/  (the only layer permitted to query the DB)
      //   - src/db/            (schema + client definition)
      //
      // Routes, services, middleware, and lib files must NEVER import `db`
      // directly. They must receive data through repository methods, which
      // automatically enforce tenant isolation via TenantContext.
      //
      // Violation of this rule is a SECURITY issue, not just a style issue.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Disallow importing from src/db outside of allowed directories
              regex: '^\\.{1,2}.*[\\\\/]db[\\\\/]',
              message:
                '[Tenant Isolation] Direct import from src/db/ is not allowed here. ' +
                'Only files in src/repositories/ and src/db/ may import the Drizzle client. ' +
                'Use a repository method instead. (ADR-002 Layer 2)',
            },
          ],
        },
      ],

      // ─── TypeScript Strictness ───────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    // ─── Exceptions for allowed db consumers ────────────────────────────────
    files: ['src/repositories/**/*.ts', 'src/db/**/*.ts'],
    rules: {
      // These files are explicitly permitted to import from src/db/
      'no-restricted-imports': 'off',
    },
  },
  {
    // ─── Ignored paths ──────────────────────────────────────────────────────
    ignores: ['dist/**', 'node_modules/**', 'drizzle/**'],
  },
);
