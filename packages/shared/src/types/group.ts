import type { GroupPrivacy, GroupMemberRole } from './user';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  privacy: GroupPrivacy;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  isMember?: boolean;
  viewerRole?: GroupMemberRole | null;
}

export interface GroupMember {
  id: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
}

export interface CreateGroupInput {
  name: string;
  slug: string;
  description?: string;
  privacy?: GroupPrivacy;
  avatarUrl?: string;
  bannerUrl?: string;
}
