import { Router } from 'express';
import * as storiesController from '../controllers/stories.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, storiesController.createStory);
router.get('/', requireAuth, storiesController.getActiveStories);
router.get('/user/:userId', optionalAuth, storiesController.getUserStories);
router.post('/:id/view', requireAuth, storiesController.viewStory);
router.get('/:id/viewers', requireAuth, storiesController.getStoryViewers);
router.delete('/:id', requireAuth, storiesController.deleteStory);

export { router as storiesRoutes };
