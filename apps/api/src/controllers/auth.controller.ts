import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
  const tokens = await authService.register(req.body);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(201).json({
    data: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
  });
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  const tokens = await authService.login(username, password);
  setRefreshCookie(res, tokens.refreshToken);
  res.json({
    data: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
  });
}

export async function walletChallenge(req: Request, res: Response) {
  const { address } = req.body;
  const challenge = await authService.walletChallenge(address);
  res.json({ data: challenge });
}

export async function walletVerify(req: Request, res: Response) {
  const { address, signature, nonce } = req.body;
  const tokens = await authService.walletVerify(address, signature, nonce);
  setRefreshCookie(res, tokens.refreshToken);
  res.json({
    data: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: 'Unauthorized', message: 'No refresh token provided' });
    return;
  }
  const tokens = await authService.refreshToken(refreshToken);
  setRefreshCookie(res, tokens.refreshToken);
  res.json({
    data: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken && req.user) {
    await authService.logout(req.user.sub, refreshToken);
  }
  res.clearCookie('refreshToken');
  res.json({ data: { message: 'Logged out successfully' } });
}

export async function getMe(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.sub);
  res.json({ data: user });
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  });
}
