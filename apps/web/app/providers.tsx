'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '../lib/providers/QueryProvider';
import { AuthProvider } from '../lib/providers/AuthProvider';
import { WebSocketProvider } from '../lib/providers/WebSocketProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
