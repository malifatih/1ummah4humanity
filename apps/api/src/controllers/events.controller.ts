import type { Request, Response } from 'express';
import * as eventsService from '../services/events.service.js';

export async function createEvent(req: Request, res: Response) {
  const result = await eventsService.createEvent(req.user!.sub, req.body);
  res.status(201).json({ data: result });
}

export async function getEvent(req: Request, res: Response) {
  const result = await eventsService.getEvent(req.params.id as string, req.user?.sub);
  res.json({ data: result });
}

export async function updateEvent(req: Request, res: Response) {
  const result = await eventsService.updateEvent(req.params.id as string, req.user!.sub, req.body);
  res.json({ data: result });
}

export async function deleteEvent(req: Request, res: Response) {
  await eventsService.deleteEvent(req.params.id as string, req.user!.sub);
  res.status(204).send();
}

export async function getUpcomingEvents(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await eventsService.getUpcomingEvents(
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function getUserEvents(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await eventsService.getUserEvents(
    req.user!.sub,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}

export async function attendEvent(req: Request, res: Response) {
  const { status } = req.body;
  const result = await eventsService.attendEvent(req.params.id as string, req.user!.sub, status);
  res.status(201).json({ data: result });
}

export async function unattendEvent(req: Request, res: Response) {
  const result = await eventsService.unattendEvent(req.params.id as string, req.user!.sub);
  res.json({ data: result });
}

export async function getAttendees(req: Request, res: Response) {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const result = await eventsService.getAttendees(
    req.params.id as string,
    req.query.cursor as string | undefined,
    limit,
  );
  res.json({ data: result });
}
