// ============================================================================
// 1Ummah Mobile — useAuth hook
// Convenience wrapper that reads from AuthContext and throws if used outside
// the <AuthProvider>.
// ============================================================================

import { useContext } from 'react';
import { AuthContext } from '../lib/auth';
import type { AuthContextValue } from '../lib/auth';

/**
 * Returns the current authentication state and helpers.
 *
 * Must be called inside an `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error(
      'useAuth() must be used within an <AuthProvider>. ' +
        'Wrap your app root with <AuthProvider> from src/lib/auth.tsx.',
    );
  }
  return context;
}
