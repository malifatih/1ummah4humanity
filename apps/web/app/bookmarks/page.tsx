'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Bookmark } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import { api } from '@/lib/api-client';
import type { Post, PaginatedResponse } from '@1ummah/shared';

export default function BookmarksPage() {
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['bookmarks'],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<PaginatedResponse<Post>>(`/api/v1/posts/bookmarks${params}`, { requireAuth: true });
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const posts: Post[] = data?.pages.flatMap((page) => page.data) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <h2>Bookmarks</h2>
        </header>

        <div className="feed-content">
          {isLoading && (
            <div className="loading-state">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-post">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-content">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="error-state">
              <h3>Something went wrong</h3>
              <p>{error instanceof Error ? error.message : 'Failed to load bookmarks'}</p>
            </div>
          )}

          {!isLoading && !isError && posts.length === 0 && (
            <div className="empty-state">
              <Bookmark size={48} />
              <h3>No bookmarks yet</h3>
              <p>When you bookmark a post, it will show up here for easy access.</p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {isFetchingNextPage && (
            <div className="loading-more">
              <div className="spinner" />
            </div>
          )}

          <div ref={observerRef} className="scroll-sentinel" />
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .feed-header h2 {
          padding: 1rem 0;
          font-size: 1.25rem;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-muted);
        }
        .empty-state h3 {
          font-size: 1.5rem;
          color: var(--color-text-main);
          margin: 1rem 0 0.5rem;
        }
        .error-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-muted);
        }
        .error-state h3 {
          font-size: 1.5rem;
          color: hsl(0, 80%, 60%);
          margin-bottom: 0.5rem;
        }
        .loading-state {
          padding: 1rem;
        }
        .skeleton-post {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-bg-card);
          animation: pulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .skeleton-content { flex: 1; }
        .skeleton-line {
          height: 14px;
          background: var(--color-bg-card);
          border-radius: 4px;
          margin-bottom: 0.5rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-line.short { width: 40%; }
        .skeleton-line.medium { width: 70%; }
        .loading-more {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-brand);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .scroll-sentinel {
          height: 1px;
        }
      `}</style>
    </div>
  );
}
