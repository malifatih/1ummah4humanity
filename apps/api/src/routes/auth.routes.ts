import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { rateLimitAuth } from '../middleware/rateLimit.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8).max(128),
  displayName: z.string().max(50).optional(),
  email: z.string().email().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const walletChallengeSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

const walletVerifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(1),
  nonce: z.string().uuid(),
});

router.post('/register', rateLimitAuth, validate(registerSchema), authController.register);
router.post('/login', rateLimitAuth, validate(loginSchema), authController.login);
router.post('/wallet/challenge', rateLimitAuth, validate(walletChallengeSchema), authController.walletChallenge);
router.post('/wallet/verify', rateLimitAuth, validate(walletVerifySchema), authController.walletVerify);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);

export { router as authRoutes };
