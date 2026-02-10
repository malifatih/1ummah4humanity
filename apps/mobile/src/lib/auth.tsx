// ============================================================================
// 1Ummah Mobile — Auth Context & Provider
// Manages authentication state, token persistence, and wraps the app with
// React Query and the auth context.
// ============================================================================

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  api,
  getAccessToken,
  setAccessToken,
  setOnUnauthorized,
} from './api-client';
import type {
  ApiResponse,
  AuthTokenResponse,
  User,
} from './types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// React Query client — created once, shared across the app
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------------------------------------------------
  // Logout helper — clears token, user state, and React Query cache.
  // -----------------------------------------------------------------------
  const logout = useCallback(async () => {
    await setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, []);

  // -----------------------------------------------------------------------
  // On mount: check for a stored token and hydrate the user.
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const { data: me } = await api.get<ApiResponse<User>>('/api/v1/auth/me');
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        // Token invalid / expired — clear it silently
        await setAccessToken(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------------------------------------------------
  // Wire the API client's 401 handler to our logout so any unauthorized
  // response forces a full sign-out.
  // -----------------------------------------------------------------------
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      // Don't await — fire-and-forget to avoid blocking the API layer.
      setAccessToken(null);
      queryClient.clear();
    });
    return () => setOnUnauthorized(null);
  }, []);

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------
  const login = useCallback(async (username: string, password: string) => {
    const { data: tokenData } = await api.post<ApiResponse<AuthTokenResponse>>(
      '/api/v1/auth/login',
      { username, password },
    );
    await setAccessToken(tokenData.accessToken);

    const { data: me } = await api.get<ApiResponse<User>>('/api/v1/auth/me');
    setUser(me);
  }, []);

  // -----------------------------------------------------------------------
  // Register
  // -----------------------------------------------------------------------
  const register = useCallback(
    async (username: string, password: string, displayName: string) => {
      const { data: tokenData } = await api.post<ApiResponse<AuthTokenResponse>>(
        '/api/v1/auth/register',
        { username, password, displayName },
      );
      await setAccessToken(tokenData.accessToken);

      const { data: me } = await api.get<ApiResponse<User>>('/api/v1/auth/me');
      setUser(me);
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Memoised context value
  // -----------------------------------------------------------------------
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}
