import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/conversations', requireAuth, messagesController.createConversation);
router.get('/conversations', requireAuth, messagesController.getConversations);
router.get('/conversations/:id', requireAuth, messagesController.getConversation);
router.post('/conversations/:id/messages', requireAuth, messagesController.sendMessage);
router.get('/conversations/:id/messages', requireAuth, messagesController.getMessages);
router.patch('/conversations/:id/read', requireAuth, messagesController.markConversationRead);
router.delete('/conversations/:id', requireAuth, messagesController.deleteConversation);

export { router as messagesRoutes };
