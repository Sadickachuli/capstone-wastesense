import { Request, Response } from 'express';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const getNextDayForecast = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/forecast/next-day`);
    res.json(response.data);
  } catch (err) {
    console.error('ML service error:', err);
    res.status(500).json({ message: 'Failed to fetch forecast from ML service' });
  }
};

export const getForecastHistory = async (req: Request, res: Response) => {
  try {
    const { district } = req.query;
    const response = await axios.get(`${ML_SERVICE_URL}/forecast/history`, { params: { district } });
    res.json(response.data);
  } catch (err) {
    console.error('ML service error:', err);
    res.status(500).json({ message: 'Failed to fetch history from ML service' });
  }
};

export const getForecastDetails = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const response = await axios.get(`${ML_SERVICE_URL}/forecast/details`, { params: { date } });
    res.json(response.data);
  } catch (err) {
    console.error('ML service error:', err);
    res.status(500).json({ message: 'Failed to fetch details from ML service' });
  }
}; 