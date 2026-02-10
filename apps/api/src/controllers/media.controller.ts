import type { Request, Response } from 'express';
import * as mediaService from '../services/media.service.js';

export async function uploadMedia(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: 'BadRequest', message: 'No file provided' });
    return;
  }

  const result = await mediaService.uploadMedia(
    {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      size: req.file.size,
    },
    req.user!.sub,
  );

  res.status(201).json({ data: result });
}

export async function getPresignedUrl(req: Request, res: Response) {
  const { filename, contentType } = req.body;
  if (!filename || !contentType) {
    res.status(400).json({ error: 'BadRequest', message: 'filename and contentType are required' });
    return;
  }

  const result = await mediaService.getPresignedUploadUrl(
    req.user!.sub,
    filename,
    contentType,
  );

  res.status(201).json({ data: result });
}

export async function deleteMedia(req: Request, res: Response) {
  await mediaService.deleteMedia(req.params.id as string, req.user!.sub);
  res.status(204).send();
}
