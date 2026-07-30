'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authQueries } from '@/features/auth/api/queries';

export interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  tenantId: number;
  roleId: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Read from localStorage only on client mount
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken);
    }
    setIsMounted(true);
  }, []);

  const { data: user, isLoading: isQueryLoading, error } = useQuery({
    ...authQueries.me(token || undefined),
    enabled: !!token,
  });

  // Treat as loading while checking localStorage or actively fetching
  const isLoading = !isMounted || (!!token && isQueryLoading);

  useEffect(() => {
    if (error) {
      console.error('Session restore failed:', error);
      localStorage.removeItem('token');
      // Token state update should happen separately to avoid cascading render lint warning
    }
  }, [error]);

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Explicitly refetch to ensure fresh data
    await queryClient.fetchQuery({ ...authQueries.me(newToken) });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    queryClient.removeQueries({ queryKey: authQueries.me().queryKey });
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: (user as UserProfile) || null, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
