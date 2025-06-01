import { Router } from 'express';
import { signup, login, reportBinFull, getThresholdStatus, getDispatcherNotifications } from '../controllers/auth.controller';

const router = Router();

// Public routes
router.post('/signup', signup); // Only for residents
router.post('/login', login);   // For both residents and staff
router.post('/report-bin-full', reportBinFull);
router.get('/reports/threshold-status', getThresholdStatus);
router.get('/notifications/dispatcher', getDispatcherNotifications);

export default router; 