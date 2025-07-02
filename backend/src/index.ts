import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import forecastRoutes from './routes/forecast.routes';
import fuelRoutes from './routes/fuel.routes';
import { db } from './db';

dotenv.config();

const app = express();
app.disable('etag');
const port = process.env.PORT || 3001;

// Auto-run database migrations and seeds on startup
async function initializeDatabase() {
  try {
    console.log('🗄️ Running database migrations...');
    const knex = require('knex');
    const config = require('../knexfile.ts').default;
    const environment = process.env.NODE_ENV || 'development';
    const knexInstance = knex(config[environment]);
    
    await knexInstance.migrate.latest();
    console.log('✅ Database migrations completed');
    
    // Check if database is empty (no users), then seed
    const userCount = await db('users').count('id as count').first();
    if (!userCount || parseInt(userCount.count as string) === 0) {
      console.log('🌱 Database is empty, running seeds...');
      await knexInstance.seed.run();
      console.log('✅ Database seeding completed');
    } else {
      console.log('📊 Database already has data, skipping seeds');
    }
    
    await knexInstance.destroy();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't crash the app, continue running
  }
}

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

// Initialize database then start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  // Start server anyway
  app.listen(port, () => {
    console.log(`⚠️ Server started on port ${port} (database init failed)`);
  });
}); 