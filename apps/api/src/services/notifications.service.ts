import { prisma } from '../config/database.js';
import { NotificationType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const actorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

const notificationSelect = {
  id: true,
  recipientId: true,
  actorId: true,
  type: true,
  postId: true,
  groupId: true,
  message: true,
  isRead: true,
  createdAt: true,
  actor: {
    select: actorSelect,
  },
};

export async function createNotification(
  recipientId: string,
  actorId: string,
  type: NotificationType,
  postId?: string,
  groupId?: string,
  message?: string
) {
  // Don't notify if the actor is the recipient
  if (actorId === recipientId) return null;

  const notification = await prisma.notification.create({
    data: {
      recipientId,
      actorId,
      type,
      postId,
      groupId,
      message,
    },
    select: notificationSelect,
  });

  return notification;
}

export async function getNotifications(userId: string, cursor?: string, limit = 30) {
  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: notificationSelect,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = notifications.length > limit;
  const sliced = notifications.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: sliced, pagination: { nextCursor, hasMore } };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { recipientId: true },
  });
  if (!notification) throw new AppError(404, 'Notification not found');
  if (notification.recipientId !== userId) throw new AppError(403, 'Not authorized to update this notification');

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    select: notificationSelect,
  });

  return updated;
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });

  return { updatedCount: result.count };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  });

  return { count };
}

export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { recipientId: true },
  });
  if (!notification) throw new AppError(404, 'Notification not found');
  if (notification.recipientId !== userId) throw new AppError(403, 'Not authorized to delete this notification');

  await prisma.notification.delete({ where: { id: notificationId } });
}
