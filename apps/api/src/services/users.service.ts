import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(username: string, viewerId?: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      location: true,
      website: true,
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
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  let isFollowing = false;
  let isBlocked = false;

  if (viewerId && viewerId !== user.id) {
    const [followRecord, blockRecord] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      }),
      prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: viewerId,
            blockedId: user.id,
          },
        },
      }),
    ]);

    isFollowing = !!followRecord;
    isBlocked = !!blockRecord;
  }

  return {
    ...user,
    followersCount: user._count.followersReceived,
    followingCount: user._count.followsInitiated,
    postsCount: user._count.posts,
    _count: undefined,
    ...(viewerId && viewerId !== user.id ? { isFollowing, isBlocked } : {}),
  };
}

export async function updateProfile(
  userId: string,
  data: {
    displayName?: string;
    bio?: string;
    location?: string;
    website?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      location: true,
      website: true,
      isVerified: true,
      isPrivate: true,
      createdAt: true,
    },
  });

  return user;
}

// ─── Followers / Following ────────────────────────────────────────────────────

export async function getFollowers(username: string, cursor?: string, limit = 20) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const follows = await prisma.follow.findMany({
    where: {
      followingId: user.id,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isVerified: true,
        },
      },
    },
  });

  const hasMore = follows.length > limit;
  const data = hasMore ? follows.slice(0, limit) : follows;

  return {
    data: data.map((f) => f.follower),
    pagination: {
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    },
  };
}

export async function getFollowing(username: string, cursor?: string, limit = 20) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const follows = await prisma.follow.findMany({
    where: {
      followerId: user.id,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isVerified: true,
        },
      },
    },
  });

  const hasMore = follows.length > limit;
  const data = hasMore ? follows.slice(0, limit) : follows;

  return {
    data: data.map((f) => f.following),
    pagination: {
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    },
  };
}

// ─── Follow / Unfollow ───────────────────────────────────────────────────────

export async function followUser(followerId: string, username: string) {
  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    throw new AppError(404, 'User not found');
  }

  if (targetUser.id === followerId) {
    throw new AppError(400, 'You cannot follow yourself');
  }

  // Check if blocked in either direction
  const [blockedByTarget, blockedTarget] = await Promise.all([
    prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: targetUser.id,
          blockedId: followerId,
        },
      },
    }),
    prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: followerId,
          blockedId: targetUser.id,
        },
      },
    }),
  ]);

  if (blockedByTarget || blockedTarget) {
    throw new AppError(403, 'Unable to follow this user');
  }

  // Check if already following
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetUser.id,
      },
    },
  });

  if (existingFollow) {
    throw new AppError(409, 'Already following this user');
  }

  const status = targetUser.isPrivate ? 'PENDING' : 'ACCEPTED';

  const follow = await prisma.follow.create({
    data: {
      followerId,
      followingId: targetUser.id,
      status,
    },
  });

  // Invalidate cached following list
  await redis.del(`user:following:${followerId}`);

  return { follow, status };
}

export async function unfollowUser(followerId: string, username: string) {
  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    throw new AppError(404, 'User not found');
  }

  const deleted = await prisma.follow.deleteMany({
    where: {
      followerId,
      followingId: targetUser.id,
    },
  });

  if (deleted.count === 0) {
    throw new AppError(404, 'You are not following this user');
  }

  // Invalidate cached following list
  await redis.del(`user:following:${followerId}`);

  return { unfollowed: true };
}

// ─── Block / Unblock ─────────────────────────────────────────────────────────

export async function blockUser(blockerId: string, username: string) {
  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    throw new AppError(404, 'User not found');
  }

  if (targetUser.id === blockerId) {
    throw new AppError(400, 'You cannot block yourself');
  }

  // Use a transaction to create block and remove follows in both directions
  await prisma.$transaction([
    prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: targetUser.id,
        },
      },
      create: {
        blockerId,
        blockedId: targetUser.id,
      },
      update: {},
    }),
    // Remove follow from blocker -> target
    prisma.follow.deleteMany({
      where: {
        followerId: blockerId,
        followingId: targetUser.id,
      },
    }),
    // Remove follow from target -> blocker
    prisma.follow.deleteMany({
      where: {
        followerId: targetUser.id,
        followingId: blockerId,
      },
    }),
  ]);

  // Invalidate cached following lists for both users
  await Promise.all([
    redis.del(`user:following:${blockerId}`),
    redis.del(`user:following:${targetUser.id}`),
  ]);

  return { blocked: true };
}

export async function unblockUser(blockerId: string, username: string) {
  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    throw new AppError(404, 'User not found');
  }

  const deleted = await prisma.block.deleteMany({
    where: {
      blockerId,
      blockedId: targetUser.id,
    },
  });

  if (deleted.count === 0) {
    throw new AppError(404, 'User is not blocked');
  }

  return { unblocked: true };
}

// ─── Mute / Unmute ───────────────────────────────────────────────────────────

export async function muteUser(muterId: string, username: string) {
  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    throw new AppError(404, 'User not found');
  }

  if (targetUser.id === muterId) {
    throw new AppError(400, 'You cannot mute yourself');
  }

  await prisma.mute.upsert({
    where: {
      muterId_mutedId: {
        muterId,
        mutedId: targetUser.id,
      },
    },
    create: {
      muterId,
      mutedId: targetUser.id,
    },
    update: {},
  });

  return { muted: true };
}

export async function unmuteUser(muterId: string, username: string) {
  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    throw new AppError(404, 'User not found');
  }

  const deleted = await prisma.mute.deleteMany({
    where: {
      muterId,
      mutedId: targetUser.id,
    },
  });

  if (deleted.count === 0) {
    throw new AppError(404, 'User is not muted');
  }

  return { unmuted: true };
}
