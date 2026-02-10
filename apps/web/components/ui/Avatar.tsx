'use client';

import React, { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

const fontSizeMap: Record<AvatarSize, string> = {
  xs: '0.625rem',
  sm: '0.75rem',
  md: '0.875rem',
  lg: '1.25rem',
  xl: '1.75rem',
};

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 40%)`;
}

export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  online,
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const px = sizeMap[size];
  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getColorFromName(name) : 'var(--color-border)';

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {showImage ? (
        <img
          className="avatar-img"
          src={src}
          alt={alt || name}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="avatar-fallback" style={{ background: bgColor }}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span className={`avatar-status ${online ? 'online' : 'offline'}`} />
      )}

      <style jsx>{`
        .avatar {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: ${px}px;
          height: ${px}px;
          border-radius: 50%;
          overflow: visible;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${fontSizeMap[size]};
          font-weight: 600;
          color: #fff;
          user-select: none;
        }

        .avatar-status {
          position: absolute;
          bottom: 0;
          right: 0;
          width: ${Math.max(px * 0.25, 8)}px;
          height: ${Math.max(px * 0.25, 8)}px;
          border-radius: 50%;
          border: 2px solid var(--color-bg);
        }

        .avatar-status.online {
          background: hsl(142, 71%, 45%);
        }

        .avatar-status.offline {
          background: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
