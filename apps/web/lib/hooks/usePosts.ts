'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api-client';
import type { Post, PaginatedResponse, ApiResponse, CreatePostInput, PostThread } from '@1ummah/shared';

export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<PaginatedResponse<Post>>(`/api/v1/feed/home${params}`, { requireAuth: true });
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
  });
}

export function useFollowingFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'following'],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<PaginatedResponse<Post>>(`/api/v1/feed/following${params}`, { requireAuth: true });
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
  });
}

export function useExploreFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'explore'],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<PaginatedResponse<Post>>(`/api/v1/feed/explore${params}`);
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) =>
      api.post<ApiResponse<Post>>('/api/v1/posts', input, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked
        ? api.delete(`/api/v1/posts/${postId}/like`, { requireAuth: true })
        : api.post(`/api/v1/posts/${postId}/like`, undefined, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useRepostPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reposted, comment }: { postId: string; reposted: boolean; comment?: string }) =>
      reposted
        ? api.delete(`/api/v1/posts/${postId}/repost`, { requireAuth: true })
        : api.post(`/api/v1/posts/${postId}/repost`, { comment }, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useBookmarkPost() {
  return useMutation({
    mutationFn: ({ postId, bookmarked }: { postId: string; bookmarked: boolean }) =>
      bookmarked
        ? api.delete(`/api/v1/posts/${postId}/bookmark`, { requireAuth: true })
        : api.post(`/api/v1/posts/${postId}/bookmark`, undefined, { requireAuth: true }),
  });
}

export function usePostThread(postId: string) {
  return useInfiniteQuery({
    queryKey: ['post', 'thread', postId],
    queryFn: () => api.get<ApiResponse<PostThread>>(`/api/v1/posts/${postId}/thread`),
    getNextPageParam: () => undefined,
    initialPageParam: undefined,
    enabled: !!postId,
  });
}

export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ['user', username, 'posts'],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      return api.get<PaginatedResponse<Post>>(`/api/v1/users/${username}/posts${params}`);
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!username,
  });
}
