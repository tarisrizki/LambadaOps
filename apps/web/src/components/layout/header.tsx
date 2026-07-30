import { Bell } from 'lucide-react';
import { useAuth } from '../providers/auth-provider';

export function Header() {
  const { claims } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button would go here */}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Bell className="h-5 w-5" />
          {/* Notification badge mock */}
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {claims?.userId || 'U'}
        </div>
      </div>
    </header>
  );
}
