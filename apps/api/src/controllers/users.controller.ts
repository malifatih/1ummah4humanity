import type { Request, Response } from 'express';
import * as usersService from '../services/users.service.js';

export async function getProfile(req: Request, res: Response) {
  const result = await usersService.getProfile(req.params.username as string, req.user?.sub);
  res.json({ data: result });
}

export async function updateProfile(req: Request, res: Response) {
  const result = await usersService.updateProfile(req.user!.sub, req.body);
  res.json({ data: result });
}

export async function getFollowers(req: Request, res: Response) {
  const result = await usersService.getFollowers(
    req.params.username as string,
    req.query.cursor as string | undefined,
  );
  res.json({ data: result });
}

export async function getFollowing(req: Request, res: Response) {
  const result = await usersService.getFollowing(
    req.params.username as string,
    req.query.cursor as string | undefined,
  );
  res.json({ data: result });
}

export async function followUser(req: Request, res: Response) {
  const result = await usersService.followUser(req.user!.sub, req.params.username as string);
  res.status(201).json({ data: result });
}

export async function unfollowUser(req: Request, res: Response) {
  const result = await usersService.unfollowUser(req.user!.sub, req.params.username as string);
  res.json({ data: result });
}

export async function blockUser(req: Request, res: Response) {
  const result = await usersService.blockUser(req.user!.sub, req.params.username as string);
  res.status(201).json({ data: result });
}

export async function unblockUser(req: Request, res: Response) {
  const result = await usersService.unblockUser(req.user!.sub, req.params.username as string);
  res.json({ data: result });
}

export async function muteUser(req: Request, res: Response) {
  const result = await usersService.muteUser(req.user!.sub, req.params.username as string);
  res.status(201).json({ data: result });
}

export async function unmuteUser(req: Request, res: Response) {
  const result = await usersService.unmuteUser(req.user!.sub, req.params.username as string);
  res.json({ data: result });
}
