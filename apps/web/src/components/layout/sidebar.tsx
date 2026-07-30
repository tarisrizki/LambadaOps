import { NAVIGATION } from '@/config/navigation.config';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { logout, claims } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">LambadaOps</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {NAVIGATION.filter((item) => claims && item.allowedRoles.includes(claims.roleId)).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="mb-4 text-xs text-muted-foreground">
          <p>Tenant ID: {claims?.tenantId}</p>
          <p>Role: {claims?.roleId}</p>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
