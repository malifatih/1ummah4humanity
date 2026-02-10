'use client';

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  padding?: boolean;
  border?: boolean;
  hover?: boolean;
  glass?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  padding = true,
  border = true,
  hover = false,
  glass = false,
  className = '',
  onClick,
}: CardProps) {
  return (
    <div
      className={`card ${padding ? 'card-padded' : ''} ${border ? 'card-border' : ''} ${hover ? 'card-hover' : ''} ${glass ? 'card-glass' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}

      <style jsx>{`
        .card {
          background: var(--color-bg-card);
          border-radius: var(--radius-md);
          transition: var(--transition-normal);
        }

        .card-padded {
          padding: 1rem;
        }

        .card-border {
          border: 1px solid var(--color-border);
        }

        .card-hover:hover {
          border-color: var(--color-border-hover);
          box-shadow: var(--shadow-sm);
        }

        .card-hover {
          cursor: pointer;
        }

        .card-glass {
          background: var(--color-bg-glass);
          backdrop-filter: var(--glass-blur);
        }
      `}</style>
    </div>
  );
}
