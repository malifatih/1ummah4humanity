import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const eventSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  isOnline: true,
  onlineUrl: true,
  startTime: true,
  endTime: true,
  bannerUrl: true,
  attendeeCount: true,
  creatorId: true,
  groupId: true,
  createdAt: true,
  creator: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
    },
  },
  group: {
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
    },
  },
};

export async function createEvent(
  creatorId: string,
  data: {
    title: string;
    description?: string;
    location?: string;
    startTime?: string;
    startDate?: string;
    endTime?: string;
    endDate?: string;
    groupId?: string;
    isOnline?: boolean;
    onlineUrl?: string;
    bannerUrl?: string;
  }
) {
  const startTimeStr = data.startTime || data.startDate;
  if (!startTimeStr) {
    throw new AppError(400, 'startTime is required');
  }

  if (data.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: creatorId } },
    });
    if (!membership) {
      throw new AppError(403, 'You must be a member of the group to create an event');
    }
  }

  const endTimeStr = data.endTime || data.endDate;

  const event = await prisma.event.create({
    data: {
      creatorId,
      title: data.title,
      description: data.description,
      location: data.location,
      startTime: new Date(startTimeStr),
      endTime: endTimeStr ? new Date(endTimeStr) : undefined,
      groupId: data.groupId,
      isOnline: data.isOnline,
      onlineUrl: data.onlineUrl,
      bannerUrl: data.bannerUrl,
    },
    select: eventSelect,
  });

  return { ...event, viewerStatus: null };
}

export async function getEvent(eventId: string, viewerId?: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: eventSelect,
  });
  if (!event) throw new AppError(404, 'Event not found');

  let viewerStatus: string | null = null;
  if (viewerId) {
    const attendance = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId: viewerId } },
      select: { status: true },
    });
    viewerStatus = attendance?.status ?? null;
  }

  return { ...event, viewerStatus };
}

export async function updateEvent(
  eventId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isOnline?: boolean;
    onlineUrl?: string;
    bannerUrl?: string;
  }
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { creatorId: true },
  });
  if (!event) throw new AppError(404, 'Event not found');
  if (event.creatorId !== userId) throw new AppError(403, 'Not authorized to update this event');

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.startDate !== undefined && { startTime: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endTime: new Date(data.endDate) }),
      ...(data.isOnline !== undefined && { isOnline: data.isOnline }),
      ...(data.onlineUrl !== undefined && { onlineUrl: data.onlineUrl }),
      ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
    },
    select: eventSelect,
  });

  return { ...updated, viewerStatus: null };
}

export async function deleteEvent(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { creatorId: true },
  });
  if (!event) throw new AppError(404, 'Event not found');
  if (event.creatorId !== userId) throw new AppError(403, 'Not authorized to delete this event');

  await prisma.event.delete({ where: { id: eventId } });
}

export async function getUpcomingEvents(cursor?: string, limit = 20) {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      startTime: { gt: now },
      ...(cursor && { id: { lt: cursor } }),
    },
    select: eventSelect,
    take: limit + 1,
    orderBy: { startTime: 'asc' },
  });

  const hasMore = events.length > limit;
  const sliced = events.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: sliced, pagination: { nextCursor, hasMore } };
}

export async function getUserEvents(userId: string, cursor?: string, limit = 20) {
  const attendances = await prisma.eventAttendee.findMany({
    where: {
      userId,
      ...(cursor && { id: { lt: cursor } }),
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      event: {
        select: eventSelect,
      },
    },
  });

  const hasMore = attendances.length > limit;
  const sliced = attendances.slice(0, limit);
  const data = sliced.map((a) => ({
    ...a.event,
    viewerStatus: a.status,
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data, pagination: { nextCursor, hasMore } };
}

export async function attendEvent(eventId: string, userId: string, status: 'GOING' | 'INTERESTED') {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) throw new AppError(404, 'Event not found');

  const existing = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (existing) {
    await prisma.eventAttendee.update({
      where: { id: existing.id },
      data: { status: status.toLowerCase() },
    });
  } else {
    await prisma.eventAttendee.create({
      data: { eventId, userId, status: status.toLowerCase() },
    });
    await prisma.event.update({
      where: { id: eventId },
      data: { attendeeCount: { increment: 1 } },
    });
  }

  return { status: status.toLowerCase() };
}

export async function unattendEvent(eventId: string, userId: string) {
  const existing = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (existing) {
    await prisma.eventAttendee.delete({ where: { id: existing.id } });
    await prisma.event.update({
      where: { id: eventId },
      data: { attendeeCount: { decrement: 1 } },
    });
  }

  return { status: null };
}

export async function getAttendees(eventId: string, cursor?: string, limit = 20) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) throw new AppError(404, 'Event not found');

  const attendees = await prisma.eventAttendee.findMany({
    where: {
      eventId,
      ...(cursor && { id: { lt: cursor } }),
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
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
  });

  const hasMore = attendees.length > limit;
  const sliced = attendees.slice(0, limit);
  const data = sliced.map((a) => ({
    id: a.id,
    status: a.status,
    createdAt: a.createdAt,
    user: a.user,
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data, pagination: { nextCursor, hasMore } };
}
