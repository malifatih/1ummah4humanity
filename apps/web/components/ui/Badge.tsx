'use client';

import React from 'react';

export type BadgeColor = 'primary' | 'danger';

export interface BadgeProps {
  count?: number;
  maxCount?: number;
  dot?: boolean;
  color?: BadgeColor;
  children?: React.ReactNode;
  className?: string;
}

export default function Badge({
  count,
  maxCount = 99,
  dot = false,
  color = 'danger',
  children,
  className = '',
}: BadgeProps) {
  const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count;
  const showBadge = dot || (count !== undefined && count > 0);

  if (!children) {
    // Standalone badge
    if (!showBadge) return null;
    return (
      <span className={`badge-standalone badge-${color} ${dot ? 'badge-dot' : ''} ${className}`}>
        {!dot && displayCount}

        <style jsx>{`
          .badge-standalone {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            line-height: 1;
            border-radius: var(--radius-full);
            color: #fff;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
          }

          .badge-dot {
            min-width: 10px;
            width: 10px;
            height: 10px;
            padding: 0;
          }

          .badge-primary {
            background: var(--color-brand);
          }

          .badge-danger {
            background: hsl(0, 72%, 51%);
          }
        `}</style>
      </span>
    );
  }

  return (
    <span className={`badge-wrapper ${className}`}>
      {children}
      {showBadge && (
        <span className={`badge badge-${color} ${dot ? 'badge-dot' : ''}`}>
          {!dot && displayCount}
        </span>
      )}

      <style jsx>{`
        .badge-wrapper {
          position: relative;
          display: inline-flex;
        }

        .badge {
          position: absolute;
          top: -4px;
          right: -4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          line-height: 1;
          border-radius: var(--radius-full);
          color: #fff;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border: 2px solid var(--color-bg);
        }

        .badge-dot {
          min-width: 10px;
          width: 10px;
          height: 10px;
          padding: 0;
          top: -2px;
          right: -2px;
        }

        .badge-primary {
          background: var(--color-brand);
        }

        .badge-danger {
          background: hsl(0, 72%, 51%);
        }
      `}</style>
    </span>
  );
}
