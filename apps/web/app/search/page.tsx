'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, FileText, Users, Hash } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import { api } from '@/lib/api-client';
import type { Post, PaginatedResponse } from '@1ummah/shared';

type SearchTab = 'posts' | 'people' | 'hashtags';

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
}

interface SearchHashtag {
  id: string;
  tag: string;
  postCount: number;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');
  const [searchInput, setSearchInput] = useState(query);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Posts search
  const postsQuery = useInfiniteQuery({
    queryKey: ['search', 'posts', query],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ q: query });
      if (pageParam) params.set('cursor', pageParam);
      return api.get<PaginatedResponse<Post>>(`/api/v1/search/posts?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!query && activeTab === 'posts',
  });

  // People search
  const peopleQuery = useInfiniteQuery({
    queryKey: ['search', 'users', query],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ q: query });
      if (pageParam) params.set('cursor', pageParam);
      return api.get<PaginatedResponse<SearchUser>>(`/api/v1/search/users?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!query && activeTab === 'people',
  });

  // Hashtag search
  const hashtagsQuery = useInfiniteQuery({
    queryKey: ['search', 'hashtags', query],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ q: query });
      if (pageParam) params.set('cursor', pageParam);
      return api.get<PaginatedResponse<SearchHashtag>>(`/api/v1/search/hashtags?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!query && activeTab === 'hashtags',
  });

  const posts: Post[] = postsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const people: SearchUser[] = peopleQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const hashtags: SearchHashtag[] = hashtagsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const activeQuery = activeTab === 'posts' ? postsQuery : activeTab === 'people' ? peopleQuery : hashtagsQuery;

  const loadMore = useCallback(() => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage();
    }
  }, [activeQuery]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search 1ummah"
              className="search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
          </form>
          <div className="feed-tabs">
            <button
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <FileText size={16} />
              Posts
            </button>
            <button
              className={`tab ${activeTab === 'people' ? 'active' : ''}`}
              onClick={() => setActiveTab('people')}
            >
              <Users size={16} />
              People
            </button>
            <button
              className={`tab ${activeTab === 'hashtags' ? 'active' : ''}`}
              onClick={() => setActiveTab('hashtags')}
            >
              <Hash size={16} />
              Hashtags
            </button>
          </div>
        </header>

        <div className="feed-content">
          {!query && (
            <div className="empty-state">
              <Search size={48} />
              <h3>Search 1Ummah</h3>
              <p>Find posts, people, and hashtags across the community.</p>
            </div>
          )}

          {/* Posts Results */}
          {query && activeTab === 'posts' && (
            <>
              {postsQuery.isLoading && (
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

              {postsQuery.isError && (
                <div className="error-state">
                  <h3>Search failed</h3>
                  <p>{postsQuery.error instanceof Error ? postsQuery.error.message : 'Something went wrong'}</p>
                </div>
              )}

              {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 && (
                <div className="empty-state">
                  <FileText size={48} />
                  <h3>No posts found</h3>
                  <p>Try different keywords or check your spelling.</p>
                </div>
              )}

              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </>
          )}

          {/* People Results */}
          {query && activeTab === 'people' && (
            <>
              {peopleQuery.isLoading && (
                <div className="loading-state">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-post">
                      <div className="skeleton-avatar" />
                      <div className="skeleton-content">
                        <div className="skeleton-line short" />
                        <div className="skeleton-line medium" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {peopleQuery.isError && (
                <div className="error-state">
                  <h3>Search failed</h3>
                  <p>{peopleQuery.error instanceof Error ? peopleQuery.error.message : 'Something went wrong'}</p>
                </div>
              )}

              {!peopleQuery.isLoading && !peopleQuery.isError && people.length === 0 && (
                <div className="empty-state">
                  <Users size={48} />
                  <h3>No people found</h3>
                  <p>Try different keywords or check your spelling.</p>
                </div>
              )}

              {people.map((user) => (
                <div
                  key={user.id}
                  className="user-card"
                  onClick={() => router.push(`/${user.username}`)}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="user-info">
                    <div className="user-name-row">
                      <span className="user-display-name">{user.displayName}</span>
                      {user.isVerified && <span className="verified-badge">&#10003;</span>}
                    </div>
                    <span className="user-handle">@{user.username}</span>
                    {user.bio && <p className="user-bio">{user.bio}</p>}
                    <span className="user-followers">{formatCount(user.followersCount)} followers</span>
                  </div>
                  <button className="btn-follow" onClick={(e) => e.stopPropagation()}>
                    Follow
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Hashtag Results */}
          {query && activeTab === 'hashtags' && (
            <>
              {hashtagsQuery.isLoading && (
                <div className="loading-state">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton-hashtag">
                      <div className="skeleton-line short" />
                      <div className="skeleton-line medium" />
                    </div>
                  ))}
                </div>
              )}

              {hashtagsQuery.isError && (
                <div className="error-state">
                  <h3>Search failed</h3>
                  <p>{hashtagsQuery.error instanceof Error ? hashtagsQuery.error.message : 'Something went wrong'}</p>
                </div>
              )}

              {!hashtagsQuery.isLoading && !hashtagsQuery.isError && hashtags.length === 0 && (
                <div className="empty-state">
                  <Hash size={48} />
                  <h3>No hashtags found</h3>
                  <p>Try different keywords or check your spelling.</p>
                </div>
              )}

              {hashtags.map((hashtag) => (
                <div
                  key={hashtag.id}
                  className="hashtag-card"
                  onClick={() => router.push(`/search?q=${encodeURIComponent('#' + hashtag.tag)}`)}
                >
                  <div className="hashtag-icon-wrapper">
                    <Hash size={24} />
                  </div>
                  <div className="hashtag-info">
                    <span className="hashtag-name">#{hashtag.tag}</span>
                    <span className="hashtag-count">{formatCount(hashtag.postCount)} posts</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeQuery.isFetchingNextPage && (
            <div className="loading-more">
              <div className="spinner" />
            </div>
          )}

          <div ref={observerRef} className="scroll-sentinel" />
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .search-bar {
          position: relative;
          padding: 0.75rem 0;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          background: var(--color-bg-card);
          color: var(--color-text-main);
          font-size: 0.95rem;
          transition: var(--transition-normal);
        }
        .search-input:focus {
          background: var(--color-bg);
          border-color: var(--color-brand);
          outline: none;
        }
        .feed-tabs {
          display: flex;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-size: 0.9rem;
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
        .user-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.15s;
        }
        .user-card:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .user-avatar, .user-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
        }
        .user-avatar-placeholder {
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          color: white;
        }
        .user-info {
          flex: 1;
          min-width: 0;
        }
        .user-name-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .user-display-name {
          font-weight: 700;
        }
        .verified-badge {
          background: var(--color-brand);
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .user-handle {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          display: block;
        }
        .user-bio {
          margin-top: 0.35rem;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .user-followers {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
          display: block;
        }
        .btn-follow {
          background: var(--color-text-main);
          color: var(--color-bg);
          border: none;
          border-radius: var(--radius-full);
          padding: 0.5rem 1.25rem;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: opacity 0.15s;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .btn-follow:hover {
          opacity: 0.85;
        }
        .hashtag-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.15s;
        }
        .hashtag-card:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .hashtag-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: hsla(210, 80%, 50%, 0.12);
          color: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hashtag-info {
          flex: 1;
        }
        .hashtag-name {
          font-weight: 700;
          font-size: 1rem;
          display: block;
        }
        .hashtag-count {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          display: block;
          margin-top: 0.1rem;
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
        .skeleton-hashtag {
          padding: 1rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .skeleton-avatar {
          width: 48px;
          height: 48px;
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="layout-grid">
        <div style={{ width: '275px' }} />
        <main className="main-feed-container">
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading search...
          </div>
        </main>
        <div style={{ width: '350px' }} />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
