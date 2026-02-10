import type { MediaType } from './post';

export interface Story {
  id: string;
  authorId: string;
  mediaId: string;
  caption?: string;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  media: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    type: MediaType;
    width?: number;
    height?: number;
  };
  hasViewed?: boolean;
}

export interface StoryGroup {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

export interface StoryViewer {
  id: string;
  viewerId: string;
  viewedAt: string;
  viewer: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}
