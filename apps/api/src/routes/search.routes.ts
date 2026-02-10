import { Router } from 'express';
import * as searchController from '../controllers/search.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { rateLimitSearch } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', rateLimitSearch, optionalAuth, searchController.searchAll);
router.get('/posts', rateLimitSearch, optionalAuth, searchController.searchPosts);
router.get('/users', rateLimitSearch, optionalAuth, searchController.searchUsers);
router.get('/hashtags', rateLimitSearch, searchController.searchHashtags);

export { router as searchRoutes };
