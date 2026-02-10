import { Router } from 'express';
import * as feedsController from '../controllers/feeds.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/home', requireAuth, feedsController.getHomeFeed);
router.get('/following', requireAuth, feedsController.getFollowingFeed);
router.get('/explore', optionalAuth, feedsController.getExploreFeed);
router.get('/trending/hashtags', feedsController.getTrendingHashtags);

export { router as feedsRoutes };
