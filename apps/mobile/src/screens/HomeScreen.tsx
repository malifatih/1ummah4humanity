// ============================================================================
// 1Ummah Mobile -- HomeScreen
// Main feed showing posts from followed users with infinite scroll, pull-to-
// refresh, compose modal, and optimistic like toggling.
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Plus, X } from 'lucide-react-native';
import { api } from '../lib/api-client';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type { Post, ApiResponse, PaginatedResponse } from '../lib/types';
import PostCard from '../components/PostCard';

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

// ---------------------------------------------------------------------------
// Skeleton placeholder
// ---------------------------------------------------------------------------

function SkeletonPost() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.avatar} />
      <View style={skeletonStyles.body}>
        <View style={skeletonStyles.headerLine} />
        <View style={skeletonStyles.contentLine1} />
        <View style={skeletonStyles.contentLine2} />
        <View style={skeletonStyles.actionsRow}>
          <View style={skeletonStyles.actionPill} />
          <View style={skeletonStyles.actionPill} />
          <View style={skeletonStyles.actionPill} />
          <View style={skeletonStyles.actionPill} />
        </View>
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View>
      <SkeletonPost />
      <SkeletonPost />
      <SkeletonPost />
      <SkeletonPost />
      <SkeletonPost />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>
        Follow people or create a post to get started.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeText, setComposeText] = useState('');

  // ---- Feed query ----------------------------------------------------------
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery<ApiResponse<FeedPage>>({
    queryKey: ['feed', 'home'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<ApiResponse<FeedPage>>(`/api/v1/feed/home${cursor}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const pg = lastPage.data.pagination;
      return pg.hasMore ? pg.nextCursor : undefined;
    },
  });

  const posts = data?.pages.flatMap((page) => page.data.data) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---- Like mutation -------------------------------------------------------
  const likeMutation = useMutation({
    mutationFn: async (post: Post) => {
      if (post.isLiked) {
        return api.delete(`/api/v1/posts/${post.id}/like`);
      }
      return api.post(`/api/v1/posts/${post.id}/like`);
    },
    onMutate: async (post: Post) => {
      await queryClient.cancelQueries({ queryKey: ['feed', 'home'] });
      queryClient.setQueryData<typeof data>(
        ['feed', 'home'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                data: page.data.data.map((p) =>
                  p.id === post.id
                    ? {
                        ...p,
                        isLiked: !p.isLiked,
                        likesCount: p.isLiked
                          ? p.likesCount - 1
                          : p.likesCount + 1,
                      }
                    : p,
                ),
              },
            })),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'home'] });
    },
  });

  const handleLike = useCallback(
    (post: Post) => {
      likeMutation.mutate(post);
    },
    [likeMutation],
  );

  // ---- Compose mutation ----------------------------------------------------
  const composeMutation = useMutation({
    mutationFn: (content: string) =>
      api.post<ApiResponse<Post>>('/api/v1/posts', { content }),
    onSuccess: () => {
      setComposeText('');
      setComposeVisible(false);
      queryClient.invalidateQueries({ queryKey: ['feed', 'home'] });
    },
  });

  const handlePost = useCallback(() => {
    const trimmed = composeText.trim();
    if (!trimmed) return;
    composeMutation.mutate(trimmed);
  }, [composeText, composeMutation]);

  // ---- Render helpers ------------------------------------------------------
  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onLike={handleLike} />
    ),
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

  // ---- Layout --------------------------------------------------------------
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>1Ummah</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setComposeVisible(true)}
        >
          <Plus size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
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

      {/* Compose Modal */}
      <Modal
        visible={composeVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComposeVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.composeModal}
        >
          <View style={[styles.composeHeader, { paddingTop: insets.top + spacing.sm }]}>
            <TouchableOpacity onPress={() => setComposeVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.postButton,
                !composeText.trim() && styles.postButtonDisabled,
              ]}
              onPress={handlePost}
              disabled={!composeText.trim() || composeMutation.isPending}
            >
              {composeMutation.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.composeInput}
            placeholder="What's happening?"
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
            value={composeText}
            onChangeText={setComposeText}
            maxLength={500}
          />

          <View style={styles.composeFooter}>
            <Text style={styles.charCount}>
              {composeText.length}/500
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.brand,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },
  composeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: spacing['3xl'],
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Compose modal
  composeModal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  postButton: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 64,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  composeInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    padding: spacing.lg,
    textAlignVertical: 'top',
  },
  composeFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  charCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});

// ---------------------------------------------------------------------------
// Skeleton styles
// ---------------------------------------------------------------------------

const SHIMMER = colors.bgCard;

const skeletonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SHIMMER,
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
  },
  headerLine: {
    height: 12,
    width: '60%',
    borderRadius: borderRadius.sm,
    backgroundColor: SHIMMER,
    marginBottom: spacing.sm,
  },
  contentLine1: {
    height: 12,
    width: '100%',
    borderRadius: borderRadius.sm,
    backgroundColor: SHIMMER,
    marginBottom: spacing.xs,
  },
  contentLine2: {
    height: 12,
    width: '75%',
    borderRadius: borderRadius.sm,
    backgroundColor: SHIMMER,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing['3xl'],
  },
  actionPill: {
    height: 10,
    width: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: SHIMMER,
  },
});
