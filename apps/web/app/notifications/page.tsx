'use client';

import { useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Heart, Repeat2, MessageCircle, UserPlus, UserCheck, AtSign, Users, Award, Info, CheckCheck, Bell } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import { api } from '@/lib/api-client';
import type { Notification, NotificationType, PaginatedResponse } from '@1ummah/shared';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'LIKE': return <Heart size={18} className="notif-icon like" />;
    case 'REPOST': return <Repeat2 size={18} className="notif-icon repost" />;
    case 'COMMENT': return <MessageCircle size={18} className="notif-icon comment" />;
    case 'FOLLOW': return <UserPlus size={18} className="notif-icon follow" />;
    case 'FOLLOW_REQUEST': return <UserCheck size={18} className="notif-icon follow" />;
    case 'MENTION': return <AtSign size={18} className="notif-icon mention" />;
    case 'GROUP_INVITE': return <Users size={18} className="notif-icon group" />;
    case 'GROUP_POST': return <Users size={18} className="notif-icon group" />;
    case 'REWARD': return <Award size={18} className="notif-icon reward" />;
    case 'SYSTEM': return <Info size={18} className="notif-icon system" />;
    default: return <Bell size={18} className="notif-icon" />;
  }
}

function getNotificationText(type: NotificationType): string {
  switch (type) {
    case 'LIKE': return 'liked your post';
    case 'REPOST': return 'reposted your post';
    case 'COMMENT': return 'commented on your post';
    case 'FOLLOW': return 'followed you';
    case 'FOLLOW_REQUEST': return 'requested to follow you';
    case 'MENTION': return 'mentioned you in a post';
    case 'GROUP_INVITE': return 'invited you to a group';
    case 'GROUP_POST': return 'posted in your group';
    case 'REWARD': return 'You received a reward';
    case 'SYSTEM': return 'System notification';
    default: return 'sent you a notification';
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<PaginatedResponse<Notification>>(`/api/v1/notifications${params}`, { requireAuth: true });
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/api/v1/notifications/read-all', undefined, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      api.patch(`/api/v1/notifications/${notificationId}/read`, undefined, { requireAuth: true }),
  });

  const notifications: Notification[] = data?.pages.flatMap((page) => page.data) ?? [];

  const hasUnread = notifications.some((n) => !n.isRead);

  // Mark notifications as read when they come into view
  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead);
    unread.forEach((n) => {
      markReadMutation.mutate(n.id);
    });
    // Only run when new notifications load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const getNotificationLink = (notification: Notification): string => {
    if (notification.postId) return `/post/${notification.postId}`;
    if (notification.actor) return `/${notification.actor.username}`;
    if (notification.groupId) return `/groups/${notification.groupId}`;
    return '#';
  };

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <div className="header-row">
            <h2>Notifications</h2>
            {hasUnread && (
              <button
                className="mark-all-btn"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck size={16} />
                {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>
        </header>

        <div className="feed-content">
          {isLoading && (
            <div className="loading-state">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-notif">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-content">
                    <div className="skeleton-line medium" />
                    <div className="skeleton-line short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="error-state">
              <h3>Something went wrong</h3>
              <p>{error instanceof Error ? error.message : 'Failed to load notifications'}</p>
            </div>
          )}

          {!isLoading && !isError && notifications.length === 0 && (
            <div className="empty-state">
              <Bell size={48} />
              <h3>No notifications yet</h3>
              <p>When someone interacts with your posts or follows you, notifications will appear here.</p>
            </div>
          )}

          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={getNotificationLink(notification)}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            >
              <div className="notif-icon-wrapper">
                {getNotificationIcon(notification.type)}
              </div>
              {notification.actor ? (
                notification.actor.avatarUrl ? (
                  <img
                    src={notification.actor.avatarUrl}
                    alt={notification.actor.displayName}
                    className="notif-avatar"
                  />
                ) : (
                  <div className="notif-avatar-placeholder">
                    {notification.actor.displayName.charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <div className="notif-avatar-placeholder system-avatar">
                  <Bell size={18} />
                </div>
              )}
              <div className="notif-body">
                <p className="notif-text">
                  {notification.actor && (
                    <span className="notif-actor">{notification.actor.displayName}</span>
                  )}{' '}
                  {notification.message || getNotificationText(notification.type)}
                </p>
                <span className="notif-time">
                  {formatDistanceToNowStrict(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>
              {!notification.isRead && <div className="unread-dot" />}
            </Link>
          ))}

          {isFetchingNextPage && (
            <div className="loading-more">
              <div className="spinner" />
            </div>
          )}

          <div ref={observerRef} className="scroll-sentinel" />
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
        }
        .header-row h2 {
          font-size: 1.25rem;
        }
        .mark-all-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-brand);
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .mark-all-btn:hover {
          background: hsla(210, 100%, 60%, 0.1);
        }
        .mark-all-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--color-border);
          transition: background 0.15s;
          position: relative;
        }
        .notification-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .notification-item.unread {
          background: hsla(210, 100%, 60%, 0.04);
        }
        .notif-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          flex-shrink: 0;
          padding-top: 0.1rem;
        }
        .notif-avatar, .notif-avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
        }
        .notif-avatar-placeholder {
          background: var(--color-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          font-size: 1rem;
        }
        .system-avatar {
          background: var(--color-bg-card);
          color: var(--color-text-muted);
        }
        .notif-body {
          flex: 1;
          min-width: 0;
        }
        .notif-text {
          font-size: 0.95rem;
          line-height: 1.4;
        }
        .notif-actor {
          font-weight: 700;
        }
        .notif-time {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 0.15rem;
          display: block;
        }
        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-brand);
          flex-shrink: 0;
          margin-top: 0.5rem;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-muted);
        }
        .empty-state h3 {
          font-size: 1.5rem;
          color: var(--color-text-main);
          margin: 1rem 0 0.5rem;
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
        .skeleton-notif {
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
        .loading-more {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-brand);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .scroll-sentinel {
          height: 1px;
        }
      `}</style>
    </div>
  );
}
