import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, notificationsController.getNotifications);
router.patch('/mark-all-read', requireAuth, notificationsController.markAllAsRead);
router.get('/unread-count', requireAuth, notificationsController.getUnreadCount);
router.patch('/:id/read', requireAuth, notificationsController.markAsRead);
router.delete('/:id', requireAuth, notificationsController.deleteNotification);

export { router as notificationsRoutes };
