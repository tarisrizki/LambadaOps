'use client';

import { NAVIGATION } from '@/config/navigation.config';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogOut, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SidebarNav({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav className="space-y-1 px-2">
      {NAVIGATION.filter((item) => user && item.allowedRoles.includes(user.roleId)).map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Diamond className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">LambadaOps</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <SidebarNav />
      </div>
      <div className="border-t p-4">
        <div className="mb-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Workspace ID: {user?.tenantId}</p>
          <p className="mt-1">Role: {user?.roleId}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
