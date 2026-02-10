import type { Request, Response } from 'express';
import * as notificationsService from '../services/notifications.service.js';

export async function getNotifications(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await notificationsService.getNotifications(
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function markAsRead(req: Request, res: Response) {
  const result = await notificationsService.markAsRead(req.params.id as string, req.user!.sub);
  res.json({ data: result });
}

export async function markAllAsRead(req: Request, res: Response) {
  const result = await notificationsService.markAllAsRead(req.user!.sub);
  res.json({ data: result });
}

export async function deleteNotification(req: Request, res: Response) {
  await notificationsService.deleteNotification(req.params.id as string, req.user!.sub);
  res.status(204).send();
}

export async function getUnreadCount(req: Request, res: Response) {
  const result = await notificationsService.getUnreadCount(req.user!.sub);
  res.json({ data: result });
}
