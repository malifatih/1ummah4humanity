import { prisma } from '../config/database.js';
import { GroupPrivacy, GroupMemberRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const groupSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  avatarUrl: true,
  bannerUrl: true,
  privacy: true,
  memberCount: true,
  createdAt: true,
  updatedAt: true,
};

const memberSelect = {
  id: true,
  userId: true,
  role: true,
  joinedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
    },
  },
};

// ============================================================================
// Helpers
// ============================================================================

async function getGroupBySlug(slug: string) {
  const group = await prisma.group.findUnique({ where: { slug } });
  if (!group) throw new AppError(404, 'Group not found');
  return group;
}

async function getMembership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

function requireRole(role: GroupMemberRole | null | undefined, allowed: GroupMemberRole[]) {
  if (!role || !allowed.includes(role)) {
    throw new AppError(403, 'You do not have permission to perform this action');
  }
}

// ============================================================================
// Service Functions
// ============================================================================

export async function createGroup(
  creatorId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    privacy?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  }
) {
  const existing = await prisma.group.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError(409, 'A group with this slug already exists');

  const group = await prisma.group.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      privacy: (data.privacy as GroupPrivacy) || GroupPrivacy.PUBLIC,
      avatarUrl: data.avatarUrl,
      bannerUrl: data.bannerUrl,
      memberCount: 1,
      members: {
        create: {
          userId: creatorId,
          role: GroupMemberRole.OWNER,
        },
      },
    },
    select: groupSelect,
  });

  return group;
}

export async function getGroup(slug: string, viewerId?: string) {
  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      ...groupSelect,
      _count: { select: { members: true } },
    },
  });
  if (!group) throw new AppError(404, 'Group not found');

  let viewerMembership: { role: GroupMemberRole } | null = null;
  if (viewerId) {
    viewerMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: viewerId } },
      select: { role: true },
    });
  }

  return {
    ...group,
    memberCount: group._count.members,
    isMember: !!viewerMembership,
    viewerRole: viewerMembership?.role ?? null,
  };
}

export async function updateGroup(
  slug: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    privacy?: string;
  }
) {
  const group = await getGroupBySlug(slug);
  const membership = await getMembership(group.id, userId);
  requireRole(membership?.role, [GroupMemberRole.ADMIN, GroupMemberRole.OWNER]);

  const updated = await prisma.group.update({
    where: { id: group.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
      ...(data.privacy !== undefined && { privacy: data.privacy as GroupPrivacy }),
    },
    select: groupSelect,
  });

  return updated;
}

export async function deleteGroup(slug: string, userId: string) {
  const group = await getGroupBySlug(slug);
  const membership = await getMembership(group.id, userId);
  requireRole(membership?.role, [GroupMemberRole.OWNER]);

  await prisma.group.delete({ where: { id: group.id } });
}

export async function discoverGroups(cursor?: string, limit = 20) {
  const groups = await prisma.group.findMany({
    where: {
      privacy: GroupPrivacy.PUBLIC,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: groupSelect,
    take: limit + 1,
    orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
  });

  const hasMore = groups.length > limit;
  const sliced = groups.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: sliced, pagination: { nextCursor, hasMore } };
}

export async function getUserGroups(userId: string, cursor?: string, limit = 20) {
  const memberships = await prisma.groupMember.findMany({
    where: {
      userId,
      ...(cursor && { id: { lt: cursor } }),
    },
    take: limit + 1,
    orderBy: { joinedAt: 'desc' },
    include: {
      group: { select: groupSelect },
    },
  });

  const hasMore = memberships.length > limit;
  const sliced = memberships.slice(0, limit);
  const data = sliced.map((m) => ({
    ...m.group,
    viewerRole: m.role,
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data, pagination: { nextCursor, hasMore } };
}

export async function joinGroup(slug: string, userId: string) {
  const group = await getGroupBySlug(slug);

  const existing = await getMembership(group.id, userId);
  if (existing) throw new AppError(409, 'You are already a member of this group');

  if (group.privacy === GroupPrivacy.SECRET) {
    throw new AppError(403, 'This group is secret and cannot be joined directly');
  }

  const isPending = group.privacy === GroupPrivacy.PRIVATE;

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: isPending ? GroupMemberRole.MEMBER : GroupMemberRole.MEMBER,
    },
  });

  if (!isPending) {
    await prisma.group.update({
      where: { id: group.id },
      data: { memberCount: { increment: 1 } },
    });
  }

  return { joined: !isPending, pending: isPending };
}

