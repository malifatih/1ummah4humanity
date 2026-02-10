export interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
}

export interface SearchHashtag {
  id: string;
  tag: string;
  postCount: number;
}

export interface SearchAllResult {
  posts: { data: any[]; pagination: { nextCursor?: string; hasMore: boolean } };
  users: { data: SearchUser[]; pagination: { nextCursor?: string; hasMore: boolean } };
  hashtags: { data: SearchHashtag[]; pagination: { nextCursor?: string; hasMore: boolean } };
}
