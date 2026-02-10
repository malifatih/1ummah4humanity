import type { Request, Response } from 'express';
import * as postsService from '../services/posts.service.js';

export async function createPost(req: Request, res: Response) {
  const result = await postsService.createPost(req.user!.sub, req.body);
  res.status(201).json({ data: result });
}

export async function getPost(req: Request, res: Response) {
  const result = await postsService.getPost(req.params.id as string, req.user?.sub);
  res.json({ data: result });
}

export async function deletePost(req: Request, res: Response) {
  await postsService.deletePost(req.params.id as string, req.user!.sub);
  res.status(204).send();
}

export async function likePost(req: Request, res: Response) {
  const result = await postsService.likePost(req.user!.sub, req.params.id as string);
  res.status(201).json({ data: result });
}

export async function unlikePost(req: Request, res: Response) {
  const result = await postsService.unlikePost(req.user!.sub, req.params.id as string);
  res.json({ data: result });
}

export async function repostPost(req: Request, res: Response) {
  const result = await postsService.repostPost(req.user!.sub, req.params.id as string);
  res.status(201).json({ data: result });
}

export async function unrepostPost(req: Request, res: Response) {
  const result = await postsService.unrepostPost(req.user!.sub, req.params.id as string);
  res.json({ data: result });
}

export async function bookmarkPost(req: Request, res: Response) {
  const result = await postsService.bookmarkPost(req.user!.sub, req.params.id as string);
  res.status(201).json({ data: result });
}

export async function unbookmarkPost(req: Request, res: Response) {
  const result = await postsService.unbookmarkPost(req.user!.sub, req.params.id as string);
  res.json({ data: result });
}

export async function getUserPosts(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await postsService.getUserPosts(
    req.params.username as string,
    req.query.cursor as string | undefined,
    limit,
    req.user?.sub,
  );
  res.json({ data: result });
}

export async function getUserLikedPosts(req: Request, res: Response) {
  const result = await postsService.getUserLikedPosts(
    req.params.username as string,
    req.query.cursor as string | undefined,
  );
  res.json({ data: result });
}

export async function getPostThread(req: Request, res: Response) {
  const result = await postsService.getPostThread(req.params.id as string, req.user?.sub);
  res.json({ data: result });
}
