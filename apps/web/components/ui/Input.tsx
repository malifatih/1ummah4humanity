'use client';

import React, { useId } from 'react';
import { Search } from 'lucide-react';

export type InputVariant = 'default' | 'search';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
}

export default function Input({
  label,
  error,
  helperText,
  variant = 'default',
  className = '',
  id: idProp,
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = idProp || generatedId;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className={`input-container ${variant} ${error ? 'has-error' : ''}`}>
        {variant === 'search' && (
          <span className="search-icon">
            <Search size={18} />
          </span>
        )}
        <input
          id={id}
          className={`input-field ${variant}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="input-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${id}-helper`} className="input-helper">
          {helperText}
        </p>
      )}

      <style jsx>{`
        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          width: 100%;
        }

        .input-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          transition: var(--transition-normal);
        }

        .input-container:focus-within {
          border-color: var(--color-brand);
          box-shadow: 0 0 0 3px hsla(210, 100%, 60%, 0.15);
        }

        .input-container.has-error {
          border-color: hsl(0, 72%, 51%);
        }

        .input-container.has-error:focus-within {
          box-shadow: 0 0 0 3px hsla(0, 72%, 51%, 0.15);
        }

        .input-container.search {
          border-radius: var(--radius-full);
        }

        .search-icon {
          display: flex;
          align-items: center;
          padding-left: 0.875rem;
          color: var(--color-text-muted);
        }

        .input-field {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          font-family: inherit;
          color: var(--color-text-main);
          padding: 0.75rem 1rem;
        }

        .input-field.search {
          padding-left: 0.5rem;
        }

        .input-field::placeholder {
          color: var(--color-text-muted);
        }

        .input-error {
          font-size: 0.8125rem;
          color: hsl(0, 72%, 51%);
        }

        .input-helper {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
