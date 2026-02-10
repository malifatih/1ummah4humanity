export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'REPOST'
  | 'FOLLOW'
  | 'FOLLOW_REQUEST'
  | 'MENTION'
  | 'GROUP_INVITE'
  | 'GROUP_POST'
  | 'REWARD'
  | 'SYSTEM';

export interface Notification {
  id: string;
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  postId?: string;
  groupId?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}
