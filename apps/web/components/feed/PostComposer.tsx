'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Film, BarChart3, Smile, Calendar } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useCreatePost } from '../../lib/hooks/usePosts';
import { MAX_POST_LENGTH } from '@1ummah/shared';

export default function PostComposer() {
  const { user } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_POST_LENGTH;
  const canPost = content.trim().length > 0 && !isOverLimit && !createPost.isPending;

  const handleSubmit = async () => {
    if (!canPost) return;
    try {
      await createPost.mutateAsync({ content: content.trim() });
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="composer-container">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.displayName} className="avatar" />
      ) : (
        <div className="avatar-placeholder">
          {user?.displayName?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}

      <div className="input-area">
        <textarea
          ref={textareaRef}
          placeholder="What is happening?!"
          className="composer-input"
          rows={2}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
        />
        <div className="composer-actions">
          <div className="media-buttons">
            <button title="Image" type="button"><ImageIcon size={18} /></button>
            <button title="GIF" type="button"><Film size={18} /></button>
            <button title="Poll" type="button"><BarChart3 size={18} /></button>
            <button title="Emoji" type="button"><Smile size={18} /></button>
            <button title="Schedule" type="button"><Calendar size={18} /></button>
          </div>
          <div className="right-actions">
            {charCount > 0 && (
              <span className={`char-count ${isOverLimit ? 'over' : charCount > MAX_POST_LENGTH * 0.9 ? 'warn' : ''}`}>
                {MAX_POST_LENGTH - charCount}
              </span>
            )}
            <button
              className="btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={!canPost}
            >
              {createPost.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .composer-container {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          gap: 0.75rem;
        }
        .avatar, .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
        }
        .avatar-placeholder {
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
        }
        .input-area { flex: 1; }
        .composer-input {
          width: 100%;
          background: transparent;
          border: none;
          font-size: 1.2rem;
          padding: 0.5rem 0;
          color: var(--color-text-main);
          outline: none;
          font-family: inherit;
          resize: none;
          min-height: 52px;
        }
        .composer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          border-top: 1px solid var(--color-border);
          padding-top: 0.75rem;
        }
        .media-buttons { display: flex; gap: 0.25rem; }
        .media-buttons button {
          background: none;
          border: none;
          color: var(--color-brand);
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .media-buttons button:hover { background: hsla(210, 100%, 60%, 0.1); }
        .right-actions { display: flex; align-items: center; gap: 0.75rem; }
        .char-count { font-size: 0.85rem; color: var(--color-text-muted); }
        .char-count.warn { color: hsl(40, 100%, 50%); }
        .char-count.over { color: hsl(0, 90%, 55%); font-weight: 700; }
        .btn-sm { padding: 0.5rem 1.25rem; font-size: 0.9rem; }
        .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>
    </div>
  );
}
