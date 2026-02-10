'use client';

import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

const spinnerSizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const px = spinnerSizeMap[size];

  return (
    <div className={`spinner ${className}`} role="status" aria-label="Loading">
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="spinner-track"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
        />
        <circle
          className="spinner-arc"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <style jsx>{`
        .spinner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          animation: spin 0.8s linear infinite;
        }

        .spinner-track {
          stroke: var(--color-border);
        }

        .spinner-arc {
          stroke: var(--color-brand);
          stroke-dasharray: 45 120;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
