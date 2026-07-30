export const SystemRoles = {
  OWNER_ADMIN: 1,
  IT_MANAGER: 2,
  TECHNICIAN: 3,
  EMPLOYEE: 4,
} as const;

export type SystemRole = typeof SystemRoles[keyof typeof SystemRoles];
