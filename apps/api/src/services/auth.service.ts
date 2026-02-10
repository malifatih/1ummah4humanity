import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthPayload } from '../middleware/auth.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const WALLET_NONCE_TTL = 300; // 5 minutes

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function register(input: {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
}): Promise<TokenPair> {
  // Check username uniqueness
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
  });
  if (existing) {
    throw new AppError(409, 'Username already taken');
  }

  if (input.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (emailExists) {
      throw new AppError(409, 'Email already registered');
    }
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      displayName: input.displayName || input.username,
      email: input.email || null,
      passwordHash,
      wallet: {
        create: {
          address: `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(20))).toString('hex')}`,
        },
      },
    },
  });

  return generateTokenPair(user.id, user.username, user.role);
}

export async function login(username: string, password: string): Promise<TokenPair> {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Invalid username or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError(401, 'Invalid username or password');
  }

  // Update last active
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  return generateTokenPair(user.id, user.username, user.role);
}

export async function walletChallenge(address: string): Promise<{ nonce: string; message: string }> {
  const nonce = crypto.randomUUID();
  await redis.setex(`wallet:nonce:${address.toLowerCase()}`, WALLET_NONCE_TTL, nonce);

  const message = `Sign this message to authenticate with 1Ummah.\n\nNonce: ${nonce}\nAddress: ${address}`;
  return { nonce, message };
}

export async function walletVerify(address: string, signature: string, nonce: string): Promise<TokenPair> {
  const storedNonce = await redis.get(`wallet:nonce:${address.toLowerCase()}`);
  if (!storedNonce || storedNonce !== nonce) {
    throw new AppError(401, 'Invalid or expired nonce');
  }

  const message = `Sign this message to authenticate with 1Ummah.\n\nNonce: ${nonce}\nAddress: ${address}`;
  const recoveredAddress = ethers.verifyMessage(message, signature);

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    throw new AppError(401, 'Invalid wallet signature');
  }

  // Clean up nonce
  await redis.del(`wallet:nonce:${address.toLowerCase()}`);

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { walletAddress: address.toLowerCase() },
  });

  if (!user) {
    const shortAddr = address.slice(2, 10).toLowerCase();
    user = await prisma.user.create({
      data: {
        username: `user_${shortAddr}`,
        displayName: `User ${shortAddr}`,
        walletAddress: address.toLowerCase(),
        wallet: {
          create: {
            address: address.toLowerCase(),
          },
        },
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  return generateTokenPair(user.id, user.username, user.role, address.toLowerCase());
}

export async function refreshToken(token: string): Promise<TokenPair> {
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const session = await prisma.session.findFirst({
    where: {
      userId: payload.sub,
      token,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    throw new AppError(401, 'Session not found or expired');
  }

  // Delete old session
  await prisma.session.delete({ where: { id: session.id } });

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new AppError(401, 'User not found');
  }

  return generateTokenPair(user.id, user.username, user.role, user.walletAddress || undefined);
}

export async function logout(userId: string, token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      userId,
      token,
    },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      location: true,
      website: true,
      walletAddress: true,
      isVerified: true,
      isPrivate: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

async function generateTokenPair(
  userId: string,
  username: string,
  role: string,
  walletAddress?: string
): Promise<TokenPair> {
  const payload: AuthPayload = {
    sub: userId,
    username,
    role,
    ...(walletAddress && { walletAddress }),
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshTokenValue = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  // Store refresh token as session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: {
      userId,
      token: refreshTokenValue,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    expiresIn: 900, // 15 minutes in seconds
  };
}
