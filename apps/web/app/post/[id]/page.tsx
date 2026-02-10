'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Repeat2, Heart, BarChart3, Bookmark, Share, MoreHorizontal, Image as ImageIcon, Smile } from 'lucide-react';
import { format } from 'date-fns';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import PostCard from '@/components/feed/PostCard';
import { usePostThread, useCreatePost, useLikePost, useRepostPost, useBookmarkPost } from '@/lib/hooks/usePosts';
import { useAuth } from '@/lib/hooks/useAuth';
import type { PostThread } from '@1ummah/shared';

export default function PostThreadPage() {
  const params = useParams();
  const postId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createPost = useCreatePost();
  const likeMutation = useLikePost();
  const repostMutation = useRepostPost();
  const bookmarkMutation = useBookmarkPost();

  const { data, isLoading, isError, error } = usePostThread(postId);

  const threadData: PostThread | undefined = data?.pages?.[0]?.data;

  const handleReply = async () => {
    if (!replyContent.trim() || createPost.isPending) return;
    try {
      await createPost.mutateAsync({
        content: replyContent.trim(),
        parentId: postId,
      });
      setReplyContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleReply();
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count > 0 ? count.toString() : '0';
  };

  const mainPost = threadData?.post;

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <div className="header-row">
            <Link href="/" className="back-btn">
              <ArrowLeft size={20} />
            </Link>
            <h2>Post</h2>
          </div>
        </header>

        <div className="feed-content">
          {isLoading && (
            <div className="loading-state">
              <div className="skeleton-post">
                <div className="skeleton-avatar" />
                <div className="skeleton-content">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line medium" />
                </div>
              </div>
              <div className="skeleton-main-post">
                <div className="skeleton-avatar large" />
                <div className="skeleton-content">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line medium" />
                </div>
              </div>
            </div>
          )}

          {isError && (
            <div className="error-state">
              <h3>Could not load post</h3>
              <p>{error instanceof Error ? error.message : 'Something went wrong'}</p>
            </div>
          )}

          {threadData && (
            <>
              {/* Ancestor Posts */}
              {threadData.ancestors.length > 0 && (
                <div className="ancestors">
                  {threadData.ancestors.map((ancestor) => (
                    <div key={ancestor.id} className="ancestor-wrapper">
                      <PostCard post={ancestor} />
                      <div className="thread-line" />
                    </div>
                  ))}
                </div>
              )}

              {/* Main Post - Expanded View */}
              {mainPost && (
                <article className="main-post">
                  <div className="main-post-header">
                    <Link href={`/${mainPost.author.username}`} className="main-post-author">
                      {mainPost.author.avatarUrl ? (
                        <img src={mainPost.author.avatarUrl} alt={mainPost.author.displayName} className="main-avatar" />
                      ) : (
                        <div className="main-avatar-placeholder">
                          {mainPost.author.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="main-author-info">
                        <div className="main-author-name-row">
                          <span className="main-author-name">{mainPost.author.displayName}</span>
                          {mainPost.author.isVerified && <span className="verified-badge">&#10003;</span>}
                        </div>
                        <span className="main-author-handle">@{mainPost.author.username}</span>
                      </div>
                    </Link>
                    <button className="menu-btn">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {mainPost.content && (
                    <div className="main-post-body">
                      <p className="main-post-text">{mainPost.content}</p>
                    </div>
                  )}

                  {mainPost.media && mainPost.media.length > 0 && (
                    <div className={`media-grid media-${Math.min(mainPost.media.length, 4)}`}>
                      {mainPost.media.slice(0, 4).map((media) => (
                        <div key={media.id} className="media-item">
                          {media.type === 'VIDEO' ? (
                            <video src={media.url} controls className="media-content" />
                          ) : (
                            <img src={media.url} alt={media.altText || ''} className="media-content" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="main-post-meta">
                    <span className="post-datetime">
                      {format(new Date(mainPost.createdAt), 'h:mm a')}
                    </span>
                    <span className="meta-separator">&middot;</span>
                    <span className="post-datetime">
                      {format(new Date(mainPost.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <div className="main-post-stats">
                    <span className="stat">
                      <strong>{formatCount(mainPost.repostsCount)}</strong> Reposts
                    </span>
                    <span className="stat">
                      <strong>{formatCount(mainPost.likesCount)}</strong> Likes
                    </span>
                    <span className="stat">
                      <strong>{formatCount(mainPost.viewsCount)}</strong> Views
                    </span>
                    <span className="stat">
                      <strong>{formatCount(mainPost.commentsCount)}</strong> Replies
                    </span>
                  </div>

                  <div className="main-post-actions">
                    <button className="action-btn comment-btn">
                      <MessageCircle size={20} />
                    </button>
                    <button
                      className={`action-btn repost-btn ${mainPost.isReposted ? 'active' : ''}`}
                      onClick={() => repostMutation.mutate({ postId: mainPost.id, reposted: !!mainPost.isReposted })}
                    >
                      <Repeat2 size={20} />
                    </button>
                    <button
                      className={`action-btn like-btn ${mainPost.isLiked ? 'active' : ''}`}
                      onClick={() => likeMutation.mutate({ postId: mainPost.id, liked: !!mainPost.isLiked })}
                    >
                      <Heart size={20} fill={mainPost.isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button className="action-btn views-btn">
                      <BarChart3 size={20} />
                    </button>
                    <div className="action-right">
                      <button
                        className={`action-btn bookmark-btn ${mainPost.isBookmarked ? 'active' : ''}`}
                        onClick={() => bookmarkMutation.mutate({ postId: mainPost.id, bookmarked: !!mainPost.isBookmarked })}
                      >
                        <Bookmark size={20} fill={mainPost.isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                      <button className="action-btn share-btn">
                        <Share size={20} />
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* Reply Composer */}
              {isAuthenticated && (
                <div className="reply-composer">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="reply-avatar" />
                  ) : (
                    <div className="reply-avatar-placeholder">
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="reply-input-area">
                    <textarea
                      ref={textareaRef}
                      placeholder="Post your reply"
                      className="reply-input"
                      rows={1}
                      value={replyContent}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                    />
                    <div className="reply-actions">
                      <div className="reply-media-btns">
                        <button type="button" title="Image"><ImageIcon size={18} /></button>
                        <button type="button" title="Emoji"><Smile size={18} /></button>
                      </div>
                      <button
                        className="btn-primary btn-reply"
                        onClick={handleReply}
                        disabled={!replyContent.trim() || createPost.isPending}
                      >
                        {createPost.isPending ? 'Replying...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies */}
              {threadData.replies.length > 0 && (
                <div className="replies-section">
                  {threadData.replies.map((reply) => (
                    <PostCard key={reply.id} post={reply} />
                  ))}
                </div>
              )}

              {threadData.replies.length === 0 && !isLoading && (
                <div className="no-replies">
                  <MessageCircle size={32} />
                  <p>No replies yet. Be the first to reply!</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .header-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 0;
        }
        .header-row h2 {
          font-size: 1.25rem;
        }
        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          transition: background 0.15s;
        }
        .back-btn:hover {
          background: var(--color-bg-card);
        }
        .ancestors {
          position: relative;
        }
        .ancestor-wrapper {
          position: relative;
        }
        .thread-line {
          position: absolute;
          left: 2.2rem;
          bottom: 0;
          width: 2px;
          height: 1rem;
          background: var(--color-border);
        }
        .main-post {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .main-post-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .main-post-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .main-avatar, .main-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }
        .main-avatar-placeholder {
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          color: white;
        }
        .main-author-info {
          display: flex;
          flex-direction: column;
        }
        .main-author-name-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .main-author-name {
          font-weight: 700;
          font-size: 1rem;
        }
        .verified-badge {
          background: var(--color-brand);
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .main-author-handle {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }
        .menu-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 50%;
          display: flex;
          transition: all 0.15s;
        }
        .menu-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-brand);
        }
        .main-post-body {
          margin-bottom: 1rem;
        }
        .main-post-text {
          font-size: 1.3rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .media-grid {
          margin-bottom: 1rem;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--color-border);
        }
        .media-1 { display: grid; }
        .media-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
        .media-3 { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; }
        .media-4 { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; }
        .media-content {
          width: 100%;
          height: 100%;
          object-fit: cover;
          max-height: 400px;
        }
        .main-post-meta {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .post-datetime {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }
        .meta-separator {
          color: var(--color-text-muted);
        }
        .main-post-stats {
          display: flex;
          gap: 1.25rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap;
        }
        .stat {
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        .stat strong {
          color: var(--color-text-main);
          font-weight: 700;
        }
        .main-post-actions {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .action-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: var(--radius-full);
          transition: all 0.15s;
        }
        .comment-btn:hover { color: hsl(210, 100%, 60%); background: hsla(210, 100%, 60%, 0.1); }
        .repost-btn:hover, .repost-btn.active { color: hsl(140, 80%, 50%); }
        .repost-btn:hover { background: hsla(140, 80%, 50%, 0.1); }
        .like-btn:hover, .like-btn.active { color: hsl(350, 90%, 60%); }
        .like-btn:hover { background: hsla(350, 90%, 60%, 0.1); }
        .views-btn:hover { color: hsl(210, 100%, 60%); background: hsla(210, 100%, 60%, 0.1); }
        .bookmark-btn:hover, .bookmark-btn.active { color: var(--color-brand); }
        .bookmark-btn:hover { background: hsla(210, 100%, 60%, 0.1); }
        .share-btn:hover { color: var(--color-brand); background: hsla(210, 100%, 60%, 0.1); }
        .action-right {
          display: flex;
          gap: 0;
        }
        .reply-composer {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .reply-avatar, .reply-avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
        }
        .reply-avatar-placeholder {
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
        }
        .reply-input-area {
          flex: 1;
        }
        .reply-input {
          width: 100%;
          background: transparent;
          border: none;
          font-size: 1.1rem;
          padding: 0.5rem 0;
          color: var(--color-text-main);
          outline: none;
          font-family: inherit;
          resize: none;
          min-height: 40px;
        }
        .reply-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }
        .reply-media-btns {
          display: flex;
          gap: 0.25rem;
        }
        .reply-media-btns button {
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
        .reply-media-btns button:hover {
          background: hsla(210, 100%, 60%, 0.1);
        }
        .btn-reply {
          padding: 0.45rem 1.25rem;
          font-size: 0.9rem;
        }
        .btn-reply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .no-replies {
          text-align: center;
          padding: 3rem 2rem;
          color: var(--color-text-muted);
        }
        .no-replies p {
          margin-top: 0.75rem;
        }
        .error-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-muted);
        }
        .error-state h3 {
          font-size: 1.5rem;
          color: hsl(0, 80%, 60%);
          margin-bottom: 0.5rem;
        }
        .loading-state {
          padding: 1rem;
        }
        .skeleton-post, .skeleton-main-post {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-bg-card);
          animation: pulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .skeleton-avatar.large {
          width: 48px;
          height: 48px;
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
