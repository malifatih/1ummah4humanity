'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="brand-title">1Ummah</h1>
          <p className="brand-subtitle">Connect Globally</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Sign in</h2>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button type="button" className="btn-outline btn-full btn-wallet" disabled>
            Connect Wallet (Coming Soon)
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/register">Sign up</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .brand-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--color-brand), hsl(var(--hue-brand-accent), 100%, 60%));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-subtitle {
          color: var(--color-text-muted);
          margin-top: 0.5rem;
        }

        .auth-form {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 2rem;
        }

        .auth-form h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .auth-error {
          background: hsla(0, 80%, 50%, 0.15);
          border: 1px solid hsla(0, 80%, 50%, 0.3);
          color: hsl(0, 80%, 70%);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          color: var(--color-text-main);
          font-size: 1rem;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--color-brand);
        }

        .btn-full {
          width: 100%;
          padding: 0.85rem;
          font-size: 1rem;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-main);
          padding: 0.85rem;
          border-radius: var(--radius-full);
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .btn-outline:hover {
          background: var(--color-bg-card);
        }

        .btn-outline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-wallet {
          margin-top: 0;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          color: var(--color-text-muted);
          font-size: 0.85rem;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        .auth-divider span {
          padding: 0 1rem;
        }

        .auth-switch {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--color-text-muted);
        }

        .auth-switch a {
          color: var(--color-brand);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
