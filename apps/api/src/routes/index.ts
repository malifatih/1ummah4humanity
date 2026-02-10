import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { usersRoutes } from './users.routes.js';
import { postsRoutes } from './posts.routes.js';
import { feedsRoutes } from './feeds.routes.js';
import { notificationsRoutes } from './notifications.routes.js';
import { messagesRoutes } from './messages.routes.js';
import { searchRoutes } from './search.routes.js';
import { groupsRoutes } from './groups.routes.js';
import { walletRoutes } from './wallet.routes.js';
import { storiesRoutes } from './stories.routes.js';
import { mediaRoutes } from './media.routes.js';
import { eventsRoutes } from './events.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/posts', postsRoutes);
router.use('/feed', feedsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/messages', messagesRoutes);
router.use('/search', searchRoutes);
router.use('/groups', groupsRoutes);
router.use('/wallet', walletRoutes);
router.use('/stories', storiesRoutes);
router.use('/media', mediaRoutes);
router.use('/events', eventsRoutes);

export { router as routes };
