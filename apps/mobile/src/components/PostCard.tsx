// ============================================================================
// 1Ummah Mobile -- PostCard
// Reusable post card component used across Home, Explore, and other feeds.
// ============================================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Eye,
  BadgeCheck,
} from 'lucide-react-native';
import { colors, spacing, fontSize } from '../lib/theme';
import type { Post } from '../lib/types';

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

function formatCount(n: number | undefined): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PostCardProps {
  post: Post;
  onPress?: (post: Post) => void;
  onLike?: (post: Post) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PostCard({ post, onPress, onLike }: PostCardProps) {
  const { author } = post;
  const isVerified = author.isVerified;
  const viewsCount = post.viewsCount;

  const handlePress = useCallback(() => {
    onPress?.(post);
  }, [onPress, post]);

  const handleLike = useCallback(() => {
    onLike?.(post);
  }, [onLike, post]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarColumn}>
        {author.avatarUrl ? (
          <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>
              {getInitials(author.displayName)}
            </Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {author.displayName}
          </Text>
          {isVerified && (
            <BadgeCheck
              size={14}
              color={colors.brand}
              style={styles.verifiedBadge}
            />
          )}
          <Text style={styles.username} numberOfLines={1}>
            @{author.username}
          </Text>
          <Text style={styles.dot}>{' \u00B7 '}</Text>
          <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
        </View>

        {/* Content */}
        <Text style={styles.content}>{post.content}</Text>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          {/* Reply */}
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={16} color={colors.textMuted} />
            <Text style={styles.actionCount}>
              {formatCount(post.commentsCount)}
            </Text>
          </TouchableOpacity>

          {/* Repost */}
          <TouchableOpacity style={styles.actionButton}>
            <Repeat2
              size={16}
              color={post.isReposted ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.actionCount,
                post.isReposted && { color: colors.success },
              ]}
            >
              {formatCount(post.repostsCount)}
            </Text>
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Heart
              size={16}
              color={post.isLiked ? colors.danger : colors.textMuted}
              fill={post.isLiked ? colors.danger : 'transparent'}
            />
            <Text
              style={[
                styles.actionCount,
                post.isLiked && { color: colors.danger },
              ]}
            >
              {formatCount(post.likesCount)}
            </Text>
          </TouchableOpacity>

          {/* Views */}
          <TouchableOpacity style={styles.actionButton}>
            <Eye size={16} color={colors.textMuted} />
            <Text style={styles.actionCount}>
              {formatCount(viewsCount)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(PostCard);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  avatarColumn: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  displayName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: 3,
  },
  username: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
    flexShrink: 2,
  },
  dot: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  timeAgo: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  content: {
    color: colors.text,
    fontSize: fontSize.base,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingRight: spacing['3xl'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
