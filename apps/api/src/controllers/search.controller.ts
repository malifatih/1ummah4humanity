import type { Request, Response } from 'express';
import * as searchService from '../services/search.service.js';

export async function searchPosts(req: Request, res: Response) {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: 'BadRequest', message: 'Query parameter "q" is required' });
    return;
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await searchService.searchPosts(
    query,
    req.query.cursor as string | undefined,
    limit,
    req.user?.sub,
  );
  res.json({ data: result });
}

export async function searchUsers(req: Request, res: Response) {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: 'BadRequest', message: 'Query parameter "q" is required' });
    return;
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await searchService.searchUsers(
    query,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function searchHashtags(req: Request, res: Response) {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: 'BadRequest', message: 'Query parameter "q" is required' });
    return;
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await searchService.searchHashtags(query, limit);
  res.json({ data: result });
}

export async function searchAll(req: Request, res: Response) {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: 'BadRequest', message: 'Query parameter "q" is required' });
    return;
  }

  const result = await searchService.searchAll(query, req.user?.sub);
  res.json({ data: result });
}
