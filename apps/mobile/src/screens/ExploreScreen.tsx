// ============================================================================
// 1Ummah Mobile -- ExploreScreen
// Public explore feed with search bar and infinite scroll.
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { api } from '../lib/api-client';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type { Post, ApiResponse } from '../lib/types';
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
// ExploreScreen
// ---------------------------------------------------------------------------

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');

  // ---- Explore feed query --------------------------------------------------
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery<ApiResponse<FeedPage>>({
    queryKey: ['feed', 'explore'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<ApiResponse<FeedPage>>(`/api/v1/feed/explore${cursor}`);
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
      await queryClient.cancelQueries({ queryKey: ['feed', 'explore'] });
      queryClient.setQueryData<typeof data>(
        ['feed', 'explore'],
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
      queryClient.invalidateQueries({ queryKey: ['feed', 'explore'] });
    },
  });

  const handleLike = useCallback(
    (post: Post) => {
      likeMutation.mutate(post);
    },
    [likeMutation],
  );

  // ---- Filtered posts (client-side search) ---------------------------------
  const filteredPosts = searchText.trim()
    ? posts.filter(
        (p) =>
          p.content.toLowerCase().includes(searchText.toLowerCase()) ||
          p.author.displayName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          p.author.username.toLowerCase().includes(searchText.toLowerCase()),
      )
    : posts;

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

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Nothing to explore</Text>
        <Text style={styles.emptySubtitle}>
          Check back later for new content.
        </Text>
      </View>
    );
  }, [isLoading]);

  // ---- Layout --------------------------------------------------------------
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, people..."
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Feed */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
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
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
