'use client';

export default function PostCard({
    username = "User",
    handle = "user",
    time = "2h",
    content = "This is a post content.",
    stats = { comments: 5, reposts: 2, likes: 12, views: '1.2k' }
}) {
    return (
        <article className="post-card">
            <div className="avatar-placeholder" />
            <div className="post-content">
                <div className="post-header">
                    <span className="user-name">{username}</span>
                    <span className="user-handle">@{handle}</span>
                    <span className="post-time">· {time}</span>
                </div>
                <p className="post-text">
                    {content}
                </p>
                <div className="post-actions">
                    <button className="action-btn">
                        <span className="icon">💬</span> {stats.comments}
                    </button>
                    <button className="action-btn">
                        <span className="icon">🔁</span> {stats.reposts}
                    </button>
                    <button className="action-btn">
                        <span className="icon">❤️</span> {stats.likes}
                    </button>
                    <button className="action-btn">
                        <span className="icon">📊</span> {stats.views}
                    </button>
                </div>
            </div>

            <style jsx>{`
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
        
        .post-content {
          flex: 1;
        }

        .post-text {
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }
        
        .post-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          color: var(--color-text-muted);
          max-width: 425px;
        }

        .action-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          transition: color 0.2s;
        }

        .action-btn:hover {
          color: var(--color-brand);
        }
        
        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-border);
          flex-shrink: 0;
        }
      `}</style>
        </article>
    );
}
