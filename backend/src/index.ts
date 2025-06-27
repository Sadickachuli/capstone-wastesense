import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import forecastRoutes from './routes/forecast.routes';
import fuelRoutes from './routes/fuel.routes';

dotenv.config();

const app = express();
app.disable('etag');
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (avatars, etc.)
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/fuel', fuelRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 