'use client';

export default function PostComposer() {
    return (
        <div className="composer-container">
            <div className="avatar-placeholder" />
            <div className="input-area">
                <textarea
                    placeholder="What is happening?!"
                    className="composer-input"
                    rows={2}
                />
                <div className="composer-actions">
                    <div className="media-buttons">
                        <button title="Image">🖼️</button>
                        <button title="GIF">🎞️</button>
                        <button title="Poll">📊</button>
                        <button title="Emoji">😊</button>
                        <button title="Schedule">📅</button>
                    </div>
                    <button className="btn-primary btn-sm">Post</button>
                </div>
            </div>

            <style jsx>{`
        .composer-container {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          gap: 1rem;
        }

        .input-area {
          flex: 1;
        }

        .composer-input {
          width: 100%;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          padding: 0.5rem 0;
          color: var(--color-text-main);
          outline: none;
          font-family: inherit;
          resize: none;
        }

        .composer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          border-top: 1px solid var(--color-bg-card);
          padding-top: 0.75rem;
        }

        .media-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .media-buttons button {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .media-buttons button:hover {
          background: rgba(var(--hue-brand), 20%, 0.1); /* Approximate hover */
        }
        
        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-border);
          flex-shrink: 0;
        }
        
        .btn-sm {
           padding: 0.5rem 1rem;
           font-size: 0.95rem;
        }
      `}</style>
        </div>
    );
}
