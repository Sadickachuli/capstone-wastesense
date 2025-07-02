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

// Manual database setup endpoint (for initial setup)
app.post('/setup-database', async (req: Request, res: Response) => {
  try {
    console.log('🗄️ Setting up database...');
    
    // Simple table creation instead of complex migrations
    await db.raw(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR UNIQUE,
        password_hash VARCHAR NOT NULL,
        role VARCHAR NOT NULL CHECK (role IN ('resident', 'dispatcher', 'recycler')),
        name VARCHAR NOT NULL,
        phone VARCHAR,
        zone VARCHAR,
        facility VARCHAR,
        employee_id VARCHAR UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS waste_sites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR NOT NULL,
        location VARCHAR NOT NULL,
        current_capacity DECIMAL NOT NULL DEFAULT 0,
        max_capacity DECIMAL NOT NULL DEFAULT 100,
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS reports (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        location JSONB,
        zone VARCHAR,
        description TEXT,
        status VARCHAR NOT NULL DEFAULT 'new',
        timestamp TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Add test users if none exist
    const userCount = await db('users').count('id as count').first();
    if (!userCount || parseInt(userCount.count as string) === 0) {
      console.log('🌱 Adding test users...');
      await db('users').insert([
        {
          email: 'recyclerablekuma1@test.com',
          password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
          role: 'resident',
          name: 'Test Resident',
          zone: 'North Accra'
        },
        {
          employee_id: 'DIS001',
          email: 'dispatcher@test.com',
          password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
          role: 'dispatcher',
          name: 'Test Dispatcher',
          facility: 'Central Dispatch'
        },
        {
          employee_id: 'REC001',
          email: 'recycler@test.com',
          password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
          role: 'recycler',
          name: 'Test Recycler',
          facility: 'Recycling Center 1'
        }
      ]);
      
      // Add test waste sites
      await db('waste_sites').insert([
        {
          name: 'North Accra Collection Point',
          location: 'North Accra',
          current_capacity: 75.5,
          max_capacity: 100
        },
        {
          name: 'Central Waste Hub',
          location: 'Central Accra',
          current_capacity: 45.2,
          max_capacity: 150
        }
      ]);
    }
    
    console.log('✅ Database setup completed');
    res.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      users_created: userCount && parseInt(userCount.count as string) === 0
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database setup failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`🔧 To setup database, POST to /setup-database`);
}); 