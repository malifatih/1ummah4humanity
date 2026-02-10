import type { Request, Response } from 'express';
import * as walletService from '../services/wallet.service.js';

export async function getWallet(req: Request, res: Response) {
  const result = await walletService.getWallet(req.user!.sub);
  res.json({ data: result });
}

export async function getBalance(req: Request, res: Response) {
  const result = await walletService.getBalance(req.user!.sub);
  res.json({ data: result });
}

export async function getTransactions(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await walletService.getTransactions(
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function stakeTokens(req: Request, res: Response) {
  const { amount, lockPeriod } = req.body;
  const result = await walletService.stakeTokens(req.user!.sub, amount, lockPeriod);
  res.status(201).json({ data: result });
}

export async function unstakeTokens(req: Request, res: Response) {
  const { stakeId } = req.body;
  const result = await walletService.unstakeTokens(req.user!.sub, stakeId);
  res.json({ data: result });
}

export async function getStakes(req: Request, res: Response) {
  const result = await walletService.getStakes(req.user!.sub);
  res.json({ data: result });
}

export async function sendTokens(req: Request, res: Response) {
  const { toUserId, amount } = req.body;
  const result = await walletService.sendTokens(req.user!.sub, toUserId, amount);
  res.json({ data: result });
}
