import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createConversation(
  creatorId: string,
  participantIds: string[],
  isGroup?: boolean,
  name?: string
) {
  // Ensure creator is included in participant list
  const allParticipantIds = [...new Set([creatorId, ...participantIds])];

  if (allParticipantIds.length < 2) {
    throw new AppError(400, 'A conversation requires at least 2 participants');
  }

  // Check that no blocked relationships exist between creator and participants
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: creatorId, blockedId: { in: participantIds } },
        { blockerId: { in: participantIds }, blockedId: creatorId },
      ],
    },
  });

  if (blocks.length > 0) {
    throw new AppError(403, 'Cannot create conversation with blocked users');
  }

  // Verify all participant users exist
  const users = await prisma.user.findMany({
    where: { id: { in: allParticipantIds } },
    select: { id: true },
  });

  if (users.length !== allParticipantIds.length) {
    throw new AppError(404, 'One or more participants not found');
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: isGroup ?? allParticipantIds.length > 2,
      name: name ?? null,
      participants: {
        create: allParticipantIds.map((userId) => ({
          userId,
          role: userId === creatorId ? 'admin' : 'member',
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });

  return conversation;
}

export async function getConversations(userId: string, cursor?: string, limit = 20) {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId },
      },
      ...(cursor && { id: { lt: cursor } }),
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          content: true,
          senderId: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      },
    },
    take: limit + 1,
    orderBy: { updatedAt: 'desc' },
  });

  const hasMore = conversations.length > limit;
  const sliced = conversations.slice(0, limit);

  // Get unread counts for each conversation
  const conversationsWithUnread = await Promise.all(
    sliced.map(async (conv) => {
      const participant = conv.participants.find((p) => p.userId === userId);
      const unreadCount = participant?.lastReadAt
        ? await prisma.message.count({
            where: {
              conversationId: conv.id,
              createdAt: { gt: participant.lastReadAt },
              senderId: { not: userId },
            },
          })
        : await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
            },
          });

      return {
        ...conv,
        lastMessage: conv.messages[0] ?? null,
        messages: undefined,
        unreadCount,
      };
    })
  );

  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: conversationsWithUnread, pagination: { nextCursor, hasMore } };
}

export async function getConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    throw new AppError(404, 'Conversation not found');
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  return conversation;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  mediaUrl?: string
) {
  // Verify sender is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: senderId },
    },
  });

  if (!participant) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  if (!content && !mediaUrl) {
    throw new AppError(400, 'Message must have content or media');
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content || '',
      mediaUrl,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
    },
  });

  // Update conversation updatedAt to reflect latest activity
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string,
  limit = 50
) {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!participant) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(cursor && { id: { lt: cursor } }),
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = messages.length > limit;
  const sliced = messages.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: sliced, pagination: { nextCursor, hasMore } };
}

export async function markConversationRead(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!participant) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return { success: true };
}

export async function deleteConversation(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!participant) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  // Soft delete: remove user from conversation participants
  await prisma.conversationParticipant.delete({
    where: { id: participant.id },
  });

  // If no participants remain, clean up the conversation entirely
  const remaining = await prisma.conversationParticipant.count({
    where: { conversationId },
  });

  if (remaining === 0) {
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
