import express from 'express';
import { getDashboardStats, getUsageTrend } from '../controllers/statsController.js';
import { getActivities } from '../controllers/statsController.js';

const router = express.Router();

router.get('/dashboard', getDashboardStats);
router.get('/usage-trend', getUsageTrend);

// Activities
router.get('/activities', getActivities);

export default router;
