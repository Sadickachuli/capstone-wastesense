import { Router } from 'express';
import { signup, login, reportBinFull, getThresholdStatus, getDispatcherNotifications, updateReportStatus, getActiveReports, getUserReports, markAllReportsCollected, getArchivedDispatcherNotifications, getDispatchRecommendation, getRecyclerNotifications, updateWasteComposition, getWasteSites, detectWasteFromImage, getWasteCompositionHistory, detectWasteFromImageLLM, upload, getDeliveries, updateDeliveryStatus, getCollectionSchedules, getSystemConfig, updateSystemConfig, completeSchedulesByReports, deleteAccount, getAllUsers, getAllReports, getSystemStats, adminCreateUser, adminUpdateUser, adminDeleteUser, checkAdminStatus } from '../controllers/auth.controller';

const router = Router();

// Public routes
router.post('/signup', signup); // Only for residents
router.post('/login', login);   // For both residents and staff
router.get('/check-admin', checkAdminStatus); // Debug endpoint to check admin status
router.post('/report-bin-full', reportBinFull);
router.get('/reports/threshold-status', getThresholdStatus);
router.get('/reports/user/:userId', getUserReports);
router.get('/notifications/dispatcher', getDispatcherNotifications);
router.get('/notifications/dispatcher/archived', getArchivedDispatcherNotifications);
router.patch('/reports/:id/status', updateReportStatus);
router.get('/reports/active', getActiveReports);
router.patch('/reports/mark-all-collected', markAllReportsCollected);
router.get('/dispatch/recommendation', getDispatchRecommendation);
router.get('/notifications/recycler', getRecyclerNotifications);
router.post('/waste-sites/:id/composition', updateWasteComposition);
router.get('/waste-sites', getWasteSites);
router.post('/detect-waste-image', upload.single('file'), detectWasteFromImage);
router.post('/detect-waste-llm', upload.single('file'), detectWasteFromImageLLM);
router.get('/waste-compositions/history', getWasteCompositionHistory);

// Delivery routes
router.get('/deliveries', getDeliveries);
router.patch('/deliveries/:id/status', updateDeliveryStatus);

// Schedule routes
router.get('/schedules', getCollectionSchedules);
router.patch('/schedules/complete-by-reports', completeSchedulesByReports);

// Configuration routes
router.get('/config', getSystemConfig);
router.post('/config', updateSystemConfig);

// Account management routes
router.delete('/account/:userId', deleteAccount);

// Admin-only routes
router.get('/admin/users', getAllUsers);
router.post('/admin/users', adminCreateUser);
router.patch('/admin/users/:id', adminUpdateUser);
router.delete('/admin/users/:id', adminDeleteUser);
router.get('/admin/reports', getAllReports);
router.get('/admin/stats', getSystemStats);

export default router; 