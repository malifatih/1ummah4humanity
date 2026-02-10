'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Globe, Lock, EyeOff, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import { api } from '@/lib/api-client';
import type { ApiResponse, GroupPrivacy } from '@1ummah/shared';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  privacy: GroupPrivacy;
  memberCount: number;
  createdAt: string;
  isMember?: boolean;
}

function getPrivacyIcon(privacy: GroupPrivacy) {
  switch (privacy) {
    case 'PUBLIC': return <Globe size={14} />;
    case 'PRIVATE': return <Lock size={14} />;
    case 'SECRET': return <EyeOff size={14} />;
  }
}

function getPrivacyLabel(privacy: GroupPrivacy): string {
  switch (privacy) {
    case 'PUBLIC': return 'Public';
    case 'PRIVATE': return 'Private';
    case 'SECRET': return 'Secret';
  }
}

export default function GroupsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: myGroupsData, isLoading: myGroupsLoading } = useQuery({
    queryKey: ['groups', 'mine'],
    queryFn: () => api.get<ApiResponse<Group[]>>('/api/v1/groups/mine', { requireAuth: true }),
  });

  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ['groups', 'discover'],
    queryFn: () => api.get<ApiResponse<Group[]>>('/api/v1/groups'),
  });

  const myGroups: Group[] = myGroupsData?.data ?? [];
  const discoverGroups: Group[] = (discoverData?.data ?? []).filter(
    (g) => !myGroups.some((mg) => mg.id === g.id)
  );

  const filteredMyGroups = searchQuery.trim()
    ? myGroups.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : myGroups;

  const filteredDiscoverGroups = searchQuery.trim()
    ? discoverGroups.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : discoverGroups;

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const isLoading = myGroupsLoading || discoverLoading;

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <div className="header-row">
            <h2>Groups</h2>
            <button className="btn-create" onClick={() => router.push('/groups/create')}>
              <Plus size={16} />
              Create Group
            </button>
          </div>
        </header>

        <div className="feed-content">
          <div className="groups-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search groups"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading && (
            <div className="loading-state">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-group">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-content">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (
            <>
              {/* My Groups Section */}
              <div className="groups-section">
                <h3 className="section-title">My Groups</h3>

                {filteredMyGroups.length === 0 && (
                  <div className="empty-section">
                    <Users size={32} />
                    <p>{searchQuery ? 'No matching groups found' : 'You haven\'t joined any groups yet'}</p>
                  </div>
                )}

                {filteredMyGroups.map((group) => (
                  <div
                    key={group.id}
                    className="group-card"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    {group.avatarUrl ? (
                      <img src={group.avatarUrl} alt={group.name} className="group-avatar" />
                    ) : (
                      <div className="group-avatar-placeholder">
                        <Users size={20} />
                      </div>
                    )}
                    <div className="group-info">
                      <div className="group-name-row">
                        <span className="group-name">{group.name}</span>
                        <span className="privacy-badge">
                          {getPrivacyIcon(group.privacy)}
                          {getPrivacyLabel(group.privacy)}
                        </span>
                      </div>
                      {group.description && (
                        <p className="group-description">{group.description}</p>
                      )}
                      <span className="group-members">
                        <Users size={14} /> {formatCount(group.memberCount)} members
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discover Groups Section */}
              <div className="groups-section">
                <h3 className="section-title">Discover</h3>

                {filteredDiscoverGroups.length === 0 && (
                  <div className="empty-section">
                    <Search size={32} />
                    <p>{searchQuery ? 'No matching groups found' : 'No groups to discover right now'}</p>
                  </div>
                )}

                {filteredDiscoverGroups.map((group) => (
                  <div
                    key={group.id}
                    className="group-card"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    {group.avatarUrl ? (
                      <img src={group.avatarUrl} alt={group.name} className="group-avatar" />
                    ) : (
                      <div className="group-avatar-placeholder">
                        <Users size={20} />
                      </div>
                    )}
                    <div className="group-info">
                      <div className="group-name-row">
                        <span className="group-name">{group.name}</span>
                        <span className="privacy-badge">
                          {getPrivacyIcon(group.privacy)}
                          {getPrivacyLabel(group.privacy)}
                        </span>
                      </div>
                      {group.description && (
                        <p className="group-description">{group.description}</p>
                      )}
                      <span className="group-members">
                        <Users size={14} /> {formatCount(group.memberCount)} members
                      </span>
                    </div>
                    <button
                      className="btn-join"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
        }
        .header-row h2 {
          font-size: 1.25rem;
        }
        .btn-create {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--color-brand);
          color: white;
          border: none;
          border-radius: var(--radius-full);
          padding: 0.5rem 1rem;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-create:hover {
          opacity: 0.9;
        }
        .groups-search {
          padding: 0.75rem 1rem;
          position: relative;
          border-bottom: 1px solid var(--color-border);
        }
        .search-input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.25rem;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          background: var(--color-bg-card);
          color: var(--color-text-main);
          font-size: 0.9rem;
          transition: var(--transition-normal);
        }
        .search-input:focus {
          background: var(--color-bg);
          border-color: var(--color-brand);
          outline: none;
        }
        .groups-section {
          padding: 0.5rem 0;
        }
        .section-title {
          font-size: 1.1rem;
          font-weight: 800;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .group-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.15s;
        }
        .group-card:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .group-avatar, .group-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          flex-shrink: 0;
          object-fit: cover;
        }
        .group-avatar-placeholder {
          background: hsla(210, 80%, 50%, 0.15);
          color: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .group-info {
          flex: 1;
          min-width: 0;
        }
        .group-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .group-name {
          font-weight: 700;
          font-size: 0.95rem;
        }
        .privacy-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          background: var(--color-bg-card);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-border);
        }
        .group-description {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-top: 0.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .group-members {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 0.35rem;
        }
        .btn-join {
          background: var(--color-text-main);
          color: var(--color-bg);
          border: none;
          border-radius: var(--radius-full);
          padding: 0.45rem 1.25rem;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: opacity 0.15s;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .btn-join:hover {
          opacity: 0.85;
        }
        .empty-section {
          text-align: center;
          padding: 2.5rem 1.5rem;
          color: var(--color-text-muted);
        }
        .empty-section p {
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
        .loading-state {
          padding: 0.5rem;
        }
        .skeleton-group {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .skeleton-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
