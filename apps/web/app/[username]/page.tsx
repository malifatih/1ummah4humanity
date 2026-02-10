'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Link as LinkIcon, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserPosts } from '@/lib/hooks/usePosts';
import { api } from '@/lib/api-client';
import type { UserProfile, Post } from '@1ummah/shared';

type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const decodedUsername = decodeURIComponent(username);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const observerRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = currentUser?.username === decodedUsername;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user', decodedUsername],
    queryFn: () => api.get<{ data: UserProfile }>(`/api/v1/users/${decodedUsername}`),
    enabled: !!decodedUsername,
  });

  const profile = profileData?.data;

  const userPosts = useUserPosts(decodedUsername);
  const posts: Post[] = userPosts.data?.pages.flatMap((page) => page.data) ?? [];

  const followMutation = useMutation({
    mutationFn: () =>
      profile?.isFollowing
        ? api.delete(`/api/v1/users/${decodedUsername}/follow`, { requireAuth: true })
        : api.post(`/api/v1/users/${decodedUsername}/follow`, undefined, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', decodedUsername] });
    },
  });

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (userPosts.hasNextPage && !userPosts.isFetchingNextPage) {
      userPosts.fetchNextPage();
    }
  }, [userPosts]);

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

  if (profileLoading) {
    return (
      <div className="layout-grid">
        <Sidebar />
        <main className="main-feed-container">
          <div className="loading-profile">
            <div className="skeleton-banner" />
            <div className="skeleton-profile-info">
              <div className="skeleton-avatar-lg" />
              <div className="skeleton-line" style={{ width: '40%', marginTop: '4rem' }} />
              <div className="skeleton-line" style={{ width: '25%' }} />
            </div>
          </div>
        </main>
        <RightSection />
        <style jsx global>{`
          .layout-grid { display: grid; grid-template-columns: auto 600px auto; min-height: 100vh; max-width: var(--max-width); margin: 0 auto; justify-content: center; }
          .main-feed-container { border-right: 1px solid var(--color-border); min-height: 100vh; }
          .loading-profile { animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-banner { height: 200px; background: var(--color-bg-card); }
          .skeleton-profile-info { padding: 1rem; }
          .skeleton-avatar-lg { width: 130px; height: 130px; border-radius: 50%; background: var(--color-bg-card); border: 4px solid var(--color-bg); margin-top: -65px; }
          .skeleton-line { height: 16px; background: var(--color-bg-card); border-radius: 4px; margin: 0.75rem 0; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="layout-grid">
        <Sidebar />
        <main className="main-feed-container">
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
            <h2>User not found</h2>
            <p>@{decodedUsername} doesn&apos;t exist.</p>
          </div>
        </main>
        <RightSection />
        <style jsx global>{`
          .layout-grid { display: grid; grid-template-columns: auto 600px auto; min-height: 100vh; max-width: var(--max-width); margin: 0 auto; justify-content: center; }
          .main-feed-container { border-right: 1px solid var(--color-border); min-height: 100vh; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <h2>{profile.displayName}</h2>
          <p className="post-count">{profile.postsCount} posts</p>
        </header>

        <div className="profile-hero">
          <div className="banner">
            {profile.bannerUrl && <img src={profile.bannerUrl} alt="Banner" className="banner-img" />}
          </div>
          <div className="profile-info">
            <div className="avatar-row">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} className="avatar-large" />
              ) : (
                <div className="avatar-large avatar-fallback">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-actions">
                {isOwnProfile ? (
                  <button className="btn-outline">Edit Profile</button>
                ) : (
                  <button
                    className={`btn-outline ${profile.isFollowing ? 'following' : ''}`}
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                  >
                    {profile.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
            <div className="names">
              <h1>
                {profile.displayName}
                {profile.isVerified && <span className="verified-badge">✓</span>}
              </h1>
              <p className="handle">@{profile.username}</p>
            </div>
            {profile.bio && <p className="bio">{profile.bio}</p>}
            <div className="meta">
              {profile.location && <span><MapPin size={14} /> {profile.location}</span>}
              {profile.website && <span><LinkIcon size={14} /> <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a></span>}
              <span><Calendar size={14} /> Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: false })} ago</span>
            </div>
            <div className="follow-stats">
              <span><strong>{profile.followingCount}</strong> Following</span>
              <span><strong>{profile.followersCount}</strong> Followers</span>
            </div>
          </div>
        </div>

        <div className="feed-tabs">
          {(['posts', 'replies', 'media', 'likes'] as ProfileTab[]).map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="feed-content">
          {userPosts.isLoading && (
            <div className="loading-more"><div className="spinner" /></div>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {userPosts.isFetchingNextPage && (
            <div className="loading-more"><div className="spinner" /></div>
          )}
          <div ref={observerRef} className="scroll-sentinel" />
        </div>
      </main>

      <RightSection />

      <style jsx global>{`
        .layout-grid { display: grid; grid-template-columns: auto 600px auto; min-height: 100vh; max-width: var(--max-width); margin: 0 auto; justify-content: center; }
        .main-feed-container { border-right: 1px solid var(--color-border); min-height: 100vh; }
        .glass-panel { background: rgba(8, 12, 22, 0.8); backdrop-filter: blur(12px); }
        .feed-header { position: sticky; top: 0; z-index: 100; padding: 0.5rem 1rem; border-bottom: 1px solid var(--color-border); }
        .post-count { font-size: 0.8rem; color: var(--color-text-muted); }
        .banner { height: 200px; background: linear-gradient(135deg, hsl(210, 80%, 30%), hsl(190, 80%, 40%)); overflow: hidden; }
        .banner-img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { padding: 0 1rem 1rem; }
        .avatar-row { display: flex; align-items: flex-start; justify-content: space-between; }
        .avatar-large { width: 130px; height: 130px; border-radius: 50%; border: 4px solid var(--color-bg); margin-top: -65px; object-fit: cover; }
        .avatar-fallback { background: var(--color-brand); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; color: white; }
        .profile-actions { margin-top: 0.75rem; }
        .btn-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-main); padding: 0.5rem 1.25rem; border-radius: var(--radius-full); font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-outline:hover { background: rgba(255,255,255,0.1); }
        .btn-outline.following { background: transparent; }
        .btn-outline.following:hover { border-color: hsl(0, 90%, 55%); color: hsl(0, 90%, 55%); }
        .names { margin-top: 0.75rem; }
        .names h1 { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.35rem; }
        .verified-badge { background: var(--color-brand); color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; }
        .handle { color: var(--color-text-muted); }
        .bio { margin: 0.75rem 0; line-height: 1.4; }
        .meta { display: flex; gap: 1rem; color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 0.75rem; flex-wrap: wrap; align-items: center; }
        .meta span { display: flex; align-items: center; gap: 0.3rem; }
        .meta a { color: var(--color-brand); }
        .meta a:hover { text-decoration: underline; }
        .follow-stats { display: flex; gap: 1.5rem; font-size: 0.9rem; }
        .follow-stats strong { color: var(--color-text-main); }
        .follow-stats span { color: var(--color-text-muted); }
        .feed-tabs { display: flex; border-bottom: 1px solid var(--color-border); }
        .tab { flex: 1; padding: 1rem; background: none; border: none; color: var(--color-text-muted); font-weight: 600; cursor: pointer; position: relative; transition: background 0.15s; }
        .tab.active { color: var(--color-text-main); }
        .tab.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 3rem; height: 4px; background: var(--color-brand); border-radius: var(--radius-full); }
        .tab:hover { background: var(--color-bg-card); }
        .loading-more { display: flex; justify-content: center; padding: 2rem; }
        .spinner { width: 24px; height: 24px; border: 3px solid var(--color-border); border-top-color: var(--color-brand); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .scroll-sentinel { height: 1px; }
      `}</style>
    </div>
  );
}
