export default function RightSection() {
    return (
        <aside className="right-section">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search 1ummah"
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>

            <div className="card widget-card">
                <h3>Who to follow</h3>
                <div className="follow-suggestion">
                    <div className="avatar-small" />
                    <div className="suggestion-info">
                        <p className="bold">Open Source</p>
                        <p className="muted">@opensource</p>
                    </div>
                    <button className="btn-follow">Follow</button>
                </div>
                <div className="follow-suggestion">
                    <div className="avatar-small" />
                    <div className="suggestion-info">
                        <p className="bold">NextJS</p>
                        <p className="muted">@nextjs</p>
                    </div>
                    <button className="btn-follow">Follow</button>
                </div>
                <a href="#" className="show-more">Show more</a>
            </div>

            <div className="card widget-card">
                <h3>Trending</h3>
                <div className="trending-item">
                    <p className="trending-meta">Trending in Technology</p>
                    <p className="trending-topic">#1ummahLaunch</p>
                    <p className="trending-posts">50.4K Posts</p>
                </div>
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
        }

        .search-container {
          position: sticky;
          top: 0;
          background: var(--color-bg);
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          z-index: 10;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
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

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
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
          margin-bottom: 1rem;
        }

        .follow-suggestion {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        
        .follow-suggestion:last-of-type {
          border-bottom: none;
        }

        .avatar-small {
          width: 40px;
          height: 40px;
          background: var(--color-border);
          border-radius: 50%;
        }

        .suggestion-info {
          flex: 1;
        }

        .bold {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .muted {
          color: var(--color-text-muted);
          font-size: 0.85rem;
        }

        .btn-follow {
          background: var(--color-text-main);
          color: var(--color-bg);
          border: none;
          padding: 0.4rem 1rem;
          border-radius: var(--radius-full);
          font-weight: 700;
          cursor: pointer;
        }

        .show-more {
          display: block;
          margin-top: 1rem;
          color: var(--color-brand);
          font-size: 0.9rem;
        }
        
        .trending-item {
          padding: 0.75rem 0;
          cursor: pointer;
        }
        
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
      `}</style>
        </aside>
    );
}
