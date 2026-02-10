'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`btn btn-${variant} btn-size-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner">
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        </span>
      ) : icon ? (
        <span className="btn-icon">{icon}</span>
      ) : null}
      {children && <span className="btn-label">{children}</span>}

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: none;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: var(--transition-normal);
          white-space: nowrap;
          line-height: 1;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        /* Sizes */
        .btn-size-sm {
          padding: 0.4rem 0.875rem;
          font-size: 0.8125rem;
        }

        .btn-size-md {
          padding: 0.625rem 1.25rem;
          font-size: 0.9375rem;
        }

        .btn-size-lg {
          padding: 0.875rem 1.75rem;
          font-size: 1.0625rem;
        }

        /* Variants */
        .btn-primary {
          background: var(--color-brand);
          color: #fff;
          box-shadow: 0 4px 12px var(--color-brand-glow);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px var(--color-brand-glow);
          filter: brightness(1.1);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-secondary {
          background: var(--color-bg-card);
          color: var(--color-text-main);
          border: 1px solid var(--color-border);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-border);
          border-color: var(--color-border-hover);
        }

        .btn-danger {
          background: hsl(0, 72%, 51%);
          color: #fff;
          box-shadow: 0 4px 12px hsla(0, 72%, 51%, 0.3);
        }

        .btn-danger:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px hsla(0, 72%, 51%, 0.4);
          filter: brightness(1.1);
        }

        .btn-danger:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-ghost {
          background: transparent;
          color: var(--color-text-main);
        }

        .btn-ghost:hover:not(:disabled) {
          background: hsla(220, 20%, 20%, 0.5);
        }

        .btn-full {
          width: 100%;
        }

        .btn-spinner {
          display: inline-flex;
          animation: spin 1s linear infinite;
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
