// ============================================================================
// 1Ummah Mobile -- NotificationsScreen
// Displays the authenticated user's notifications with pull-to-refresh,
// unread indicators, and actor-based notification text.
// ============================================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
} from 'lucide-react-native';
import { api } from '../lib/api-client';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type {
  Notification as NotificationType,
  ApiResponse,
  PaginatedResponse,
} from '../lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}y`;
}

const NOTIFICATION_TEXT: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'followed you',
  repost: 'reposted your post',
  mention: 'mentioned you',
};

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return <Heart size={16} color={colors.danger} fill={colors.danger} />;
    case 'comment':
      return <MessageCircle size={16} color={colors.brand} />;
    case 'follow':
      return <UserPlus size={16} color={colors.brand} />;
    case 'repost':
      return <Repeat2 size={16} color={colors.success} />;
    default:
      return <Bell size={16} color={colors.brand} />;
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Bell size={48} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        When someone interacts with your posts, you will see it here.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Notification row
// ---------------------------------------------------------------------------

interface NotificationRowProps {
  notification: NotificationType;
}

function NotificationRow({ notification }: NotificationRowProps) {
  const { actor, type, read, createdAt, post } = notification;

  return (
    <View style={[styles.notifRow, !read && styles.notifRowUnread]}>
      {/* Unread dot */}
      {!read && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={styles.notifIconContainer}>
        {getNotificationIcon(type)}
      </View>

      {/* Avatar */}
      <View style={styles.notifAvatarContainer}>
        {actor.avatarUrl ? (
          <Image source={{ uri: actor.avatarUrl }} style={styles.notifAvatar} />
        ) : (
          <View style={[styles.notifAvatar, styles.notifAvatarFallback]}>
            <Text style={styles.notifAvatarInitials}>
              {getInitials(actor.displayName)}
            </Text>
          </View>
        )}
      </View>

      {/* Text */}
      <View style={styles.notifBody}>
        <Text style={styles.notifText} numberOfLines={2}>
          <Text style={styles.notifActorName}>{actor.displayName}</Text>
          {' '}
          {NOTIFICATION_TEXT[type] ?? 'interacted with your post'}
        </Text>
        {post?.content && (
          <Text style={styles.notifPostPreview} numberOfLines={1}>
            {post.content}
          </Text>
        )}
        <Text style={styles.notifTime}>{timeAgo(createdAt)}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// NotificationsScreen
// ---------------------------------------------------------------------------

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<ApiResponse<{ data: NotificationType[]; pagination: any }>>({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<ApiResponse<{ data: NotificationType[]; pagination: any }>>(
        '/api/v1/notifications',
      ),
  });

  const notifications = data?.data.data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: NotificationType }) => (
      <NotificationRow notification={item} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: NotificationType) => item.id,
    [],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: spacing['3xl'],
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Notification row
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  notifRowUnread: {
    backgroundColor: colors.bgCard,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    position: 'absolute',
    top: spacing.lg,
    left: spacing.sm,
  },
  notifIconContainer: {
    width: 28,
    alignItems: 'center',
    marginTop: 2,
  },
  notifAvatarContainer: {
    marginRight: spacing.md,
  },
  notifAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  notifAvatarFallback: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAvatarInitials: {
    color: '#ffffff',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  notifBody: {
    flex: 1,
  },
  notifText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  notifActorName: {
    color: colors.text,
    fontWeight: '700',
  },
  notifPostPreview: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  notifTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
