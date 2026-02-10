// ============================================================================
// 1Ummah Mobile -- ProfileViewScreen
// Displays another user's public profile (navigated via the Profile route).
// ============================================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { ArrowLeft, UserPlus, UserMinus } from 'lucide-react-native';
import { api } from '../lib/api-client';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type { User, Post, ApiResponse } from '../lib/types';
import type { RootStackScreenProps } from '../navigation/types';
import PostCard from '../components/PostCard';

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

function formatCount(n: number | undefined): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedPage {
  data: Post[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

type Props = RootStackScreenProps<'Profile'>;

// ---------------------------------------------------------------------------
// ProfileViewScreen
// ---------------------------------------------------------------------------

export default function ProfileViewScreen({ route }: Props) {
  const { username } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // ---- User profile query ---------------------------------------------------
  const { data: userData, isLoading: profileLoading } = useQuery<ApiResponse<User>>({
    queryKey: ['user', username],
    queryFn: () => api.get<ApiResponse<User>>(`/api/v1/users/${username}`),
  });

  const profile = userData?.data;

  // ---- User posts query -----------------------------------------------------
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = useInfiniteQuery<ApiResponse<FeedPage>>({
    queryKey: ['posts', 'user', username],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<ApiResponse<FeedPage>>(
        `/api/v1/users/${username}/posts${cursor}`,
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const pg = lastPage.data.pagination;
      return pg.hasMore ? pg.nextCursor : undefined;
    },
    enabled: !!username,
  });

  const posts = postsData?.pages.flatMap((page) => page.data.data) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---- Follow mutation ------------------------------------------------------
  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile?.isFollowing) {
        return api.delete(`/api/v1/users/${username}/follow`);
      }
      return api.post(`/api/v1/users/${username}/follow`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] });
    },
  });

  // ---- Like mutation ---------------------------------------------------------
  const likeMutation = useMutation({
    mutationFn: async (post: Post) => {
      if (post.isLiked) {
        return api.delete(`/api/v1/posts/${post.id}/like`);
      }
      return api.post(`/api/v1/posts/${post.id}/like`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'user', username] });
    },
  });

  const handleLike = useCallback(
    (post: Post) => likeMutation.mutate(post),
    [likeMutation],
  );

  // ---- Render helpers -------------------------------------------------------
  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostCard post={item} onLike={handleLike} />,
    [handleLike],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderHeader = useCallback(() => {
    if (!profile) return null;

    return (
      <View style={styles.profileSection}>
        {/* Banner */}
        <View style={styles.banner} />

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>
                {getInitials(profile.displayName)}
              </Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>

        {/* Bio */}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {/* Follow button */}
        <TouchableOpacity
          style={[
            styles.followButton,
            profile.isFollowing && styles.followButtonActive,
          ]}
          onPress={() => followMutation.mutate()}
          disabled={followMutation.isPending}
        >
          {profile.isFollowing ? (
            <>
              <UserMinus size={16} color={colors.text} />
              <Text style={styles.followButtonActiveText}>Following</Text>
            </>
          ) : (
            <>
              <UserPlus size={16} color="#ffffff" />
              <Text style={styles.followButtonText}>Follow</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statCount}>{formatCount(profile.postsCount)}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statCount}>{formatCount(profile.followersCount)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statCount}>{formatCount(profile.followingCount)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />
      </View>
    );
  }, [profile, followMutation]);

  const isLoading = profileLoading || postsLoading;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {profile?.displayName ?? username}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 72;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Profile section
  profileSection: {
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 100,
    backgroundColor: colors.bgCard,
  },
  avatarWrapper: {
    marginTop: -(AVATAR_SIZE / 2),
    marginBottom: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  avatarFallback: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  displayName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  username: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing['3xl'],
    lineHeight: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  followButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  followButtonActiveText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
