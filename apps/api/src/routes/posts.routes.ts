import { Router } from 'express';
import * as postsController from '../controllers/posts.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { rateLimitPostCreation } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', requireAuth, rateLimitPostCreation, postsController.createPost);
router.get('/:id', optionalAuth, postsController.getPost);
router.delete('/:id', requireAuth, postsController.deletePost);
router.get('/:id/thread', optionalAuth, postsController.getPostThread);
router.post('/:id/like', requireAuth, postsController.likePost);
router.delete('/:id/like', requireAuth, postsController.unlikePost);
router.post('/:id/repost', requireAuth, postsController.repostPost);
router.delete('/:id/repost', requireAuth, postsController.unrepostPost);
router.post('/:id/bookmark', requireAuth, postsController.bookmarkPost);
router.delete('/:id/bookmark', requireAuth, postsController.unbookmarkPost);

export { router as postsRoutes };
