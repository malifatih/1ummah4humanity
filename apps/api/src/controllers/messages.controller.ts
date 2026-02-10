import type { Request, Response } from 'express';
import * as messagesService from '../services/messages.service.js';

export async function createConversation(req: Request, res: Response) {
  const { participantIds, isGroup, name } = req.body;
  const result = await messagesService.createConversation(
    req.user!.sub,
    participantIds,
    isGroup,
    name
  );
  res.status(201).json({ data: result });
}

export async function getConversations(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await messagesService.getConversations(
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit
  );
  res.json({ data: result });
}

export async function getConversation(req: Request, res: Response) {
  const result = await messagesService.getConversation(
    req.params.id as string,
    req.user!.sub
  );
  res.json({ data: result });
}

export async function sendMessage(req: Request, res: Response) {
  const { content, mediaUrl } = req.body;
  const result = await messagesService.sendMessage(
    req.params.id as string,
    req.user!.sub,
    content,
    mediaUrl
  );
  res.status(201).json({ data: result });
}

export async function getMessages(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await messagesService.getMessages(
    req.params.id as string,
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit
  );
  res.json({ data: result });
}

export async function markConversationRead(req: Request, res: Response) {
  const result = await messagesService.markConversationRead(
    req.params.id as string,
    req.user!.sub
  );
  res.json({ data: result });
}

export async function deleteConversation(req: Request, res: Response) {
  await messagesService.deleteConversation(
    req.params.id as string,
    req.user!.sub
  );
  res.status(204).send();
}
