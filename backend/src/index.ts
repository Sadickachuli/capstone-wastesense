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
    
    // Create or update enum type to include admin
    await db.raw(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('resident', 'dispatcher', 'recycler', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN 
          -- Enum already exists, try to add admin role if it doesn't exist
          BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
          EXCEPTION
            WHEN OTHERS THEN null;
          END;
      END $$;
    `);
    
    // Complete table creation to match all migrations
    await db.raw(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR UNIQUE,
        password_hash VARCHAR NOT NULL,
        role user_role NOT NULL,
        name VARCHAR NOT NULL,
        phone VARCHAR,
        zone VARCHAR,
        facility VARCHAR,
        employee_id VARCHAR UNIQUE,
        avatar VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS waste_sites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR NOT NULL,
        location VARCHAR NOT NULL,
        current_capacity DECIMAL NOT NULL DEFAULT 0,
        max_capacity DECIMAL NOT NULL DEFAULT 100,
        composition_plastic DECIMAL DEFAULT 0,
        composition_paper DECIMAL DEFAULT 0,
        composition_glass DECIMAL DEFAULT 0,
        composition_metal DECIMAL DEFAULT 0,
        composition_organic DECIMAL DEFAULT 0,
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
      
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR PRIMARY KEY,
        type VARCHAR NOT NULL,
        make VARCHAR NOT NULL,
        model VARCHAR NOT NULL,
        year INTEGER NOT NULL,
        fuel_efficiency_kmpl DECIMAL(8,2) NOT NULL,
        tank_capacity_liters DECIMAL(8,2) NOT NULL,
        current_fuel_level DECIMAL(8,2) DEFAULT 0,
        total_distance_km DECIMAL(10,2) DEFAULT 0,
        status VARCHAR DEFAULT 'available',
        registration_number VARCHAR,
        driver_name VARCHAR,
        driver_contact VARCHAR,
        fuel_percentage INTEGER,
        estimated_range_km INTEGER,
        needs_refuel BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vehicle_id VARCHAR REFERENCES vehicles(id) ON DELETE CASCADE,
        trip_type VARCHAR NOT NULL,
        related_id VARCHAR,
        distance_km DECIMAL(8,2) NOT NULL,
        fuel_consumed_liters DECIMAL(8,2) NOT NULL,
        actual_efficiency_kmpl DECIMAL(8,2) NOT NULL,
        fuel_cost DECIMAL(8,2),
        route_description VARCHAR,
        trip_start TIMESTAMP NOT NULL,
        trip_end TIMESTAMP NOT NULL,
        logged_by VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS deliveries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        truck_id VARCHAR NOT NULL,
        facility_id VARCHAR NOT NULL,
        zone VARCHAR NOT NULL,
        estimated_arrival TIMESTAMP NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        weight DECIMAL(8,2) NOT NULL DEFAULT 0,
        composition JSONB NOT NULL,
        created_by VARCHAR,
        planned_distance_km DECIMAL(8,2),
        actual_distance_km DECIMAL(8,2),
        fuel_consumed_liters DECIMAL(8,2),
        fuel_cost DECIMAL(8,2),
        actual_departure TIMESTAMP,
        actual_arrival TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR PRIMARY KEY,
        vehicle_id VARCHAR NOT NULL,
        zone VARCHAR NOT NULL,
        scheduled_start TIMESTAMP NOT NULL,
        estimated_completion TIMESTAMP NOT NULL,
        status VARCHAR DEFAULT 'scheduled',
        reports_count INTEGER DEFAULT 0,
        estimated_distance_km INTEGER NOT NULL,
        estimated_fuel_consumption DECIMAL(8,2),
        driver_name VARCHAR,
        driver_contact VARCHAR,
        created_by VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR PRIMARY KEY,
        value TEXT NOT NULL,
        description VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        type VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        for_role user_role NOT NULL,
        metadata JSONB,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS waste_compositions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        site_id UUID REFERENCES waste_sites(id) ON DELETE CASCADE,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        plastic_percent DECIMAL NOT NULL DEFAULT 0,
        paper_percent DECIMAL NOT NULL DEFAULT 0,
        glass_percent DECIMAL NOT NULL DEFAULT 0,
        metal_percent DECIMAL NOT NULL DEFAULT 0,
        organic_percent DECIMAL NOT NULL DEFAULT 0,
        textile_percent FLOAT,
        other_percent FLOAT,
        current_capacity FLOAT,
        annotated_image TEXT,
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
          zone: 'Ablekuma North'
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
    }

    // Always ensure admin user exists (regardless of user count)
    const adminExists = await db('users').where('employee_id', 'ADMIN001').first();
    if (!adminExists) {
      console.log('👑 Creating admin user...');
      await db('users').insert({
        employee_id: 'ADMIN001',
        email: 'admin@wastesense.com',
        password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        role: 'admin',
        name: 'WasteSense Admin',
        facility: 'Admin Panel'
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Continue with other setup if users were created
    if (!userCount || parseInt(userCount.count as string) === 0) {
      
      // Add test waste sites with compositions
      await db('waste_sites').insert([
        {
          name: 'Ablekuma North Collection Point',
          location: 'Ablekuma North',
          current_capacity: 75.5,
          max_capacity: 100,
          composition_plastic: 25.0,
          composition_paper: 20.0,
          composition_glass: 15.0,
          composition_metal: 10.0,
          composition_organic: 30.0
        },
        {
          name: 'Ayawaso West Collection Point',
          location: 'Ayawaso West',
          current_capacity: 45.2,
          max_capacity: 150,
          composition_plastic: 30.0,
          composition_paper: 18.0,
          composition_glass: 12.0,
          composition_metal: 8.0,
          composition_organic: 32.0
        }
      ]);
      
      // Add test vehicles with proper structure from migration
      await db('vehicles').insert([
        {
          id: 'T001',
          type: 'truck',
          make: 'Ford',
          model: 'F-450',
          year: 2020,
          fuel_efficiency_kmpl: 8.5,
          tank_capacity_liters: 150,
          current_fuel_level: 120,
          total_distance_km: 45000,
          status: 'available',
          registration_number: 'GR-001-23'
        },
        {
          id: 'T002',
          type: 'truck',
          make: 'Mercedes',
          model: 'Atego',
          year: 2019,
          fuel_efficiency_kmpl: 9.2,
          tank_capacity_liters: 140,
          current_fuel_level: 100,
          total_distance_km: 38000,
          status: 'available',
          registration_number: 'GR-002-23'
        },
        {
          id: 'T003',
          type: 'van',
          make: 'Ford',
          model: 'Transit',
          year: 2021,
          fuel_efficiency_kmpl: 12.5,
          tank_capacity_liters: 80,
          current_fuel_level: 65,
          total_distance_km: 22000,
          status: 'available',
          registration_number: 'GR-003-23'
        }
      ]);
      
      // Add comprehensive system config from migration
      await db('system_config').insert([
        {
          key: 'zone_customers',
          value: JSON.stringify({
            'Ablekuma North': { totalCustomers: 145 },
            'Ayawaso West': { totalCustomers: 82 }
          }),
          description: 'Customer counts per zone for threshold calculations'
        },
        {
          key: 'dumping_sites',
          value: JSON.stringify([
            { name: 'Borteyman Landfill', distance: 25, coordinates: '5.8037, -0.0874' },
            { name: 'Kpone Engineered Landfill', distance: 18, coordinates: '5.7081, 0.0074' }
          ]),
          description: 'Available dumping sites with distances'
        },
        {
          key: 'fuel_prices',
          value: JSON.stringify({
            petrol: 12.0,
            diesel: 9.5
          }),
          description: 'Current fuel prices per liter in GHS'
        },
        {
          key: 'threshold_percentage',
          value: '80',
          description: 'Collection threshold percentage'
        },
        {
          key: 'collection_zones',
          value: JSON.stringify(['Ablekuma North', 'Ayawaso West', 'Central Accra', 'East Accra']),
          description: 'Available collection zones'
        }
      ]);
      
      // Add waste compositions for sites
      const sites = await db('waste_sites').select('id');
      for (const site of sites) {
        await db('waste_compositions').insert({
          site_id: site.id,
          plastic_percent: 25,
          paper_percent: 20,
          glass_percent: 15,
          metal_percent: 10,
          organic_percent: 25,
          textile_percent: 3,
          other_percent: 2,
          current_capacity: 50
        });
      }
    }
    
    console.log('✅ Database setup completed');
    res.json({ 
      success: true, 
      message: 'Complete database setup completed successfully',
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