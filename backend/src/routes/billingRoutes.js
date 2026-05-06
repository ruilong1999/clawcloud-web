import express from 'express';
import {
  getTodayBilling,
  getBillingHistory,
  generateDailyStats
} from '../controllers/billingController.js';

const router = express.Router();

router.get('/today', getTodayBilling);
router.get('/history', getBillingHistory);
router.post('/generate-stats', generateDailyStats);

export default router;
