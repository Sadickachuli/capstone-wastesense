import { Router } from 'express';
import { signup, login, reportBinFull, getThresholdStatus, getDispatcherNotifications, updateReportStatus, getActiveReports, markAllReportsCollected, getArchivedDispatcherNotifications, getDispatchRecommendation } from '../controllers/auth.controller';

const router = Router();

// Public routes
router.post('/signup', signup); // Only for residents
router.post('/login', login);   // For both residents and staff
router.post('/report-bin-full', reportBinFull);
router.get('/reports/threshold-status', getThresholdStatus);
router.get('/notifications/dispatcher', getDispatcherNotifications);
router.get('/notifications/dispatcher/archived', getArchivedDispatcherNotifications);
router.patch('/reports/:id/status', updateReportStatus);
router.get('/reports/active', getActiveReports);
router.patch('/reports/mark-all-collected', markAllReportsCollected);
router.get('/dispatch/recommendation', getDispatchRecommendation);

export default router; 