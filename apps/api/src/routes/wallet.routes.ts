import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, walletController.getWallet);
router.get('/balance', requireAuth, walletController.getBalance);
router.get('/transactions', requireAuth, walletController.getTransactions);
router.get('/stakes', requireAuth, walletController.getStakes);
router.post('/stake', requireAuth, walletController.stakeTokens);
router.post('/unstake', requireAuth, walletController.unstakeTokens);
router.post('/send', requireAuth, walletController.sendTokens);

export { router as walletRoutes };
