import { prisma } from '../config/database.js';
import { PostVisibility } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const HASHTAG_REGEX = /#([\w]+)/g;
const MENTION_REGEX = /@([\w]+)/g;

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

function extractHashtags(text: string): string[] {
  const matches = [...text.matchAll(HASHTAG_REGEX)];
  return [...new Set(matches.map((m) => m[1].toLowerCase()))];
}

function extractMentions(text: string): string[] {
  const matches = [...text.matchAll(MENTION_REGEX)];
  return [...new Set(matches.map((m) => m[1].toLowerCase()))];
}

export async function hydrateInteractions(posts: any[], viewerId?: string) {
  if (!viewerId || posts.length === 0) {
    return posts.map((p) => ({
      ...p,
      media: p.postMedia?.map((pm: any) => pm.media) ?? [],
      isLiked: false,
      isReposted: false,
      isBookmarked: false,
    }));
  }

  const postIds = posts.map((p) => p.id);

  const [likes, reposts, bookmarks] = await Promise.all([
    prisma.like.findMany({ where: { userId: viewerId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.repost.findMany({ where: { userId: viewerId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.bookmark.findMany({ where: { userId: viewerId, postId: { in: postIds } }, select: { postId: true } }),
  ]);

  const likedSet = new Set(likes.map((l) => l.postId));
  const repostedSet = new Set(reposts.map((r) => r.postId));
  const bookmarkedSet = new Set(bookmarks.map((b) => b.postId));

  return posts.map((p) => ({
    ...p,
    media: p.postMedia?.map((pm: any) => pm.media) ?? [],
    isLiked: likedSet.has(p.id),
    isReposted: repostedSet.has(p.id),
    isBookmarked: bookmarkedSet.has(p.id),
  }));
}

export async function createPost(
  authorId: string,
  input: { content?: string; mediaIds?: string[]; parentId?: string; visibility?: string }
) {
  if (!input.content && (!input.mediaIds || input.mediaIds.length === 0)) {
    throw new AppError(400, 'Post must have content or media');
  }

  if (input.parentId) {
    const parent = await prisma.post.findUnique({ where: { id: input.parentId }, select: { id: true } });
    if (!parent) throw new AppError(404, 'Parent post not found');
  }

  const post = await prisma.post.create({
    data: {
      content: input.content,
      authorId,
      parentId: input.parentId,
      visibility: (input.visibility as PostVisibility) || PostVisibility.PUBLIC,
      postMedia: input.mediaIds
        ? {
            create: input.mediaIds.map((mediaId, index) => ({
              mediaId,
              order: index,
            })),
          }
        : undefined,
    },
    select: postSelect,
  });

  // Handle hashtags
  if (input.content) {
    const tags = extractHashtags(input.content);
    for (const tag of tags) {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag },
        create: { tag, postCount: 1 },
        update: { postCount: { increment: 1 } },
      });
      await prisma.postHashtag.create({
        data: { postId: post.id, hashtagId: hashtag.id },
      });
    }

    const mentions = extractMentions(input.content);
    for (const username of mentions) {
      const mentioned = await prisma.user.findUnique({ where: { username }, select: { id: true } });
      if (mentioned) {
        await prisma.mention.create({
          data: { postId: post.id, mentionedUserId: mentioned.id },
        });
      }
    }
  }

  if (input.parentId) {
    await prisma.post.update({
      where: { id: input.parentId },
      data: { commentsCount: { increment: 1 } },
    });
  }

  return {
    ...post,
    media: (post as any).postMedia?.map((pm: any) => pm.media) ?? [],
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
  };
}

export async function getPost(postId: string, viewerId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: postSelect,
  });
  if (!post) throw new AppError(404, 'Post not found');

  await prisma.post.update({
    where: { id: postId },
    data: { viewsCount: { increment: 1 } },
  });

  const [hydrated] = await hydrateInteractions([post], viewerId);
  return hydrated;
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, parentId: true } });
  if (!post) throw new AppError(404, 'Post not found');
  if (post.authorId !== userId) throw new AppError(403, 'Not authorized to delete this post');

  if (post.parentId) {
    await prisma.post.update({
      where: { id: post.parentId },
      data: { commentsCount: { decrement: 1 } },
    });
  }

  await prisma.post.delete({ where: { id: postId } });
}

export async function getPostThread(postId: string, viewerId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: postSelect,
  });
  if (!post) throw new AppError(404, 'Post not found');

  const ancestors: any[] = [];
  let currentParentId = post.parentId;
  while (currentParentId) {
    const parent = await prisma.post.findUnique({
      where: { id: currentParentId },
      select: postSelect,
    });
    if (!parent) break;
    ancestors.unshift(parent);
    currentParentId = parent.parentId;
  }

  const replies = await prisma.post.findMany({
    where: { parentId: postId },
    select: postSelect,
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const allPosts = [...ancestors, post, ...replies];
  const hydrated = await hydrateInteractions(allPosts, viewerId);

  return {
    ancestors: hydrated.slice(0, ancestors.length),
    post: hydrated[ancestors.length],
    replies: hydrated.slice(ancestors.length + 1),
  };
}

export async function likePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new AppError(404, 'Post not found');

  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) return { liked: true };

  await prisma.like.create({ data: { userId, postId } });
  await prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
  return { liked: true };
}

export async function unlikePost(userId: string, postId: string) {
  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
  }
  return { liked: false };
}

export async function repostPost(userId: string, postId: string, comment?: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new AppError(404, 'Post not found');

  const existing = await prisma.repost.findUnique({ where: { userId_postId: { userId, postId } } });
  if (!existing) {
    await prisma.repost.create({ data: { userId, postId, comment } });
    await prisma.post.update({ where: { id: postId }, data: { repostsCount: { increment: 1 } } });
  }
  return { reposted: true };
}

export async function unrepostPost(userId: string, postId: string) {
  const existing = await prisma.repost.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: postId }, data: { repostsCount: { decrement: 1 } } });
  }
  return { reposted: false };
}

export async function bookmarkPost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new AppError(404, 'Post not found');

  await prisma.bookmark.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  });
  return { bookmarked: true };
}

export async function unbookmarkPost(userId: string, postId: string) {
  await prisma.bookmark.deleteMany({ where: { userId, postId } });
  return { bookmarked: false };
}

export async function getUserPosts(username: string, cursor?: string, limit = 20, viewerId?: string) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) throw new AppError(404, 'User not found');

  const posts = await prisma.post.findMany({
    where: {
      authorId: user.id,
      parentId: null,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: postSelect,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = posts.length > limit;
  const sliced = posts.slice(0, limit);
  const hydrated = await hydrateInteractions(sliced, viewerId);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: hydrated, pagination: { nextCursor, hasMore } };
}

export async function getUserLikedPosts(username: string, cursor?: string, limit = 20) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) throw new AppError(404, 'User not found');

  const likes = await prisma.like.findMany({
    where: {
      userId: user.id,
      ...(cursor && { id: { lt: cursor } }),
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: { post: { select: postSelect } },
  });

  const hasMore = likes.length > limit;
  const sliced = likes.slice(0, limit);
  const posts = sliced.map((l) => ({
    ...l.post,
    media: (l.post as any).postMedia?.map((pm: any) => pm.media) ?? [],
    isLiked: true,
    isReposted: false,
    isBookmarked: false,
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: posts, pagination: { nextCursor, hasMore } };
}
