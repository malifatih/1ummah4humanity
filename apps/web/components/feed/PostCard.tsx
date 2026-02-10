'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Repeat2, Heart, BarChart3, Bookmark, Share, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { Post } from '@1ummah/shared';
import { useLikePost, useRepostPost, useBookmarkPost } from '../../lib/hooks/usePosts';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const likeMutation = useLikePost();
  const repostMutation = useRepostPost();
  const bookmarkMutation = useBookmarkPost();

  const timeAgo = formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: false });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeMutation.mutate({ postId: post.id, liked: !!post.isLiked });
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    repostMutation.mutate({ postId: post.id, reposted: !!post.isReposted });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    bookmarkMutation.mutate({ postId: post.id, bookmarked: !!post.isBookmarked });
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count > 0 ? count.toString() : '';
  };

  return (
    <article className="post-card">
      <Link href={`/${post.author.username}`} className="avatar-link" onClick={(e) => e.stopPropagation()}>
        {post.author.avatarUrl ? (
          <img src={post.author.avatarUrl} alt={post.author.displayName} className="avatar" />
        ) : (
          <div className="avatar-placeholder">
            {post.author.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="post-content">
        <div className="post-header">
          <Link href={`/${post.author.username}`} className="author-link" onClick={(e) => e.stopPropagation()}>
            <span className="user-name">{post.author.displayName}</span>
            {post.author.isVerified && <span className="verified-badge">✓</span>}
            <span className="user-handle">@{post.author.username}</span>
          </Link>
          <span className="post-time">· {timeAgo}</span>
          <button className="menu-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
            <MoreHorizontal size={16} />
          </button>
        </div>

        <Link href={`/post/${post.id}`} className="post-body-link">
          {post.content && <p className="post-text">{post.content}</p>}
        </Link>

        {post.media && post.media.length > 0 && (
          <div className={`media-grid media-${Math.min(post.media.length, 4)}`}>
            {post.media.slice(0, 4).map((media) => (
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

        <div className="post-actions">
          <button className="action-btn comment-btn" onClick={(e) => e.stopPropagation()}>
            <MessageCircle size={18} />
            <span>{formatCount(post.commentsCount)}</span>
          </button>
          <button
            className={`action-btn repost-btn ${post.isReposted ? 'active' : ''}`}
            onClick={handleRepost}
          >
            <Repeat2 size={18} />
            <span>{formatCount(post.repostsCount)}</span>
          </button>
          <button
            className={`action-btn like-btn ${post.isLiked ? 'active' : ''}`}
            onClick={handleLike}
          >
            <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
            <span>{formatCount(post.likesCount)}</span>
          </button>
          <button className="action-btn views-btn">
            <BarChart3 size={18} />
            <span>{formatCount(post.viewsCount)}</span>
          </button>
          <div className="action-right">
            <button
              className={`action-btn bookmark-btn ${post.isBookmarked ? 'active' : ''}`}
              onClick={handleBookmark}
            >
              <Bookmark size={18} fill={post.isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button className="action-btn share-btn" onClick={(e) => e.stopPropagation()}>
              <Share size={18} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .post-card {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          gap: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .post-card:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .avatar-link {
          flex-shrink: 0;
        }
        .avatar, .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-placeholder {
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: white;
        }
        .post-content {
          flex: 1;
          min-width: 0;
        }
        .post-header {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.25rem;
        }
        .author-link {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
        }
        .user-name {
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
        .user-handle, .post-time {
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .menu-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          display: flex;
        }
        .menu-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-brand);
        }
        .post-body-link {
          display: block;
        }
        .post-text {
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .media-grid {
          margin-top: 0.75rem;
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
          max-height: 300px;
        }
        .post-actions {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
          gap: 0.25rem;
        }
        .action-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          padding: 0.35rem 0.5rem;
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
          margin-left: auto;
          display: flex;
          gap: 0;
        }
      `}</style>
    </article>
  );
}
