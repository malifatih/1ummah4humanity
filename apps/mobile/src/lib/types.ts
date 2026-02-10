// ============================================================================
// 1Ummah Mobile — Shared TypeScript Types
// ============================================================================

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Post
// ---------------------------------------------------------------------------

export interface Post {
  id: string;
  content: string;
  authorId: string;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'isVerified'>;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount?: number;
  isLiked: boolean;
  isReposted: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

export type NotificationType = 'like' | 'comment' | 'follow' | 'repost' | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  read: boolean;
  actorId: string;
  actor: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  postId: string | null;
  post: Pick<Post, 'id' | 'content'> | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ---------------------------------------------------------------------------
// API envelope — every endpoint wraps its payload in { data: T }
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchPostsParams {
  q: string;
  page?: number;
  limit?: number;
}

export interface SearchUsersParams {
  q: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Create Post
// ---------------------------------------------------------------------------

export interface CreatePostRequest {
  content: string;
  parentId?: string;
}

// ---------------------------------------------------------------------------
// Like response
// ---------------------------------------------------------------------------

export interface LikeResponse {
  liked: boolean;
}
