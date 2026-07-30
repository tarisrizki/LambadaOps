'use client';

import { useAuth } from '@/components/providers/auth-provider';
import React from 'react';

interface RoleGuardProps {
  allowedRoles: number[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { claims, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a skeleton if we want, but usually null is better to avoid layout shift
  }

  if (!claims || !allowedRoles.includes(claims.roleId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function PermissionGuard(props: RoleGuardProps) {
  // Alias for RoleGuard if semantic naming is preferred
  return <RoleGuard {...props} />;
}
