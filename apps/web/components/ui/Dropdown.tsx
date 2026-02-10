'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  align = 'right',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleItemClick = (item: DropdownItem) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`dropdown ${className}`} ref={containerRef}>
      <button
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </button>

      {isOpen && (
        <div className={`dropdown-menu dropdown-align-${align}`} role="menu">
          {items.map((item, index) => (
            <button
              key={index}
              className={`dropdown-item ${item.danger ? 'dropdown-item-danger' : ''}`}
              role="menuitem"
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
              <span className="dropdown-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .dropdown {
          position: relative;
          display: inline-flex;
        }

        .dropdown-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: inherit;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          z-index: 500;
          min-width: 180px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 0.375rem;
          animation: dropdown-in 0.15s ease-out;
          overflow: hidden;
        }

        .dropdown-align-left {
          left: 0;
        }

        .dropdown-align-right {
          right: 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          font-family: inherit;
          font-size: 0.9375rem;
          color: var(--color-text-main);
          cursor: pointer;
          transition: background 0.15s ease;
          text-align: left;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .dropdown-item-danger {
          color: hsl(0, 72%, 51%);
        }

        .dropdown-item-danger:hover {
          background: hsla(0, 72%, 51%, 0.1);
        }

        .dropdown-item-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          color: var(--color-text-muted);
        }

        .dropdown-item-danger .dropdown-item-icon {
          color: hsl(0, 72%, 51%);
        }

        @keyframes dropdown-in {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
