import type { Request, Response } from 'express';
import * as feedsService from '../services/feeds.service.js';

export async function getHomeFeed(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await feedsService.getHomeFeed(
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function getFollowingFeed(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await feedsService.getFollowingFeed(
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function getExploreFeed(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await feedsService.getExploreFeed(
    req.query.cursor as string | undefined,
    limit,
    req.user?.sub,
  );
  res.json({ data: result });
}

export async function getTrendingHashtags(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await feedsService.getTrendingHashtags(limit);
  res.json({ data: result });
}
