'use client';

import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import { use, useEffect, useState } from 'react';

// In Next.js 15/16 params is a Promise
export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    // Determine username - unwrapping params
    // NOTE: In Next 15+ we need to use `use()` or await params in async component. 
    // Since we are "use client", we need to use `use()` or handle it.
    // Ideally, this should be a Server Component, but we are using client components for styling simplicity in this MVP.
    // Actually, for client components receiving params prop, it's still a Promise in newer Next.js versions?
    // Let's stick to standard modern pattern: Async Server Component wrapping Client Component OR use `use(params)` hook.

    // Workaround for MVP without complex server/client split: 
    // Just treat params as promise and unwrap.
    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        params.then(p => setUsername(decodeURIComponent(p.username)));
    }, [params]);

    if (!username) return null; // or loading spinner

    return (
        <div className="layout-grid">
            <Sidebar />

            <main className="main-feed-container">
                <header className="feed-header glass-panel">
                    <h2>{username}</h2>
                    <p className="post-count">1.2k posts</p>
                </header>

                <div className="profile-hero">
                    <div className="banner" />
                    <div className="profile-info">
                        <div className="avatar-large" />
                        <div className="profile-actions">
                            <button className="btn-outline">Edit Profile</button>
                        </div>
                        <div className="names">
                            <h1>{username}</h1>
                            <p className="handle">@{username.toLowerCase().replace(/\s/g, '')}</p>
                        </div>
                        <p className="bio">
                            Just a sample bio for {username}. Building the future. #1ummah
                        </p>
                        <div className="meta">
                            <span>📍 Global</span>
                            <span>🔗 1ummah.me</span>
                            <span>📅 Joined January 2026</span>
                        </div>
                        <div className="follow-stats">
                            <span><strong>143</strong> Following</span>
                            <span><strong>14.3K</strong> Followers</span>
                        </div>
                    </div>
                </div>

                <div className="feed-tabs">
                    <button className="tab active">Posts</button>
                    <button className="tab">Replies</button>
                    <button className="tab">Media</button>
                    <button className="tab">Likes</button>
                </div>

                <div className="feed-content">
                    {[1, 2, 3].map((i) => (
                        <PostCard
                            key={i}
                            username={username}
                            handle={username.toLowerCase().replace(/\s/g, '')}
                            content={`This is one of my best posts! #${i}`}
                        />
                    ))}
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
        
        .glass-panel {
           background: rgba(8, 12, 22, 0.8);
           backdrop-filter: blur(12px);
        }

        .feed-header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .post-count {
            font-size: 0.8rem;
            color: var(--color-text-muted);
        }

        .banner {
            height: 200px;
            background: linear-gradient(to right, #4facfe, #00f2fe);
        }

        .profile-info {
            padding: 1rem;
            position: relative;
        }

        .avatar-large {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: #111;
            border: 4px solid var(--color-bg);
            position: absolute;
            top: -65px;
        }

        .profile-actions {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 1rem;
        }

        .btn-outline {
            background: transparent;
            border: 1px solid var(--color-border);
            color: var(--color-text-main);
            padding: 0.5rem 1rem;
            border-radius: var(--radius-full);
            font-weight: 700;
            cursor: pointer;
        }
        
        .names { margin-top: 1rem; }
        .names h1 { font-size: 1.5rem; font-weight: 800; }
        .handle { color: var(--color-text-muted); }

        .bio { margin: 1rem 0; line-height: 1.4; }
        
        .meta {
            display: flex;
            gap: 1rem;
            color: var(--color-text-muted);
            font-size: 0.9rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        
        .follow-stats {
            display: flex;
            gap: 1.5rem;
            font-size: 0.9rem;
        }
        
        .follow-stats strong { color: var(--color-text-main); }
        .follow-stats span { color: var(--color-text-muted); }

        .feed-tabs { display: flex; border-bottom: 1px solid var(--color-border); }
        .tab { flex: 1; padding: 1rem; background: none; border: none; color: var(--color-text-muted); font-weight: 600; cursor: pointer; position: relative;}
        .tab.active { color: var(--color-text-main); }
        .tab.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 3rem; height: 4px; background: var(--color-brand); border-radius: var(--radius-full); }
        .tab:hover { background: var(--color-bg-card); }
      `}</style>
        </div>
    );
}
