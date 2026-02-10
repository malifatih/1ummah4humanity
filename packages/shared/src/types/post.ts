import type { User } from './user';

export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'MENTIONED' | 'PRIVATE';

export interface Post {
  id: string;
  content?: string;
  authorId: string;
  parentId?: string;
  groupId?: string;
  visibility: Visibility;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  author: User;
  media: MediaItem[];
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  mimeType: string;
  width?: number;
  height?: number;
  altText?: string;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'GIF' | 'AUDIO';

export interface CreatePostInput {
  content?: string;
  parentId?: string;
  groupId?: string;
  visibility?: Visibility;
  mediaIds?: string[];
}

export interface PostThread {
  ancestors: Post[];
  post: Post;
  replies: Post[];
}
