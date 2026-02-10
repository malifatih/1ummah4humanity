export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: string;
  lastReadAt?: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  mediaUrl?: string;
}

export interface CreateConversationInput {
  participantIds: string[];
  isGroup?: boolean;
  name?: string;
}
