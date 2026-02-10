'use client';

import React from 'react';

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabsProps) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-label">{tab.label}</span>
          {activeTab === tab.id && <span className="tab-indicator" />}
        </button>
      ))}

      <style jsx>{`
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }

        .tab-item {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 0.5rem;
          background: none;
          border: none;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .tab-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--color-text-main);
        }

        .tab-item.active {
          color: var(--color-text-main);
          font-weight: 700;
        }

        .tab-label {
          position: relative;
          z-index: 1;
        }

        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 56px;
          height: 4px;
          border-radius: 9999px;
          background: var(--color-brand);
        }
      `}</style>
    </div>
  );
}
