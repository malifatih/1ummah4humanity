import { Router } from 'express';
import * as groupsController from '../controllers/groups.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, groupsController.createGroup);
router.get('/', optionalAuth, groupsController.discoverGroups);
router.get('/mine', requireAuth, groupsController.getUserGroups);
router.get('/:slug', optionalAuth, groupsController.getGroup);
router.patch('/:slug', requireAuth, groupsController.updateGroup);
router.delete('/:slug', requireAuth, groupsController.deleteGroup);
router.get('/:slug/members', optionalAuth, groupsController.getGroupMembers);
router.get('/:slug/posts', optionalAuth, groupsController.getGroupPosts);
router.post('/:slug/join', requireAuth, groupsController.joinGroup);
router.delete('/:slug/leave', requireAuth, groupsController.leaveGroup);
router.patch('/:slug/members/:userId/role', requireAuth, groupsController.updateMemberRole);
router.delete('/:slug/members/:userId', requireAuth, groupsController.removeMember);

export { router as groupsRoutes };
