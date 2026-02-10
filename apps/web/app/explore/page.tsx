'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingUp, FileText, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import { useExploreFeed } from '@/lib/hooks/usePosts';
import { api } from '@/lib/api-client';
import type { Post } from '@1ummah/shared';

type ExploreTab = 'trending' | 'posts' | 'people';

interface TrendingHashtag {
  id: string;
  tag: string;
  postCount: number;
}

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<ExploreTab>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement>(null);

  const exploreFeed = useExploreFeed();

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['explore', 'trending'],
    queryFn: () => api.get<{ data: TrendingHashtag[] }>('/api/v1/feed/trending/hashtags'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: suggestedData, isLoading: suggestedLoading } = useQuery({
    queryKey: ['explore', 'people'],
    queryFn: () => api.get<{ data: SuggestedUser[] }>('/api/v1/users/suggested'),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'people',
  });

  const trending = trendingData?.data ?? [];
  const suggestedUsers = suggestedData?.data ?? [];

  const posts: Post[] = exploreFeed.data?.pages.flatMap((page) => page.data) ?? [];

  const loadMore = useCallback(() => {
    if (exploreFeed.hasNextPage && !exploreFeed.isFetchingNextPage) {
      exploreFeed.fetchNextPage();
    }
  }, [exploreFeed]);

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
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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
          <h2>Explore</h2>
          <form className="explore-search" onSubmit={handleSearch}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search posts, people, and hashtags"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div className="feed-tabs">
            <button
              className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              <TrendingUp size={16} />
              Trending
            </button>
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
          </div>
        </header>

        <div className="feed-content">
          {/* Trending Tab */}
          {activeTab === 'trending' && (
            <>
              {trendingLoading && (
                <div className="loading-state">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-trending">
                      <div className="skeleton-line short" />
                      <div className="skeleton-line medium" />
                      <div className="skeleton-line short" />
                    </div>
                  ))}
                </div>
              )}

              {!trendingLoading && trending.length === 0 && (
                <div className="empty-state">
                  <TrendingUp size={48} />
                  <h3>Nothing trending yet</h3>
                  <p>Trending topics will appear here when they gain traction.</p>
                </div>
              )}

              {trending.map((hashtag, index) => (
                <div
                  key={hashtag.id}
                  className="trending-row"
                  onClick={() => router.push(`/search?q=${encodeURIComponent('#' + hashtag.tag)}`)}
                >
                  <span className="trending-rank">{index + 1}</span>
                  <div className="trending-info">
                    <p className="trending-meta">Trending</p>
                    <p className="trending-tag">#{hashtag.tag}</p>
                    <p className="trending-count">{formatCount(hashtag.postCount)} posts</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <>
              {exploreFeed.isLoading && (
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

              {!exploreFeed.isLoading && posts.length === 0 && (
                <div className="empty-state">
                  <FileText size={48} />
                  <h3>No posts to explore</h3>
                  <p>Posts from around the community will appear here.</p>
                </div>
              )}

              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {exploreFeed.isFetchingNextPage && (
                <div className="loading-more">
                  <div className="spinner" />
                </div>
              )}

              <div ref={observerRef} className="scroll-sentinel" />
            </>
          )}

          {/* People Tab */}
          {activeTab === 'people' && (
            <>
              {suggestedLoading && (
                <div className="loading-state">
                  {[1, 2, 3, 4].map((i) => (
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

              {!suggestedLoading && suggestedUsers.length === 0 && (
                <div className="empty-state">
                  <Users size={48} />
                  <h3>No people to suggest</h3>
                  <p>Suggested users will appear here as the community grows.</p>
                </div>
              )}

              {suggestedUsers.map((user) => (
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
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .explore-search {
          position: relative;
          margin: 0.75rem 0;
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
        .trending-row {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.15s;
        }
        .trending-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .trending-rank {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text-muted);
          min-width: 2rem;
          text-align: center;
          padding-top: 0.25rem;
        }
        .trending-info {
          flex: 1;
        }
        .trending-meta {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
        .trending-tag {
          font-weight: 700;
          font-size: 1.1rem;
          margin: 2px 0;
        }
        .trending-count {
          font-size: 0.85rem;
          color: var(--color-text-muted);
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
      `}</style>
    </div>
  );
}