export async function leaveGroup(slug: string, userId: string) {
  const group = await getGroupBySlug(slug);
  const membership = await getMembership(group.id, userId);
  if (!membership) throw new AppError(404, 'You are not a member of this group');

  if (membership.role === GroupMemberRole.OWNER) {
    throw new AppError(400, 'Owner cannot leave the group. Transfer ownership first.');
  }

  await prisma.groupMember.delete({ where: { id: membership.id } });
  await prisma.group.update({
    where: { id: group.id },
    data: { memberCount: { decrement: 1 } },
  });

  return { left: true };
}

export async function getGroupMembers(slug: string, cursor?: string, limit = 20) {
  const group = await getGroupBySlug(slug);

  const members = await prisma.groupMember.findMany({
    where: {
      groupId: group.id,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: memberSelect,
    take: limit + 1,
    orderBy: { joinedAt: 'asc' },
  });

  const hasMore = members.length > limit;
  const sliced = members.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: sliced, pagination: { nextCursor, hasMore } };
}

export async function updateMemberRole(
  slug: string,
  adminId: string,
  userId: string,
  newRole: string
) {
  const group = await getGroupBySlug(slug);

  const adminMembership = await getMembership(group.id, adminId);
  requireRole(adminMembership?.role, [GroupMemberRole.ADMIN, GroupMemberRole.OWNER]);

  const targetMembership = await getMembership(group.id, userId);
  if (!targetMembership) throw new AppError(404, 'User is not a member of this group');

  // Cannot change role of OWNER unless you are OWNER
  if (targetMembership.role === GroupMemberRole.OWNER && adminMembership?.role !== GroupMemberRole.OWNER) {
    throw new AppError(403, 'Only the owner can change the owner role');
  }

  // Only OWNER can promote to ADMIN or OWNER
  if (
    (newRole === GroupMemberRole.ADMIN || newRole === GroupMemberRole.OWNER) &&
    adminMembership?.role !== GroupMemberRole.OWNER
  ) {
    throw new AppError(403, 'Only the owner can promote members to admin or owner');
  }

  // If transferring ownership, demote the current owner
  if (newRole === GroupMemberRole.OWNER) {
    await prisma.groupMember.update({
      where: { id: adminMembership!.id },
      data: { role: GroupMemberRole.ADMIN },
    });
  }

  const updated = await prisma.groupMember.update({
    where: { id: targetMembership.id },
    data: { role: newRole as GroupMemberRole },
    select: memberSelect,
  });

  return updated;
}

export async function removeMember(slug: string, adminId: string, userId: string) {
  const group = await getGroupBySlug(slug);

  const adminMembership = await getMembership(group.id, adminId);
  requireRole(adminMembership?.role, [GroupMemberRole.ADMIN, GroupMemberRole.OWNER]);

  const targetMembership = await getMembership(group.id, userId);
  if (!targetMembership) throw new AppError(404, 'User is not a member of this group');

  if (targetMembership.role === GroupMemberRole.OWNER) {
    throw new AppError(403, 'Cannot remove the group owner');
  }

  // ADMIN cannot remove another ADMIN (only OWNER can)
  if (targetMembership.role === GroupMemberRole.ADMIN && adminMembership?.role !== GroupMemberRole.OWNER) {
    throw new AppError(403, 'Only the owner can remove admins');
  }

  await prisma.groupMember.delete({ where: { id: targetMembership.id } });
  await prisma.group.update({
    where: { id: group.id },
    data: { memberCount: { decrement: 1 } },
  });

  return { removed: true };
}

export async function getGroupPosts(slug: string, viewerId?: string, cursor?: string, limit = 20) {
  const group = await getGroupBySlug(slug);

  // If the group is private/secret, only members can view posts
  if (group.privacy !== GroupPrivacy.PUBLIC && viewerId) {
    const membership = await getMembership(group.id, viewerId);
    if (!membership) throw new AppError(403, 'You must be a member to view posts in this group');
  } else if (group.privacy !== GroupPrivacy.PUBLIC && !viewerId) {
    throw new AppError(403, 'You must be a member to view posts in this group');
  }

  const posts = await prisma.post.findMany({
    where: {
      groupId: group.id,
      ...(cursor && { id: { lt: cursor } }),
    },
    select: {
      id: true,
      content: true,
      authorId: true,
      visibility: true,
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
        orderBy: { order: 'asc' },
      },
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' as const },
  });

  const hasMore = posts.length > limit;
  const sliced = posts.slice(0, limit);
  const data = sliced.map((p: any) => ({
    ...p,
    media: p.postMedia?.map((pm: any) => pm.media) ?? [],
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data, pagination: { nextCursor, hasMore } };
}
