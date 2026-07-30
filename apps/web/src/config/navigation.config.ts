import { SystemRoles } from '@/lib/roles';
import { LayoutDashboard, Wrench, Ticket, Upload, Download, ClipboardList, type LucideIcon } from 'lucide-react';

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
    allowedRoles: [SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN, SystemRoles.EMPLOYEE] 
  },
  { 
    name: 'Assets', 
    href: '/assets', 
    icon: Wrench, 
    allowedRoles: [SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN] 
  },
  { 
    name: 'Assignments', 
    href: '/assignments', 
    icon: ClipboardList, 
    allowedRoles: [SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER] 
  },
  { 
    name: 'Tickets', 
    href: '/tickets', 
    icon: Ticket, 
    allowedRoles: [SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN, SystemRoles.EMPLOYEE] 
  },
  { 
    name: 'Maintenance', 
    href: '/maintenance', 
    icon: Wrench, 
    allowedRoles: [SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN] 
  },
  { 
    name: 'Import', 
    href: '/import', 
    icon: Upload, 
    allowedRoles: [SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER] 
  },
  { 
    name: 'Export', 
    href: '/export', 
    icon: Download, 
    allowedRoles: [SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER] 
  },
];
