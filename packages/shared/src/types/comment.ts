import type { User } from './user';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  replies?: Comment[];
  repliesCount?: number;
}

export interface CreateCommentInput {
  content: string;
  parentId?: string;
}
