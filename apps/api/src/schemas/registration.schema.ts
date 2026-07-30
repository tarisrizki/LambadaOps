import { z } from 'zod';

/**
 * Zod schema for the tenant registration request.
 *
 * Validation occurs at the route level before RegistrationService is called.
 * Domain-level invariants (slug uniqueness, plan existence) are validated
 * in the service layer.
 */
export const registerSchema = z.object({
  /** Human-readable company/organization name. Min 2 chars. */
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),

  /**
   * URL-safe identifier for the tenant. Used for login (company_slug).
   * Must be lowercase letters, numbers, and hyphens only.
   * Cannot start or end with a hyphen.
   */
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase letters, numbers, and hyphens only (e.g. "my-company")'
    ),

  /** Full name of the first (Owner/Admin) user. Min 2 chars. */
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),

  /** Email of the first (Owner/Admin) user. Must be a valid email format. */
  email: z.string().email('Invalid email address'),

  /** Password for the first user. Min 8 characters. */
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
