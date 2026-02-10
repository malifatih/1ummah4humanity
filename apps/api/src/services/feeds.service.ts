import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { hydrateInteractions } from './posts.service.js';

const postSelect = {
  id: true,
  content: true,
  authorId: true,
  parentId: true,
  visibility: true,
  isPinned: true,
  likesCount: true,
  commentsCount: true,
  repostsCount: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
    },
  },
  postMedia: {
    include: {
      media: {
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          type: true,
          mimeType: true,
          width: true,
          height: true,
          altText: true,
        },
      },
    },
    orderBy: { order: 'asc' as const },
  },
};

async function getFollowingIds(userId: string): Promise<string[]> {
  const cacheKey = `user:following:${userId}`;
  const cached = await redis.smembers(cacheKey);

  if (cached.length > 0) return cached;

  const follows = await prisma.follow.findMany({
    where: { followerId: userId, status: 'ACCEPTED' },
    select: { followingId: true },
  });

  const ids = follows.map((f) => f.followingId);
  if (ids.length > 0) {
    await redis.sadd(cacheKey, ...ids);
    await redis.expire(cacheKey, 3600); // 1 hour TTL
  }

  return ids;
}

async function getBlockedAndMutedIds(userId: string): Promise<Set<string>> {
  const [blocks, mutes] = await Promise.all([
    prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.mute.findMany({
      where: { muterId: userId },
      select: { mutedId: true },
    }),
  ]);

  const excludeIds = new Set<string>();
  for (const b of blocks) {
    excludeIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  for (const m of mutes) {
    excludeIds.add(m.mutedId);
  }

  return excludeIds;
}

export async function getHomeFeed(userId: string, cursor?: string, limit = 20) {
  const followingIds = await getFollowingIds(userId);
  const excludeIds = await getBlockedAndMutedIds(userId);

  const authorIds = [...followingIds, userId].filter((id) => !excludeIds.has(id));

  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: authorIds },
      parentId: null,
      visibility: 'PUBLIC',
      ...(cursor && { id: { lt: cursor } }),
    },
    select: postSelect,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = posts.length > limit;
  const sliced = posts.slice(0, limit);
  const hydrated = await hydrateInteractions(sliced, userId);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: hydrated, pagination: { nextCursor, hasMore } };
}

export async function getFollowingFeed(userId: string, cursor?: string, limit = 20) {
  const followingIds = await getFollowingIds(userId);
  const excludeIds = await getBlockedAndMutedIds(userId);

  const authorIds = followingIds.filter((id) => !excludeIds.has(id));

  if (authorIds.length === 0) {
    return { data: [], pagination: { hasMore: false } };
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: authorIds },
      parentId: null,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: postSelect,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = posts.length > limit;
  const sliced = posts.slice(0, limit);
  const hydrated = await hydrateInteractions(sliced, userId);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: hydrated, pagination: { nextCursor, hasMore } };
}

export async function getExploreFeed(cursor?: string, limit = 20, viewerId?: string) {
  // Score-based feed: engagement-weighted, recency-decayed
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      visibility: 'PUBLIC',
      createdAt: { gt: oneDayAgo },
      ...(cursor && { id: { lt: cursor } }),
    },
    select: postSelect,
    take: limit * 3, // Fetch more to sort by score
    orderBy: { createdAt: 'desc' },
  });

  // Score and sort
  const scored = posts.map((p) => ({
    ...p,
    score: p.likesCount * 3 + p.commentsCount * 5 + p.repostsCount * 4 + p.viewsCount * 0.01,
  }));

  scored.sort((a, b) => b.score - a.score);
  const sliced = scored.slice(0, limit + 1);

  const hasMore = sliced.length > limit;
  const final = sliced.slice(0, limit);
  const hydrated = await hydrateInteractions(final, viewerId);
  const nextCursor = hasMore ? final[final.length - 1].id : undefined;

  return { data: hydrated, pagination: { nextCursor, hasMore } };
}

export async function getTrendingHashtags(limit = 10) {
  const cacheKey = 'trending:hashtags';
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const hashtags = await prisma.hashtag.findMany({
    orderBy: { postCount: 'desc' },
    take: limit,
    select: {
      id: true,
      tag: true,
      postCount: true,
    },
  });

  await redis.setex(cacheKey, 900, JSON.stringify(hashtags)); // 15 min TTL

  return hashtags;
}
