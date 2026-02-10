import { prisma } from '../config/database.js';
import { TransactionType, TransactionStatus, StakeStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { randomUUID } from 'crypto';

// Hardcoded constants (mirrors @1ummah/shared)
const STAKE_PERIODS: Record<number, { apy: number }> = {
  30: { apy: 5 },
  60: { apy: 7.5 },
  90: { apy: 10 },
  180: { apy: 15 },
  365: { apy: 25 },
};

export async function getWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      address: true,
      balance: true,
      stakedAmount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        address: `0x${randomUUID().replace(/-/g, '')}`,
        balance: 0,
        stakedAmount: 0,
      },
      select: {
        id: true,
        userId: true,
        address: true,
        balance: true,
        stakedAmount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  return wallet;
}

export async function getBalance(userId: string) {
  const wallet = await getWallet(userId);
  return { balance: wallet.balance, stakedAmount: wallet.stakedAmount };
}

export async function getTransactions(userId: string, cursor?: string, limit = 20) {
  const wallet = await getWallet(userId);

  const transactions = await prisma.transaction.findMany({
    where: {
      walletId: wallet.id,
      ...(cursor && { id: { lt: cursor } }),
    },
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      walletId: true,
      type: true,
      amount: true,
      description: true,
      txHash: true,
      status: true,
      createdAt: true,
    },
  });

  const hasMore = transactions.length > limit;
  const sliced = transactions.slice(0, limit);
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : undefined;

  return { data: sliced, pagination: { nextCursor, hasMore } };
}

export async function rewardUser(
  userId: string,
  type: TransactionType,
  amount: number,
  description: string
) {
  const wallet = await getWallet(userId);

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        description,
        status: TransactionStatus.COMPLETED,
      },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
  ]);

  return transaction;
}

export async function stakeTokens(userId: string, amount: number, lockPeriod: number) {
  if (amount <= 0) {
    throw new AppError(400, 'Stake amount must be greater than 0');
  }

  const periodConfig = STAKE_PERIODS[lockPeriod];
  if (!periodConfig) {
    throw new AppError(400, `Invalid lock period. Valid periods: ${Object.keys(STAKE_PERIODS).join(', ')} days`);
  }

  const wallet = await getWallet(userId);

  if (parseFloat(wallet.balance.toString()) < amount) {
    throw new AppError(400, 'Insufficient balance');
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + lockPeriod);

  const [stake] = await prisma.$transaction([
    prisma.stake.create({
      data: {
        walletId: wallet.id,
        amount,
        lockPeriod,
        apy: periodConfig.apy,
        startDate,
        endDate,
        status: StakeStatus.ACTIVE,
      },
    }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.STAKE,
        amount,
        description: `Staked for ${lockPeriod} days at ${periodConfig.apy}% APY`,
        status: TransactionStatus.COMPLETED,
      },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: amount },
        stakedAmount: { increment: amount },
      },
    }),
  ]);

  return stake;
}

export async function unstakeTokens(userId: string, stakeId: string) {
  const wallet = await getWallet(userId);

  const stake = await prisma.stake.findUnique({ where: { id: stakeId } });
  if (!stake) throw new AppError(404, 'Stake not found');
  if (stake.walletId !== wallet.id) throw new AppError(403, 'This stake does not belong to you');
  if (stake.status !== StakeStatus.ACTIVE) throw new AppError(400, 'Stake is not active');

  if (new Date() < stake.endDate) {
    throw new AppError(400, 'Stake lock period has not ended yet');
  }

  const principal = parseFloat(stake.amount.toString());
  const apy = parseFloat(stake.apy.toString());
  const daysStaked = Math.ceil(
    (stake.endDate.getTime() - stake.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const reward = principal * (apy / 100) * (daysStaked / 365);
  const totalReturn = principal + reward;

  const [updatedStake] = await prisma.$transaction([
    prisma.stake.update({
      where: { id: stakeId },
      data: { status: StakeStatus.COMPLETED },
    }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.UNSTAKE,
        amount: totalReturn,
        description: `Unstaked ${principal} + ${reward.toFixed(8)} reward (${apy}% APY, ${daysStaked} days)`,
        status: TransactionStatus.COMPLETED,
      },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: totalReturn },
        stakedAmount: { decrement: principal },
      },
    }),
  ]);

  return { stake: updatedStake, reward, totalReturn };
}

export async function getStakes(userId: string) {
  const wallet = await getWallet(userId);

  const stakes = await prisma.stake.findMany({
    where: { walletId: wallet.id },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      walletId: true,
      amount: true,
      lockPeriod: true,
      apy: true,
      startDate: true,
      endDate: true,
      status: true,
      createdAt: true,
    },
  });

  return stakes;
}

export async function sendTokens(fromUserId: string, toUserId: string, amount: number) {
  if (amount <= 0) {
    throw new AppError(400, 'Transfer amount must be greater than 0');
  }

  if (fromUserId === toUserId) {
    throw new AppError(400, 'Cannot send tokens to yourself');
  }

  const fromWallet = await getWallet(fromUserId);
  const toWallet = await getWallet(toUserId);

  if (parseFloat(fromWallet.balance.toString()) < amount) {
    throw new AppError(400, 'Insufficient balance');
  }

  const [transferOut] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        walletId: fromWallet.id,
        type: TransactionType.TRANSFER_OUT,
        amount,
        description: `Transfer to wallet ${toWallet.address}`,
        status: TransactionStatus.COMPLETED,
      },
    }),
    prisma.transaction.create({
      data: {
        walletId: toWallet.id,
        type: TransactionType.TRANSFER_IN,
        amount,
        description: `Transfer from wallet ${fromWallet.address}`,
        status: TransactionStatus.COMPLETED,
      },
    }),
    prisma.wallet.update({
      where: { id: fromWallet.id },
      data: { balance: { decrement: amount } },
    }),
    prisma.wallet.update({
      where: { id: toWallet.id },
      data: { balance: { increment: amount } },
    }),
  ]);

  return transferOut;
}
