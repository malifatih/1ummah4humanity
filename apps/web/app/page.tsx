'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import PostComposer from '@/components/feed/PostComposer';
import { useHomeFeed, useFollowingFeed, useExploreFeed } from '@/lib/hooks/usePosts';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Post } from '@1ummah/shared';

type FeedTab = 'foryou' | 'following';

export default function Home() {
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const { isAuthenticated } = useAuth();
  const observerRef = useRef<HTMLDivElement>(null);

  const homeFeed = useHomeFeed();
  const followingFeed = useFollowingFeed();
  const exploreFeed = useExploreFeed();

  // Use home feed for authenticated "For you", explore for unauthenticated
  const activeFeed = !isAuthenticated
    ? exploreFeed
    : activeTab === 'foryou'
      ? homeFeed
      : followingFeed;

  const posts: Post[] = activeFeed.data?.pages.flatMap((page) => page.data) ?? [];

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (activeFeed.hasNextPage && !activeFeed.isFetchingNextPage) {
      activeFeed.fetchNextPage();
    }
  }, [activeFeed]);

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
          <h2>Home</h2>
          {isAuthenticated && (
            <div className="feed-tabs">
              <button
                className={`tab ${activeTab === 'foryou' ? 'active' : ''}`}
                onClick={() => setActiveTab('foryou')}
              >
                For you
              </button>
              <button
                className={`tab ${activeTab === 'following' ? 'active' : ''}`}
                onClick={() => setActiveTab('following')}
              >
                Following
              </button>
            </div>
          )}
        </header>

        <div className="feed-content">
          {isAuthenticated && <PostComposer />}

          {activeFeed.isLoading && (
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

          {!activeFeed.isLoading && posts.length === 0 && (
            <div className="empty-state">
              <h3>No posts yet</h3>
              <p>{isAuthenticated ? 'Follow some users or create your first post!' : 'Be the first to post!'}</p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {activeFeed.isFetchingNextPage && (
            <div className="loading-more">
              <div className="spinner" />
            </div>
          )}

          <div ref={observerRef} className="scroll-sentinel" />
        </div>
      </main>

      <RightSection />

      <style jsx global>{`
        .layout-grid {
          display: grid;
          grid-template-columns: auto 600px auto;
          min-height: 100vh;
          max-width: var(--max-width);
          margin: 0 auto;
          justify-content: center;
        }
        .main-feed-container {
          border-right: 1px solid var(--color-border);
          min-height: 100vh;
        }
        .feed-header {
          position: sticky;
          top: 0;
          background: rgba(8, 12, 22, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
          padding: 0 1rem;
          z-index: 100;
        }
        .feed-header h2 {
          padding: 1rem 0 0.5rem 0;
          font-size: 1.25rem;
        }
        .feed-tabs {
          display: flex;
          margin-top: 0.5rem;
        }
        .tab {
          flex: 1;
          background: none;
          border: none;
          color: var(--color-text-muted);
          padding: 1rem;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: background 0.15s;
        }
        .tab.active {
          color: var(--color-text-main);
        }
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4rem;
          height: 4px;
          background: var(--color-brand);
          border-radius: var(--radius-full);
        }
        .tab:hover {
          background: var(--color-bg-card);
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-muted);
        }
        .empty-state h3 {
          font-size: 1.5rem;
          color: var(--color-text-main);
          margin-bottom: 0.5rem;
        }
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
        .scroll-sentinel {
          height: 1px;
        }
      `}</style>
    </div>
  );
}
