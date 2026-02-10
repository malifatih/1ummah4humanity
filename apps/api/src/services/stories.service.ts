import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  isVerified: true,
};

const mediaSelect = {
  id: true,
  url: true,
  thumbnailUrl: true,
  type: true,
  mimeType: true,
  width: true,
  height: true,
};

const storySelect = {
  id: true,
  authorId: true,
  caption: true,
  viewsCount: true,
  expiresAt: true,
  createdAt: true,
  author: { select: authorSelect },
  media: { select: mediaSelect },
};

export async function createStory(
  authorId: string,
  mediaId: string,
  caption?: string
) {
  const media = await prisma.media.findUnique({ where: { id: mediaId }, select: { id: true } });
  if (!media) throw new AppError(404, 'Media not found');

  const expiresAt = new Date(Date.now() + STORY_DURATION_MS);

  const story = await prisma.story.create({
    data: {
      authorId,
      mediaId,
      caption,
      expiresAt,
    },
    select: storySelect,
  });

  return story;
}

export async function getActiveStories(viewerId: string) {
  const now = new Date();

  // Get users the viewer follows
  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId, status: 'ACCEPTED' },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);
  // Include viewer's own stories
  followingIds.push(viewerId);

  // Get active stories from followed users
  const stories = await prisma.story.findMany({
    where: {
      authorId: { in: followingIds },
      expiresAt: { gt: now },
    },
    select: {
      ...storySelect,
      views: {
        where: { viewerId },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group stories by author
  const authorMap = new Map<string, { author: any; stories: any[]; latestAt: Date }>();

  for (const story of stories) {
    const { views, ...storyData } = story;
    const enriched = { ...storyData, isViewed: views.length > 0 };

    const existing = authorMap.get(story.authorId);
    if (existing) {
      existing.stories.push(enriched);
      if (story.createdAt > existing.latestAt) {
        existing.latestAt = story.createdAt;
      }
    } else {
      authorMap.set(story.authorId, {
        author: story.author,
        stories: [enriched],
        latestAt: story.createdAt,
      });
    }
  }

  // Sort authors by most recent story
  const grouped = [...authorMap.values()]
    .sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime())
    .map(({ author, stories: userStories }) => ({
      author,
      stories: userStories,
    }));

  return grouped;
}

export async function getUserStories(userId: string, viewerId?: string) {
  const now = new Date();

  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
      expiresAt: { gt: now },
    },
    select: {
      ...storySelect,
      ...(viewerId
        ? {
            views: {
              where: { viewerId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'asc' },
  });

  return stories.map((story) => {
    const { views, ...storyData } = story as any;
    return {
      ...storyData,
      isViewed: viewerId ? (views?.length > 0) : false,
    };
  });
}

export async function viewStory(storyId: string, viewerId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true, authorId: true, expiresAt: true },
  });
  if (!story) throw new AppError(404, 'Story not found');
  if (story.expiresAt < new Date()) throw new AppError(410, 'Story has expired');

  // Don't count self-views
  if (story.authorId === viewerId) {
    return { viewsCount: (await prisma.story.findUnique({ where: { id: storyId }, select: { viewsCount: true } }))!.viewsCount };
  }

  // Upsert to prevent duplicate views
  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId, viewerId } },
    create: { storyId, viewerId },
    update: { viewedAt: new Date() },
  });

  // Update view count
  const updated = await prisma.story.update({
    where: { id: storyId },
    data: { viewsCount: { increment: 1 } },
    select: { viewsCount: true },
  });

  return { viewsCount: updated.viewsCount };
}

export async function getStoryViewers(
  storyId: string,
  authorId: string,
  cursor?: string,
  limit = 20
) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true },
  });
  if (!story) throw new AppError(404, 'Story not found');
  if (story.authorId !== authorId) throw new AppError(403, 'Only the story author can view viewers');

  const views = await prisma.storyView.findMany({
    where: {
      storyId,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: {
      id: true,
      viewedAt: true,
      viewer: { select: authorSelect },
    },
    take: limit + 1,
    orderBy: { viewedAt: 'desc' },
  });

  const hasMore = views.length > limit;
  const sliced = views.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return {
    data: sliced,
    pagination: { nextCursor, hasMore },
  };
}

export async function deleteStory(storyId: string, userId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true },
  });
  if (!story) throw new AppError(404, 'Story not found');
  if (story.authorId !== userId) throw new AppError(403, 'Not authorized to delete this story');

  await prisma.story.delete({ where: { id: storyId } });
}
