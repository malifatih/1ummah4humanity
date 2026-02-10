// ============================================================================
// 1Ummah Mobile -- PostDetailScreen
// Displays a single post with its comments thread.
// ============================================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react-native';
import { api } from '../lib/api-client';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type { Post, ApiResponse } from '../lib/types';
import type { RootStackScreenProps } from '../navigation/types';
import PostCard from '../components/PostCard';

// ---------------------------------------------------------------------------
// PostDetailScreen
// ---------------------------------------------------------------------------

type Props = RootStackScreenProps<'PostDetail'>;

export default function PostDetailScreen({ route }: Props) {
  const { postId } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');

  // ---- Post query -----------------------------------------------------------
  const { data: postData, isLoading: postLoading } = useQuery<ApiResponse<Post>>({
    queryKey: ['post', postId],
    queryFn: () => api.get<ApiResponse<Post>>(`/api/v1/posts/${postId}`),
  });

  const post = postData?.data;

  // ---- Comments query -------------------------------------------------------
  const { data: commentsData, isLoading: commentsLoading } = useQuery<
    ApiResponse<{ data: Post[] }>
  >({
    queryKey: ['post', postId, 'comments'],
    queryFn: () =>
      api.get<ApiResponse<{ data: Post[] }>>(`/api/v1/posts/${postId}/comments`),
  });

  const comments = commentsData?.data.data ?? [];

  // ---- Reply mutation -------------------------------------------------------
  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      api.post<ApiResponse<Post>>('/api/v1/posts', {
        content,
        parentId: postId,
      }),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['post', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  const handleSendReply = useCallback(() => {
    const trimmed = replyText.trim();
    if (!trimmed || replyMutation.isPending) return;
    replyMutation.mutate(trimmed);
  }, [replyText, replyMutation]);

  // ---- Like mutation --------------------------------------------------------
  const likeMutation = useMutation({
    mutationFn: async (p: Post) => {
      if (p.isLiked) {
        return api.delete(`/api/v1/posts/${p.id}/like`);
      }
      return api.post(`/api/v1/posts/${p.id}/like`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId, 'comments'] });
    },
  });

  const handleLike = useCallback(
    (p: Post) => likeMutation.mutate(p),
    [likeMutation],
  );

  // ---- Render helpers -------------------------------------------------------
  const renderComment = useCallback(
    ({ item }: { item: Post }) => <PostCard post={item} onLike={handleLike} />,
    [handleLike],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const renderHeader = useCallback(() => {
    if (!post) return null;
    return (
      <View>
        <PostCard post={post} onLike={handleLike} />
        <View style={styles.commentsDivider}>
          <Text style={styles.commentsHeading}>
            {post.commentsCount === 1
              ? '1 Reply'
              : `${post.commentsCount} Replies`}
          </Text>
        </View>
      </View>
    );
  }, [post, handleLike]);

  const isLoading = postLoading || commentsLoading;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Post</Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reply input */}
      <View style={[styles.replyBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <TextInput
          style={styles.replyInput}
          placeholder="Write a reply..."
          placeholderTextColor={colors.textMuted}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSendReply}
          disabled={!replyText.trim() || replyMutation.isPending}
          style={[
            styles.sendButton,
            (!replyText.trim() || replyMutation.isPending) && styles.sendButtonDisabled,
          ]}
        >
          {replyMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Send size={18} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  commentsDivider: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  commentsHeading: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
