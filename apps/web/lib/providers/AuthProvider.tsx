'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, setAccessToken } from '../api-client';
import type { User } from '@1ummah/shared';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: { username: string; password: string; displayName?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get<{ data: User }>('/api/v1/auth/me', { requireAuth: true });
      setUser(res.data);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ data: { accessToken: string; expiresIn: number } }>(
      '/api/v1/auth/login',
      { username, password }
    );
    setAccessToken(res.data.accessToken);
    await fetchUser();
  };

  const register = async (input: { username: string; password: string; displayName?: string; email?: string }) => {
    const res = await api.post<{ data: { accessToken: string; expiresIn: number } }>(
      '/api/v1/auth/register',
      input
    );
    setAccessToken(res.data.accessToken);
    await fetchUser();
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout', undefined, { requireAuth: true });
    } catch {
      // Ignore errors on logout
    }
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
