import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      displayName: 'Admin',
      email: 'admin@1ummah.me',
      passwordHash,
      bio: 'Platform administrator for 1Ummah',
      isVerified: true,
      role: 'ADMIN',
      wallet: {
        create: {
          address: '0x0000000000000000000000000000000000000001',
          balance: 1000000,
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'demo_user' },
    update: {},
    create: {
      username: 'demo_user',
      displayName: 'Demo User',
      passwordHash,
      bio: 'Just a demo user exploring 1Ummah. #opensource #social',
      location: 'Global',
      website: 'https://1ummah.me',
      wallet: {
        create: {
          address: '0x0000000000000000000000000000000000000002',
          balance: 100,
        },
      },
    },
  });

  const user3 = await prisma.user.upsert({
    where: { username: 'opensource' },
    update: {},
    create: {
      username: 'opensource',
      displayName: 'Open Source',
      passwordHash,
      bio: 'Building the future of open source social media.',
      isVerified: true,
      wallet: {
        create: {
          address: '0x0000000000000000000000000000000000000003',
          balance: 500,
        },
      },
    },
  });

  // Create follow relationships
  await prisma.follow.createMany({
    data: [
      { followerId: user2.id, followingId: user1.id, status: 'ACCEPTED' },
      { followerId: user2.id, followingId: user3.id, status: 'ACCEPTED' },
      { followerId: user3.id, followingId: user1.id, status: 'ACCEPTED' },
    ],
    skipDuplicates: true,
  });

  // Create sample posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: 'Welcome to 1Ummah! The open source social platform for the global community. #1ummah #launch #opensource',
        authorId: user1.id,
        visibility: 'PUBLIC',
      },
    }),
    prisma.post.create({
      data: {
        content: 'Excited to join 1Ummah! Building the future of social media together. #1ummah #community',
        authorId: user2.id,
        visibility: 'PUBLIC',
      },
    }),
    prisma.post.create({
      data: {
        content: 'Open source is the way forward. Transparent, democratic, and owned by the community. #opensource #decentralized',
        authorId: user3.id,
        visibility: 'PUBLIC',
      },
    }),
    prisma.post.create({
      data: {
        content: 'Privacy matters. On 1Ummah, you own your data and your identity. No IP tracking, no surveillance. #privacy #freedom',
        authorId: user1.id,
        visibility: 'PUBLIC',
      },
    }),
    prisma.post.create({
      data: {
        content: 'The 1UMMAH token rewards content creators and community builders. Earn by participating! #1ummah #crypto #rewards',
        authorId: user3.id,
        visibility: 'PUBLIC',
      },
    }),
  ]);

  // Create hashtags
  const hashtags = ['1ummah', 'launch', 'opensource', 'community', 'decentralized', 'privacy', 'freedom', 'crypto', 'rewards'];
  for (const tag of hashtags) {
    await prisma.hashtag.upsert({
      where: { tag },
      create: { tag, postCount: 1 },
      update: { postCount: { increment: 1 } },
    });
  }

  // Create some likes
  await prisma.like.createMany({
    data: [
      { userId: user2.id, postId: posts[0].id },
      { userId: user3.id, postId: posts[0].id },
      { userId: user1.id, postId: posts[1].id },
      { userId: user1.id, postId: posts[2].id },
      { userId: user2.id, postId: posts[4].id },
    ],
    skipDuplicates: true,
  });

  // Update like counts
  await prisma.post.update({ where: { id: posts[0].id }, data: { likesCount: 2 } });
  await prisma.post.update({ where: { id: posts[1].id }, data: { likesCount: 1 } });
  await prisma.post.update({ where: { id: posts[2].id }, data: { likesCount: 1 } });
  await prisma.post.update({ where: { id: posts[4].id }, data: { likesCount: 1 } });

  console.log('Seed data created successfully!');
  console.log(`  Users: ${user1.username}, ${user2.username}, ${user3.username}`);
  console.log(`  Posts: ${posts.length}`);
  console.log(`  Password for all users: password123`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
