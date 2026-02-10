import { prisma } from '../config/database.js';
import { PostVisibility } from '@prisma/client';
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

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  bannerUrl: true,
  isVerified: true,
  isPrivate: true,
  createdAt: true,
  _count: {
    select: {
      followersReceived: true,
      followsInitiated: true,
      posts: true,
    },
  },
};

export async function searchPosts(query: string, cursor?: string, limit = 20, viewerId?: string) {
  const posts = await prisma.post.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
      visibility: PostVisibility.PUBLIC,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: postSelect,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = posts.length > limit;
  const sliced = posts.slice(0, limit);

  // Sort by relevance: exact match > starts with > contains
  const lowerQuery = query.toLowerCase();
  sliced.sort((a, b) => {
    const aContent = (a.content || '').toLowerCase();
    const bContent = (b.content || '').toLowerCase();

    const aExact = aContent === lowerQuery;
    const bExact = bContent === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStartsWith = aContent.startsWith(lowerQuery);
    const bStartsWith = bContent.startsWith(lowerQuery);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    // Fall back to createdAt desc (already sorted by DB)
    return 0;
  });

  const hydrated = await hydrateInteractions(sliced, viewerId);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: hydrated, pagination: { nextCursor, hasMore } };
}

export async function searchUsers(query: string, cursor?: string, limit = 20) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
      ...(cursor && { id: { lt: cursor } }),
    },
    select: userSelect,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = users.length > limit;
  const sliced = users.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: sliced, pagination: { nextCursor, hasMore } };
}

export async function searchHashtags(query: string, limit = 10) {
  const hashtags = await prisma.hashtag.findMany({
    where: {
      tag: { contains: query, mode: 'insensitive' },
    },
    take: limit,
    orderBy: { postCount: 'desc' },
  });

  return { data: hashtags };
}

export async function searchAll(query: string, viewerId?: string) {
  const [postsResult, usersResult, hashtagsResult] = await Promise.all([
    searchPosts(query, undefined, 5, viewerId),
    searchUsers(query, undefined, 5),
    searchHashtags(query, 5),
  ]);

  return {
    posts: postsResult.data,
    users: usersResult.data,
    hashtags: hashtagsResult.data,
  };
}
