/**
 * Frozen system roles.
 * Do not introduce custom roles or tenant-defined roles.
 * 
 * 1: owner_admin
 * 2: it_manager
 * 3: technician
 * 4: employee
 */
export const SystemRoles = {
  OWNER_ADMIN: 1,
  IT_MANAGER: 2,
  TECHNICIAN: 3,
  EMPLOYEE: 4,
} as const;

export type SystemRole = typeof SystemRoles[keyof typeof SystemRoles];
