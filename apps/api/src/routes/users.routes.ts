import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import * as postsController from '../controllers/posts.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:username', optionalAuth, usersController.getProfile);
router.patch('/me', requireAuth, usersController.updateProfile);
router.get('/:username/posts', optionalAuth, postsController.getUserPosts);
router.get('/:username/likes', optionalAuth, postsController.getUserLikedPosts);
router.get('/:username/followers', usersController.getFollowers);
router.get('/:username/following', usersController.getFollowing);
router.post('/:username/follow', requireAuth, usersController.followUser);
router.delete('/:username/follow', requireAuth, usersController.unfollowUser);
router.post('/:username/block', requireAuth, usersController.blockUser);
router.delete('/:username/block', requireAuth, usersController.unblockUser);
router.post('/:username/mute', requireAuth, usersController.muteUser);
router.delete('/:username/mute', requireAuth, usersController.unmuteUser);

export { router as usersRoutes };
