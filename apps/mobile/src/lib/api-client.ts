// ============================================================================
// 1Ummah Mobile — API Client
// Thin fetch wrapper with automatic token management and 401 handling.
// ============================================================================

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ---------------------------------------------------------------------------
// Base URL — Android emulator uses 10.0.2.2 to reach the host machine's
// localhost; iOS simulator and physical devices use plain localhost.
// ---------------------------------------------------------------------------

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = `http://${LOCALHOST}:4000`;

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

const TOKEN_KEY = '1ummah_access_token';

let memoryToken: string | null = null;

export async function setAccessToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  const stored = await SecureStore.getItemAsync(TOKEN_KEY);
  if (stored) {
    memoryToken = stored;
  }
  return stored;
}

// ---------------------------------------------------------------------------
// Callback invoked on 401 — set by the auth layer so the API client itself
// stays independent of React context.
// ---------------------------------------------------------------------------

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  // Build URL with optional query-string params
  let url = `${API_BASE_URL}${path}`;
  if (options.params) {
    const qs = Object.entries(options.params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  // Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Fetch
  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options.signal,
  });

  // Handle 401 — clear token and notify auth layer
  if (response.status === 401) {
    await setAccessToken(null);
    onUnauthorized?.();
    throw new ApiError('Unauthorized', 401);
  }

  // Handle other non-2xx
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
    } catch {
      // body wasn't JSON — keep statusText
    }
    throw new ApiError(errorMessage, response.status);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API surface
// ---------------------------------------------------------------------------

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },
};

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
