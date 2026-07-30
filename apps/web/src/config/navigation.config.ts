import { SystemRoles } from '@lambadaops/api/src/lib/auth/roles.js';
import { LayoutDashboard, Wrench, Ticket, Upload, Download, type LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: number[];
}

export const NAVIGATION: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    allowedRoles: [SystemRoles.OWNER, SystemRoles.ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN, SystemRoles.EMPLOYEE] 
  },
  { 
    name: 'Assets', 
    href: '/assets', 
    icon: Wrench, 
    allowedRoles: [SystemRoles.OWNER, SystemRoles.ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN] 
  },
  { 
    name: 'Tickets', 
    href: '/tickets', 
    icon: Ticket, 
    allowedRoles: [SystemRoles.OWNER, SystemRoles.ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN, SystemRoles.EMPLOYEE] 
  },
  { 
    name: 'Maintenance', 
    href: '/maintenance', 
    icon: Wrench, 
    allowedRoles: [SystemRoles.OWNER, SystemRoles.ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN] 
  },
  { 
    name: 'Import', 
    href: '/import', 
    icon: Upload, 
    allowedRoles: [SystemRoles.OWNER, SystemRoles.ADMIN, SystemRoles.IT_MANAGER] 
  },
  { 
    name: 'Export', 
    href: '/export', 
    icon: Download, 
    allowedRoles: [SystemRoles.OWNER, SystemRoles.ADMIN, SystemRoles.IT_MANAGER] 
  },
];
