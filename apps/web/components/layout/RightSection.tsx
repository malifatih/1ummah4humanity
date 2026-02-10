'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';

interface TrendingHashtag {
  id: string;
  tag: string;
  postCount: number;
}

export default function RightSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trendingData } = useQuery({
    queryKey: ['trending', 'hashtags'],
    queryFn: () => api.get<{ data: TrendingHashtag[] }>('/api/v1/feed/trending/hashtags'),
    staleTime: 5 * 60 * 1000,
  });

  const trending = trendingData?.data ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatPostCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <aside className="right-section">
      <form className="search-container" onSubmit={handleSearch}>
        <Search size={18} className="search-icon-svg" />
        <input
          type="text"
          placeholder="Search 1ummah"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      {trending.length > 0 && (
        <div className="card widget-card">
          <h3>Trending</h3>
          {trending.map((hashtag, index) => (
            <div
              key={hashtag.id}
              className="trending-item"
              onClick={() => router.push(`/search?q=${encodeURIComponent('#' + hashtag.tag)}`)}
            >
              <p className="trending-meta">{index + 1} · Trending</p>
              <p className="trending-topic">#{hashtag.tag}</p>
              <p className="trending-posts">{formatPostCount(hashtag.postCount)} posts</p>
            </div>
          ))}
        </div>
      )}

      <div className="card widget-card footer-card">
        <p className="footer-links">
          <a href="#">Terms of Service</a> · <a href="#">Privacy Policy</a> · <a href="#">About</a>
        </p>
        <p className="copyright">&copy; 2026 1Ummah.me</p>
      </div>

      <style jsx>{`
        .right-section {
          width: 350px;
          padding: 1rem 2rem 1rem 1rem;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
        }
        .search-container {
          position: relative;
          padding-top: 0.5rem;
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
        .widget-card {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: 1rem;
          border: 1px solid var(--color-border);
        }
        h3 {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .trending-item {
          padding: 0.75rem 0;
          cursor: pointer;
          border-bottom: 1px solid var(--color-border);
          transition: background 0.15s;
          margin: 0 -1rem;
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .trending-item:last-child { border-bottom: none; }
        .trending-item:hover { background: rgba(255, 255, 255, 0.03); }
        .trending-meta {
          color: var(--color-text-muted);
          font-size: 0.8rem;
        }
        .trending-topic {
          font-weight: 700;
          margin: 2px 0;
        }
        .trending-posts {
          color: var(--color-text-muted);
          font-size: 0.8rem;
        }
        .footer-card {
          background: transparent;
          border: none;
          padding: 0.5rem;
        }
        .footer-links {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
        .footer-links a:hover { text-decoration: underline; }
        .copyright {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
        }
      `}</style>
    </aside>
  );
}
