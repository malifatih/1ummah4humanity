'use client';
// Marking as client component for styled-jsx usage in this file (Next.js App Router specific)
// Or better, we can keep it server component and import CSS module, but we are using styled-jsx for speed and single-file containment in this prompt.
// Actually, styled-jsx works in Registry but let's stick to standard CSS modules or global if problematic. 
// For now, I will use inline styles/global classes mixed with styled-jsx which Next.js supports.

import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';

export default function Home() {
  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <h2>Home</h2>
          <div className="feed-tabs">
            <button className="tab active">For you</button>
            <button className="tab">Following</button>
          </div>
        </header>

        <div className="feed-content">
          {/* Post Composer Placeholder */}
          <div className="composer-container">
            <div className="avatar-placeholder" />
            <div className="input-area">
              <input type="text" placeholder="What is happening?!" />
              <div className="composer-actions">
                <button className="btn-primary btn-sm">Post</button>
              </div>
            </div>
          </div>

          {/* Feed Items (Mock) */}
          {[1, 2, 3, 4, 5].map((i) => (
            <article key={i} className="post-card">
              <div className="avatar-placeholder" />
              <div className="post-content">
                <div className="post-header">
                  <span className="user-name">User {i}</span>
                  <span className="user-handle">@user{i}</span>
                  <span className="post-time">· 2h</span>
                </div>
                <p className="post-text">
                  This is a post on 1ummah. Building the future of open source social media.
                  #1ummah #OpenSource
                </p>
                <div className="post-actions">
                  <span className="action">💬 5</span>
                  <span className="action">This is a repost icon 🔁 2</span>
                  <span className="action">❤️ 12</span>
                  <span className="action">📊 1.2k</span>
                </div>
              </div>
            </article>
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

        .feed-header {
          position: sticky;
          top: 0;
          background: rgba(8, 12, 22, 0.8); /* Match global bg with opacity */
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
          margin-top: 1rem;
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

        .composer-container {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          gap: 1rem;
        }

        .input-area {
          flex: 1;
        }

        .input-area input {
          width: 100%;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          padding: 0.5rem 0;
          color: var(--color-text-main);
          outline: none;
        }

        .composer-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
          border-top: 1px solid var(--color-bg-card); /* subtle divider */
          padding-top: 0.5rem;
        }

        .post-card {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          gap: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .post-card:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .post-header {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .user-name {
          font-weight: 700;
        }

        .user-handle, .post-time {
          color: var(--color-text-muted);
        }
        
        .post-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 0.75rem;
          color: var(--color-text-muted);
          max-width: 425px;
        }
        
        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-border);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
