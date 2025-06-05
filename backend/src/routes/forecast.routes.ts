import express from 'express';
import { getNextDayForecast, getForecastHistory, getForecastDetails } from '../controllers/forecast.controller';

const router = express.Router();

router.get('/next-day', getNextDayForecast);
router.get('/history', getForecastHistory);
router.get('/details', getForecastDetails);

export default router; 