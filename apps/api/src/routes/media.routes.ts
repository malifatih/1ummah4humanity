import { Router } from 'express';
import multer from 'multer';
import * as mediaController from '../controllers/media.controller.js';
import { requireAuth } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.post('/upload', requireAuth, upload.single('file'), mediaController.uploadMedia);
router.post('/presigned-url', requireAuth, mediaController.getPresignedUrl);
router.delete('/:id', requireAuth, mediaController.deleteMedia);

export { router as mediaRoutes };
