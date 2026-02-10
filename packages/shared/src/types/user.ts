export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  website?: string;
  walletAddress?: string;
  isVerified: boolean;
  isPrivate: boolean;
  role: UserRole;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
}

export interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  mutualFollowersCount: number;
}

export type FollowStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type GroupPrivacy = 'PUBLIC' | 'PRIVATE' | 'SECRET';

export type GroupMemberRole = 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER';

export type StakeStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN';
