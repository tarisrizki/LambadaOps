'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface AccessTokenClaims {
  userId: number;
  tenantId: number;
  roleId: number;
}

interface AuthContextType {
  claims: AccessTokenClaims | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<AccessTokenClaims | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<AccessTokenClaims>(token);
          // Check expiration if we had 'exp' in claims, but for MVP we rely on API 401s
          setClaims(decoded);
        } catch (error) {
          console.error('Invalid token', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode<AccessTokenClaims>(token);
    setClaims(decoded);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setClaims(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ claims, isAuthenticated: !!claims, isLoading, login, logout }}>
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
