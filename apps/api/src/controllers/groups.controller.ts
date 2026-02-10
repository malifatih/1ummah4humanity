import type { Request, Response } from 'express';
import * as groupsService from '../services/groups.service.js';

export async function createGroup(req: Request, res: Response) {
  const result = await groupsService.createGroup(req.user!.sub, req.body);
  res.status(201).json({ data: result });
}

export async function getGroup(req: Request, res: Response) {
  const result = await groupsService.getGroup(req.params.slug as string, req.user?.sub);
  res.json({ data: result });
}

export async function updateGroup(req: Request, res: Response) {
  const result = await groupsService.updateGroup(req.params.slug as string, req.user!.sub, req.body);
  res.json({ data: result });
}

export async function deleteGroup(req: Request, res: Response) {
  await groupsService.deleteGroup(req.params.slug as string, req.user!.sub);
  res.status(204).send();
}

export async function discoverGroups(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await groupsService.discoverGroups(
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function getUserGroups(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await groupsService.getUserGroups(
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function joinGroup(req: Request, res: Response) {
  const result = await groupsService.joinGroup(req.params.slug as string, req.user!.sub);
  res.status(201).json({ data: result });
}

export async function leaveGroup(req: Request, res: Response) {
  const result = await groupsService.leaveGroup(req.params.slug as string, req.user!.sub);
  res.json({ data: result });
}

export async function getGroupMembers(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await groupsService.getGroupMembers(
    req.params.slug as string,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function updateMemberRole(req: Request, res: Response) {
  const result = await groupsService.updateMemberRole(
    req.params.slug as string,
    req.user!.sub,
    req.params.userId as string,
    req.body.role,
  );
  res.json({ data: result });
}

export async function removeMember(req: Request, res: Response) {
  const result = await groupsService.removeMember(
    req.params.slug as string,
    req.user!.sub,
    req.params.userId as string,
  );
  res.json({ data: result });
}

export async function getGroupPosts(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await groupsService.getGroupPosts(
    req.params.slug as string,
    req.user?.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}
