import { Router } from 'express';
import * as eventsController from '../controllers/events.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, eventsController.createEvent);
router.get('/', optionalAuth, eventsController.getUpcomingEvents);
router.get('/mine', requireAuth, eventsController.getUserEvents);
router.get('/:id', optionalAuth, eventsController.getEvent);
router.patch('/:id', requireAuth, eventsController.updateEvent);
router.delete('/:id', requireAuth, eventsController.deleteEvent);
router.post('/:id/attend', requireAuth, eventsController.attendEvent);
router.delete('/:id/attend', requireAuth, eventsController.unattendEvent);
router.get('/:id/attendees', optionalAuth, eventsController.getAttendees);

export { router as eventsRoutes };
