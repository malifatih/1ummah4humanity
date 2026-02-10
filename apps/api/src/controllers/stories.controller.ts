import type { Request, Response } from 'express';
import * as storiesService from '../services/stories.service.js';

export async function createStory(req: Request, res: Response) {
  const { mediaId, caption } = req.body;
  const result = await storiesService.createStory(req.user!.sub, mediaId, caption);
  res.status(201).json({ data: result });
}

export async function getActiveStories(req: Request, res: Response) {
  const result = await storiesService.getActiveStories(req.user!.sub);
  res.json({ data: result });
}

export async function getUserStories(req: Request, res: Response) {
  const result = await storiesService.getUserStories(
    req.params.userId as string,
    req.user?.sub,
  );
  res.json({ data: result });
}

export async function viewStory(req: Request, res: Response) {
  const result = await storiesService.viewStory(req.params.id as string, req.user!.sub);
  res.json({ data: result });
}

export async function getStoryViewers(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await storiesService.getStoryViewers(
    req.params.id as string,
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function deleteStory(req: Request, res: Response) {
  await storiesService.deleteStory(req.params.id as string, req.user!.sub);
  res.status(204).send();
}
