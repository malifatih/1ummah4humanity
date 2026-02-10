'use client';

import React from 'react';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const resolvedWidth =
    width !== undefined
      ? typeof width === 'number'
        ? `${width}px`
        : width
      : variant === 'circle'
        ? '40px'
        : '100%';

  const resolvedHeight =
    height !== undefined
      ? typeof height === 'number'
        ? `${height}px`
        : height
      : variant === 'circle'
        ? '40px'
        : variant === 'text'
          ? '1rem'
          : '100px';

  const borderRadius =
    variant === 'circle'
      ? '50%'
      : variant === 'text'
        ? 'var(--radius-sm)'
        : 'var(--radius-md)';

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        borderRadius,
      }}
      aria-hidden="true"
    >
      <style jsx>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--color-bg-card) 25%,
            var(--color-border) 50%,
            var(--color-bg-card) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
