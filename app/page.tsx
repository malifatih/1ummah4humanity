'use client';
// Marking as client component for styled-jsx usage in this file (Next.js App Router specific)
// Or better, we can keep it server component and import CSS module, but we are using styled-jsx for speed and single-file containment in this prompt.
// Actually, styled-jsx works in Registry but let's stick to standard CSS modules or global if problematic. 
// For now, I will use inline styles/global classes mixed with styled-jsx which Next.js supports.

import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import PostComposer from '@/components/feed/PostComposer';

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
          <PostComposer />

          {/* Feed Items (Mock) */}
          {[1, 2, 3, 4, 5].map((i) => (
            <PostCard
              key={i}
              username={`User ${i}`}
              handle={`user${i}`}
              content="This is a post on 1ummah. Building the future of open source social media. #1ummah #OpenSource"
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
      `}</style>
    </div>
  );
}

