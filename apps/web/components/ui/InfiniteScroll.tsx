'use client';

import React from 'react';
import { useInView } from 'react-intersection-observer';
import Spinner from './Spinner';

export interface InfiniteScrollProps {
  children: React.ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
  threshold?: number;
  className?: string;
}

export default function InfiniteScroll({
  children,
  loadMore,
  hasMore,
  loading = false,
  threshold = 0.1,
  className = '',
}: InfiniteScrollProps) {
  const { ref } = useInView({
    threshold,
    onChange: (inView) => {
      if (inView && hasMore && !loading) {
        loadMore();
      }
    },
  });

  return (
    <div className={`infinite-scroll ${className}`}>
      {children}

      {hasMore && (
        <div ref={ref} className="sentinel">
          {loading && (
            <div className="loading-container">
              <Spinner size="md" />
            </div>
          )}
        </div>
      )}

      {!hasMore && (
        <div className="end-message">
          <span>No more items to load</span>
        </div>
      )}

      <style jsx>{`
        .infinite-scroll {
          width: 100%;
        }

        .sentinel {
          width: 100%;
          min-height: 1px;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 0;
        }

        .end-message {
          text-align: center;
          padding: 1.5rem 0;
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
