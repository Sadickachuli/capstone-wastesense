import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import sharp from 'sharp';

// Validation schemas
const residentSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  phone: z.string().optional(),
  zone: z.string().optional(),
});

const staffLoginSchema = z.object({
  employee_id: z.string(),
  password: z.string(),
});

const residentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Multer setup for image uploads (in-memory) with increased limits
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for image files
    fieldSize: 50 * 1024 * 1024, // 50MB limit for field data
  }
});

// Define WasteDetectionResult type for backend use
// (should match frontend src/types/index.ts)
type WasteDetectionResult = {
  plastic: number;
  paper: number;
  glass: number;
  metal: number;
  organic: number;
};

export const signup = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const data = residentSignupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db('users').where('email', data.email).first();
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create new user
    const [user] = await db('users')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
        phone: data.phone,
        zone: data.zone,
        role: 'resident',
      })
      .returning(['id', 'email', 'name', 'role', 'phone', 'zone', 'created_at']);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        zone: user.zone,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log('LOGIN BODY:', req.body);
  try {
    // Check if it's staff or resident login
    const isStaffLogin = 'employee_id' in req.body;
    let user;

    if (isStaffLogin) {
      // Staff login (dispatcher/recycler)
      const data = staffLoginSchema.parse(req.body);
      user = await db('users')
        .where('employee_id', data.employee_id)
        .whereIn('role', ['dispatcher', 'recycler'])
        .first();
    } else {
      // Resident login
      const data = residentLoginSchema.parse(req.body);
      user = await db('users')
        .where('email', data.email)
        .where('role', 'resident')
        .first();
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employee_id: user.employee_id,
        phone: user.phone,
        zone: user.zone,
        facility: user.facility,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// Helper to send notification to all dispatchers
async function notifyDispatchers(message: string) {
  const dispatchers = await db('users').where('role', 'dispatcher');
  for (const dispatcher of dispatchers) {
    await db('notifications').insert({
      type: 'alert',
      title: 'Bin Full Threshold Reached',
      message,
      for_role: 'dispatcher',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

export const reportBinFull = async (req: Request, res: Response) => {
  try {
    const { userId, location, description } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Prevent duplicate report in the same cycle
    const existingReport = await db('reports')
      .where({ user_id: userId })
      .whereIn('status', ['new', 'in-progress'])
      .first();
    if (existingReport) {
      return res.status(409).json({ message: 'You have already reported your bin full for this cycle. Please wait until collection is confirmed.' });
    }
    const [report] = await db('reports')
      .insert({
        user_id: userId,
        location: location ? JSON.stringify(location) : null,
        description,
        status: 'new',
        timestamp: new Date().toISOString(),
      })
      .returning(['id', 'user_id', 'location', 'description', 'status', 'timestamp']);

    // Get user's zone to count reports in their zone
    const user = await db('users').where('id', userId).first();
    const userZone = user?.zone;

    // Count total residents in user's zone
    const totalResidents = await db('users').where({ role: 'resident', zone: userZone }).count('id as count');
    const residentCount = parseInt(String(totalResidents[0].count), 10) || 0;
    const total = 3;
    const threshold = 3;
    
    // Count unique residents who have reported in the same zone
    const reported = await db('reports')
      .join('users', 'reports.user_id', 'users.id')
      .where('users.zone', userZone)
      .whereIn('reports.status', ['new', 'in-progress'])
      .countDistinct('reports.user_id as count');
    const reportedCount = parseInt(String(reported[0].count), 10) || 0;
    
    // If threshold reached, notify dispatchers
    if (reportedCount >= threshold) {
      await notifyDispatchers(`Threshold reached: ${reportedCount}/${total} residents have reported their bins full in ${userZone}.`);
    }
    console.log('DEBUG: reportedCount =', reportedCount, 'threshold =', threshold, 'zone =', userZone);
    res.status(201).json({ report, total, threshold, reportedCount });
  } catch (err) {
    console.error('Report Bin Full error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get threshold status for dispatcher dashboard
export const getThresholdStatus = async (req: Request, res: Response) => {
  try {
    // Get configuration from request or use defaults
    const defaultConfig = {
      zoneCustomers: {
        'Ablekuma North': {
          totalCustomers: 145
        },
        'Ayawaso West': {
          totalCustomers: 82
        }
      }
    };

    // In a real implementation, this would come from a configuration table
    const config = defaultConfig;

    const thresholdStatus: any = {};

    for (const [zone, zoneConfig] of Object.entries(config.zoneCustomers)) {
      // Count current reports for this zone
      const reportCount = await db('reports')
        .where('zone', zone)
        .where('status', 'pending')
        .count('* as count')
        .first();

      const currentReports = Number(reportCount?.count || 0);
      const requiredReports = zoneConfig.totalCustomers;
      const thresholdReached = currentReports >= requiredReports;
      const reportsNeeded = Math.max(0, requiredReports - currentReports);

      thresholdStatus[zone] = {
        currentReports,
        requiredReports,
        totalCustomers: zoneConfig.totalCustomers,
        thresholdReached,
        reportsNeeded
      };
    }

    res.json({
      status: 'success',
      thresholdStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Get Threshold Status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDispatcherNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await db('notifications')
      .where('for_role', 'dispatcher')
      .andWhere('archived', false)
      .orderBy('created_at', 'desc')
      .limit(20);
    res.json({ notifications });
  } catch (err) {
    console.error('Get Dispatcher Notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update report status (for dispatcher)
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'in-progress', 'collected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [updated] = await db('reports')
      .where({ id })
      .update({ status, updated_at: new Date().toISOString() })
      .returning(['id', 'user_id', 'location', 'description', 'status', 'timestamp']);
    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ report: updated });
  } catch (err) {
    console.error('Update Report Status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all active reports (for dispatcher dashboard)
export const getActiveReports = async (req: Request, res: Response) => {
  try {
    const reports = await db('reports')
      .join('users', 'reports.user_id', 'users.id')
      .select(
        'reports.id',
        'reports.user_id',
        'users.name as resident_name',
        'users.zone',
        'reports.location',
        'reports.description',
        'reports.status',
        'reports.timestamp'
      )
      .whereIn('reports.status', ['new', 'in-progress'])
      .orderBy('reports.timestamp', 'desc');
    res.json({ reports });
  } catch (err) {
    console.error('Get Active Reports error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark all active reports as collected
export const markAllReportsCollected = async (req: Request, res: Response) => {
  try {
    const { dumpingSiteId, truckId } = req.body;
    
    if (!dumpingSiteId || !truckId) {
      return res.status(400).json({ message: 'Dumping site ID and truck ID are required' });
    }

    // Get zone information based on collected reports
    const reportsToUpdate = await db('reports')
      .join('users', 'reports.user_id', 'users.id')
      .select('users.zone')
      .whereIn('reports.status', ['new', 'in-progress'])
      .groupBy('users.zone');

    const reportsUpdated = await db('reports')
      .whereIn('status', ['new', 'in-progress'])
      .update({ status: 'collected', updated_at: new Date().toISOString() });
    
    console.log('DEBUG: Reports marked as collected:', reportsUpdated);
    
    // Archive all threshold notifications for dispatchers
    const notificationsUpdated = await db('notifications')
      .where('for_role', 'dispatcher')
      .andWhere('title', 'Bin Full Threshold Reached')
      .andWhere('archived', false)
      .update({ archived: true, updated_at: new Date().toISOString() });
    
    console.log('DEBUG: Notifications archived:', notificationsUpdated);

    // UPDATE VEHICLE STATUS: scheduled → in-transit (not available yet)
    const currentTime = new Date().toISOString();
    await db('vehicles')
      .where('id', truckId)
      .update({
        status: 'in-transit',
        updated_at: currentTime
      });
    console.log(`DEBUG: Vehicle ${truckId} status updated to in-transit`);

    // Complete schedules for this vehicle (they're now in-transit)
    const completedSchedules = await db('schedules')
      .where('vehicle_id', truckId)
      .whereIn('status', ['scheduled', 'in-progress'])
      .update({
        status: 'completed',
        updated_at: currentTime
      });
    console.log(`DEBUG: Completed ${completedSchedules} schedules for vehicle ${truckId}`);

    // AUTOMATIC FUEL CONSUMPTION LOGGING - PRACTICAL IMPLEMENTATION
    if (reportsUpdated > 0 && reportsToUpdate.length > 0) {
      const zone = reportsToUpdate[0].zone;
      
      // TODO: Get configuration from dispatcher settings (for now use defaults)
      // In a real implementation, this would come from the dispatcher's saved configuration
      const defaultConfig = {
        zoneDistances: {
          'Ablekuma North': {
            'WS001': 12.5, // North zone to North dumping site
            'WS002': 18.7, // North zone to South dumping site (cross-city)
          },
          'Ayawaso West': {
            'WS001': 22.3, // South zone to North dumping site (cross-city)
            'WS002': 8.9,  // South zone to South dumping site
          }
        },
        fuelPricePerLiter: 10.0 // Default Ghana fuel price
      };
      
      // Get distance from configuration (fallback to 15km if not configured)
      const zoneDistances = defaultConfig.zoneDistances[zone as keyof typeof defaultConfig.zoneDistances];
      const distance = zoneDistances ? (zoneDistances as any)[dumpingSiteId] || 15.0 : 15.0;
      
      // Add collection overhead (multiple stops, traffic, loading time)
      const actualDistance = distance * (1.2 + Math.random() * 0.3); // 20-50% overhead
      
      // Get vehicle for fuel calculation
      const vehicle = await db('vehicles').where('id', truckId).first();
      
      let fuelConsumed = 0;
      let fuelCost = 0;
      let tripStart = new Date(Date.now() - (2 * 60 * 60 * 1000)); // Default 2 hours ago
      
      if (vehicle) {
        // Calculate realistic fuel consumption with efficiency variation
        const baseEfficiency = vehicle.fuel_efficiency_kmpl;
        // Real-world efficiency is typically 10-30% lower than rated due to traffic, stops, loading
        const actualEfficiency = baseEfficiency * (0.7 + Math.random() * 0.2); // 70-90% of rated
        fuelConsumed = actualDistance / actualEfficiency;
        
        // Estimate trip start time (assume started 1-3 hours ago based on distance)
        const tripDurationHours = (actualDistance / 25) + 0.5 + (Math.random() * 1); // 25 km/h avg + loading time
        tripStart = new Date(Date.now() - (tripDurationHours * 60 * 60 * 1000));
        
        // Use configured fuel price (with small variation for market fluctuations)
        const fuelPricePerLiter = defaultConfig.fuelPricePerLiter * (0.95 + Math.random() * 0.1); // ±5% variation
        fuelCost = fuelConsumed * fuelPricePerLiter;
        
        // Log the fuel consumption automatically
        await db('fuel_logs').insert({
          vehicle_id: truckId,
          trip_type: 'collection',
          related_id: null, // Could link to a route ID if we had that
          distance_km: Number(actualDistance.toFixed(1)),
          fuel_consumed_liters: Number(fuelConsumed.toFixed(2)),
          actual_efficiency_kmpl: Number(actualEfficiency.toFixed(1)),
          fuel_cost: Number(fuelCost.toFixed(2)),
          route_description: `Collection route: ${zone} to ${dumpingSiteId === 'WS001' ? 'North Dumping Site' : 'South Dumping Site'}`,
          trip_start: tripStart.toISOString(),
          trip_end: currentTime,
          logged_by: (req as any).user?.id || 'system'
        });
        
        // Update vehicle fuel level and odometer (keep status as in-transit)
        const newFuelLevel = Math.max(0, vehicle.current_fuel_level - fuelConsumed);
        const newTotalDistance = Number(vehicle.total_distance_km) + Number(actualDistance.toFixed(1));
        
        await db('vehicles')
          .where('id', truckId)
          .update({
            current_fuel_level: Number(newFuelLevel.toFixed(2)),
            total_distance_km: newTotalDistance,
            updated_at: currentTime
          });
        
        console.log(`DEBUG: Auto-logged fuel consumption - ${fuelConsumed.toFixed(2)}L for ${actualDistance.toFixed(1)}km trip using configured distance: ${distance}km`);
      }

      // Create delivery record with IN-TRANSIT status
      const estimatedArrival = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Calculate estimated weight and composition (realistic values based on reports)
      const baseWeight = 450;
      const weightPerReport = 75; // kg per household report
      const estimatedWeight = baseWeight + (reportsUpdated * weightPerReport) + (Math.random() * 100);
      
      const mockComposition = {
        plastic: Math.floor(25 + Math.random() * 15), // 25-40%
        paper: Math.floor(20 + Math.random() * 15),   // 20-35%
        glass: Math.floor(10 + Math.random() * 15),   // 10-25%
        metal: Math.floor(10 + Math.random() * 10),   // 10-20%
        organic: Math.floor(5 + Math.random() * 10),  // 5-15%
      };
      
      // Ensure percentages add up to 100
      const total = Object.values(mockComposition).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        const diff = 100 - total;
        mockComposition.plastic += diff;
      }

      const [delivery] = await db('deliveries').insert({
        truck_id: truckId,
        facility_id: dumpingSiteId,
        zone: zone,
        estimated_arrival: estimatedArrival.toISOString(),
        status: 'in-transit', // Vehicle is in-transit to dumping site
        weight: estimatedWeight,
        composition: JSON.stringify(mockComposition),
        // Add fuel tracking data to delivery
        planned_distance_km: distance,
        actual_distance_km: actualDistance,
        fuel_consumed_liters: vehicle ? fuelConsumed : null,
        fuel_cost: vehicle ? fuelCost : null,
        actual_departure: vehicle ? tripStart.toISOString() : null,
        actual_arrival: null, // Will be set when composition is updated
        created_by: (req as any).user?.id || null,
      }).returning('*');

      console.log('DEBUG: Delivery created with in-transit status:', delivery);
    }

    res.json({ 
      updatedCount: reportsUpdated,
      message: `Successfully marked ${reportsUpdated} reports as collected. Vehicle is now in-transit to dumping site.`
    });
  } catch (err) {
    console.error('Mark All Reports Collected error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all deliveries
export const getDeliveries = async (req: Request, res: Response) => {
  try {
    const deliveries = await db('deliveries')
      .select('*')
      .orderBy('created_at', 'desc');

    // Parse composition JSON and map database fields to frontend field names
    const formattedDeliveries = deliveries.map(delivery => ({
      id: delivery.id,
      truckId: delivery.truck_id,
      facilityId: delivery.facility_id,
      zone: delivery.zone,
      estimatedArrival: delivery.estimated_arrival,
      status: delivery.status,
      weight: delivery.weight,
      composition: typeof delivery.composition === 'string' 
        ? JSON.parse(delivery.composition) 
        : delivery.composition,
      createdBy: delivery.created_by,
      createdAt: delivery.created_at,
      updatedAt: delivery.updated_at,
    }));

    res.json({ deliveries: formattedDeliveries });
  } catch (err) {
    console.error('Get Deliveries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'in-transit', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [updated] = await db('deliveries')
      .where({ id })
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .returning('*');

    if (!updated) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Parse composition JSON
    const formattedDelivery = {
      ...updated,
      composition: typeof updated.composition === 'string' 
        ? JSON.parse(updated.composition) 
        : updated.composition
    };

    res.json({ delivery: formattedDelivery });
  } catch (err) {
    console.error('Update Delivery Status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get archived notifications for dispatchers
export const getArchivedDispatcherNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await db('notifications')
      .where('for_role', 'dispatcher')
      .andWhere('archived', true)
      .orderBy('created_at', 'desc')
      .limit(20);
    res.json({ notifications });
  } catch (err) {
    console.error('Get Archived Dispatcher Notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get dispatch recommendation with smart threshold logic
export const getDispatchRecommendation = async (req: Request, res: Response) => {
  try {
    const { trucks } = req.query;
    const availableTrucks = parseInt(trucks as string) || 3;

    // Get system configuration for zone customers
    const configRows = await db('system_config').select('key', 'value');
    const config: { [key: string]: any } = {};
    configRows.forEach(row => {
      try {
        config[row.key] = JSON.parse(row.value);
      } catch {
        config[row.key] = row.value;
      }
    });

    const zoneCustomers = config.zone_customers || {
      'Ablekuma North': { totalCustomers: 145 },
      'Ayawaso West': { totalCustomers: 82 }
    };

    // Get current report counts by zone
    const reportCounts = await db('reports')
      .join('users', 'reports.user_id', 'users.id')
      .select('users.zone')
      .count('* as count')
      .whereIn('reports.status', ['new', 'in-progress'])
      .groupBy('users.zone');

    const counts: { [key: string]: number } = {};
    reportCounts.forEach((row: any) => {
      counts[row.zone] = parseInt(row.count);
    });

    const northReports = counts['Ablekuma North'] || 0;
    const southReports = counts['Ayawaso West'] || 0;
    const northCustomers = zoneCustomers['Ablekuma North']?.totalCustomers || 145;
    const southCustomers = zoneCustomers['Ayawaso West']?.totalCustomers || 82;

    // Smart threshold logic
    const getThreshold = (totalCustomers: number) => {
      if (totalCustomers > 40) {
        return Math.ceil(totalCustomers * 0.8); // 80% threshold for large zones
      } else {
        return totalCustomers; // 100% threshold for small zones
      }
    };

    const northThreshold = getThreshold(northCustomers);
    const southThreshold = getThreshold(southCustomers);

    const northReached = northReports >= northThreshold;
    const southReached = southReports >= southThreshold;

    let allocation: { [key: string]: number } = { North: 0, South: 0 };
    let schedules: any[] = [];
    let shouldAutoSchedule = false;

    if (northReached || southReached) {
      // Check if scheduling has already happened for these zones
      const existingSchedules = await db('schedules')
        .where('status', 'scheduled')
        .whereIn('zone', [
          ...(northReached ? ['Ablekuma North'] : []),
          ...(southReached ? ['Ayawaso West'] : [])
        ])
        .select('zone', 'vehicle_id', 'id', 'scheduled_start', 'estimated_completion', 'reports_count');

      const northScheduled = existingSchedules.filter(s => s.zone === 'Ablekuma North');
      const southScheduled = existingSchedules.filter(s => s.zone === 'Ayawaso West');

      if ((northReached && northScheduled.length > 0) || (southReached && southScheduled.length > 0)) {
        // Scheduling already happened, show existing schedules
        allocation.North = northScheduled.length;
        allocation.South = southScheduled.length;
        
        // Get vehicle info for existing schedules
        for (const schedule of existingSchedules) {
          const vehicle = await db('vehicles').where('id', schedule.vehicle_id).first();
          schedules.push({
            id: schedule.id,
            zone: schedule.zone,
            vehicleInfo: `${vehicle?.make || ''} ${vehicle?.model || ''} (${schedule.vehicle_id})`,
            scheduledStart: schedule.scheduled_start,
            estimatedCompletion: schedule.estimated_completion,
            reportsCount: schedule.reports_count
          });
        }
        
        shouldAutoSchedule = true; // Mark as auto-scheduled (already happened)
      } else {
        // Need to schedule now
        shouldAutoSchedule = true;
        
        // PRACTICAL CAPACITY-BASED ALLOCATION (not percentage-based)
        // Calculate actual truck needs based on waste volume and truck capacity
        
        // Estimate waste volume per report (average household bin)
        const wastePerReport = 0.24; // cubic meters per household bin (240L standard bin)
        
        // Get truck capacities and calculate optimal allocation
        const availableVehicles = await db('vehicles')
          .where('status', 'available')
          .whereNot('needs_refuel', true)
          .orderBy('fuel_efficiency_kmpl', 'desc'); // Prioritize fuel-efficient vehicles
        
        // Truck capacity mapping (cubic meters)
        const getTruckCapacity = (type: string) => {
          switch (type) {
            case 'van': return 3.5; // Small van - good for 1-15 households
            case 'rear_loader': return 12; // Medium truck - good for 15-50 households  
            case 'compressed_truck': return 25; // Large truck - good for 50+ households
            default: return 8; // Default medium capacity
          }
        };
        
        let vehicleIndex = 0;
        
        // Smart allocation for North zone
        if (northReached && availableVehicles.length > vehicleIndex) {
          const northWasteVolume = northReports * wastePerReport;
          
          // Find the smallest truck that can handle the load efficiently
          let trucksNeeded = 0;
          let remainingVolume = northWasteVolume;
          
          for (const vehicle of availableVehicles.slice(vehicleIndex)) {
            if (remainingVolume <= 0) break;
            
            const truckCapacity = getTruckCapacity(vehicle.type);
            if (remainingVolume <= truckCapacity) {
              // This truck can handle the remaining load
              trucksNeeded++;
              remainingVolume = 0;
            } else {
              // Need this truck plus more
              trucksNeeded++;
              remainingVolume -= truckCapacity;
            }
            
            // Safety limit: max 2 trucks for any zone (fuel efficiency)
            if (trucksNeeded >= 2) break;
          }
          
          allocation.North = Math.min(trucksNeeded, availableVehicles.length - vehicleIndex, 2);
          
          // Schedule trucks for North zone
          for (let i = 0; i < allocation.North; i++) {
            const vehicle = availableVehicles[vehicleIndex++];
            const scheduleId = `SCH-${Date.now()}-${i}`;
            const scheduledStart = new Date(Date.now() + 15 * 60 * 1000);
            const estimatedCompletion = new Date(scheduledStart.getTime() + 3 * 60 * 60 * 1000);

            await db('schedules').insert({
              id: scheduleId,
              vehicle_id: vehicle.id,
              zone: 'Ablekuma North',
              scheduled_start: scheduledStart.toISOString(),
              estimated_completion: estimatedCompletion.toISOString(),
              status: 'scheduled',
              reports_count: northReports,
              estimated_distance_km: config.zoneDistances?.['Ablekuma North']?.['WS001'] || 15,
              estimated_fuel_consumption: ((config.zoneDistances?.['Ablekuma North']?.['WS001'] || 15) / vehicle.fuel_efficiency_kmpl).toFixed(2),
              driver_name: vehicle.driver_name,
              driver_contact: vehicle.driver_contact
            });

            await db('vehicles')
              .where('id', vehicle.id)
              .update({ 
                status: 'scheduled',
                updated_at: new Date().toISOString()
              });

            schedules.push({
              id: scheduleId,
              zone: 'Ablekuma North',
              vehicleInfo: `${vehicle.make} ${vehicle.model} (${vehicle.id}) - ${vehicle.type}`,
              scheduledStart: scheduledStart.toISOString(),
              estimatedCompletion: estimatedCompletion.toISOString(),
              reportsCount: northReports
            });
          }
        }

        // Smart allocation for South zone
        if (southReached && availableVehicles.length > vehicleIndex) {
          const southWasteVolume = southReports * wastePerReport;
          
          // Find the smallest truck that can handle the load efficiently
          let trucksNeeded = 0;
          let remainingVolume = southWasteVolume;
          
          for (const vehicle of availableVehicles.slice(vehicleIndex)) {
            if (remainingVolume <= 0) break;
            
            const truckCapacity = getTruckCapacity(vehicle.type);
            if (remainingVolume <= truckCapacity) {
              // This truck can handle the remaining load
              trucksNeeded++;
              remainingVolume = 0;
            } else {
              // Need this truck plus more
              trucksNeeded++;
              remainingVolume -= truckCapacity;
            }
            
            // Safety limit: max 2 trucks for any zone (fuel efficiency)
            if (trucksNeeded >= 2) break;
          }
          
          allocation.South = Math.min(trucksNeeded, availableVehicles.length - vehicleIndex, 2);
          
          // Schedule trucks for South zone
          for (let i = 0; i < allocation.South; i++) {
            const vehicle = availableVehicles[vehicleIndex++];
            const scheduleId = `SCH-${Date.now()}-${vehicleIndex}`;
            const scheduledStart = new Date(Date.now() + 15 * 60 * 1000);
            const estimatedCompletion = new Date(scheduledStart.getTime() + 3 * 60 * 60 * 1000);

            await db('schedules').insert({
              id: scheduleId,
              vehicle_id: vehicle.id,
              zone: 'Ayawaso West',
              scheduled_start: scheduledStart.toISOString(),
              estimated_completion: estimatedCompletion.toISOString(),
              status: 'scheduled',
              reports_count: southReports,
              estimated_distance_km: config.zoneDistances?.['Ayawaso West']?.['WS002'] || 18,
              estimated_fuel_consumption: ((config.zoneDistances?.['Ayawaso West']?.['WS002'] || 18) / vehicle.fuel_efficiency_kmpl).toFixed(2),
              driver_name: vehicle.driver_name,
              driver_contact: vehicle.driver_contact
            });

            await db('vehicles')
              .where('id', vehicle.id)
              .update({ 
                status: 'scheduled',
                updated_at: new Date().toISOString()
              });

            schedules.push({
              id: scheduleId,
              zone: 'Ayawaso West',
              vehicleInfo: `${vehicle.make} ${vehicle.model} (${vehicle.id}) - ${vehicle.type}`,
              scheduledStart: scheduledStart.toISOString(),
              estimatedCompletion: estimatedCompletion.toISOString(),
              reportsCount: southReports
            });
          }
        }
      }
    }

    const recommendation = shouldAutoSchedule 
      ? `✅ AUTO-SCHEDULED: ${schedules.length} trucks dispatched to zones that reached threshold`
      : northReports > 0 || southReports > 0
      ? `Monitoring: Waiting for more reports to reach threshold`
      : `No collection needed at this time`;

    const reason = shouldAutoSchedule
      ? `Threshold reached - Ablekuma North: ${northReports}/${northThreshold}, Ayawaso West: ${southReports}/${southThreshold}`
      : `Current reports - Ablekuma North: ${northReports}/${northThreshold}, Ayawaso West: ${southReports}/${southThreshold}`;

    res.json({
      availableVehicles: availableTrucks,
      reportCounts: {
        North: northReports,
        South: southReports
      },
      thresholds: {
        North: northThreshold,
        South: southThreshold
      },
      allocation,
      recommendation,
      reason,
      schedules,
      autoScheduled: shouldAutoSchedule
    });

  } catch (err) {
    console.error('Get Dispatch Recommendation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get notifications for recycler
export const getRecyclerNotifications = async (req: Request, res: Response) => {
  try {
    let notifications = await db('notifications')
      .where('for_role', 'recycler')
      .andWhere('archived', false)
      .orderBy('created_at', 'desc')
      .limit(20);
    
    console.log('Recycler notifications found:', notifications.length);
    
    // If no notifications exist, create a sample one
    if (notifications.length === 0) {
      console.log('Creating sample notification for recycler...');
      const sampleNotification = {
        id: uuidv4(),
        type: 'info',
        title: 'New Waste Composition Update',
        message: 'Waste composition updated at North Dumping Site',
        for_role: 'recycler',
        is_read: false,
        archived: false,
        metadata: JSON.stringify({
          siteId: 'WS001',
          updateType: 'composition'
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await db('notifications').insert(sampleNotification);
      notifications = [sampleNotification];
      console.log('Sample notification created successfully');
    }
    
    res.json({ notifications });
  } catch (err) {
    console.error('Get Recycler Notifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update waste composition and notify recyclers
export const updateWasteComposition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let { plastic, paper, glass, metal, organic, textile, other, updated_by, currentCapacity, annotated_image } = req.body;
    // Normalize all 7 types
    const allTypes = ['plastic', 'paper', 'glass', 'metal', 'organic', 'textile', 'other'];
    let values = allTypes.map(type => Number(req.body[type]) || 0);
    let sum = values.reduce((a, b) => a + b, 0);
    if (sum !== 100 && sum > 0) {
      values = values.map(v => Math.round((v / sum) * 100));
      let newSum = values.reduce((a, b) => a + b, 0);
      if (newSum !== 100) {
        const diff = 100 - newSum;
        const maxIdx = values.indexOf(Math.max(...values));
        values[maxIdx] += diff;
      }
    }
    // Assign normalized values
    [plastic, paper, glass, metal, organic, textile, other] = values;
    if (Number(currentCapacity) <= 0 || isNaN(Number(currentCapacity))) {
      console.error('Missing or invalid currentCapacity for site', id);
      return res.status(400).json({ message: 'Current capacity (total weight) is required and must be a positive number.' });
    }
    // Generate a unique id for the new composition
    const newId = uuidv4();
    console.log('DEBUG: About to insert into waste_compositions', {
      id: newId,
      site_id: id,
      updated_by: updated_by || null,
      plastic_percent: plastic,
      paper_percent: paper,
      glass_percent: glass,
      metal_percent: metal,
      organic_percent: organic,
      textile_percent: textile ?? null,
      other_percent: other ?? null,
      current_capacity: Number(currentCapacity),
      annotated_image: annotated_image || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    let insertResult = null;
    try {
      insertResult = await db('waste_compositions')
        .insert({
          id: newId,
          site_id: id,
          updated_by: updated_by || null,
          plastic_percent: plastic,
          paper_percent: paper,
          glass_percent: glass,
          metal_percent: metal,
          organic_percent: organic,
          textile_percent: textile ?? null,
          other_percent: other ?? null,
          current_capacity: Number(currentCapacity),
          annotated_image: annotated_image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning(['id', 'site_id', 'plastic_percent', 'paper_percent', 'glass_percent', 'metal_percent', 'organic_percent', 'textile_percent', 'other_percent', 'current_capacity', 'created_at', 'annotated_image']);
      if (!insertResult || insertResult.length === 0) {
        console.warn('WARNING: waste_compositions insert returned empty result for site', id);
      } else {
        console.log('DEBUG: Inserted waste_compositions record', insertResult[0]);
      }
    } catch (insertErr) {
      console.error('ERROR: waste_compositions insert failed for site', id, insertErr);
      console.error('Attempted insert data:', {
        id: newId,
        site_id: id,
        updated_by: updated_by || null,
        plastic_percent: plastic,
        paper_percent: paper,
        glass_percent: glass,
        metal_percent: metal,
        organic_percent: organic,
        textile_percent: textile ?? null,
        other_percent: other ?? null,
        current_capacity: Number(currentCapacity),
        annotated_image: annotated_image || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Update waste_sites table for current values and capacity
    const updateFields: any = {
      last_updated: new Date().toISOString(),
      'composition_plastic': plastic,
      'composition_paper': paper,
      'composition_glass': glass,
      'composition_metal': metal,
      'composition_organic': organic,
      current_capacity: Number(currentCapacity),
    };
    await db('waste_sites')
      .where({ id })
      .update(updateFields);

    // FIRST: Update vehicle status from 'scheduled' to 'in-transit' when waste composition is confirmed
    // This happens when dispatcher confirms waste delivered to dumping site
    const scheduledVehicles = await db('vehicles')
      .where('status', 'scheduled')
      .select('id');
    
    if (scheduledVehicles.length > 0) {
      const vehiclesUpdated = await db('vehicles')
        .where('status', 'scheduled')
        .update({
          status: 'in-transit',
          updated_at: new Date().toISOString()
        });
      
      console.log(`DEBUG: Updated ${vehiclesUpdated} vehicles from 'scheduled' to 'in-transit' after waste composition update`);
      
      // Create or update deliveries for these vehicles
      for (const vehicle of scheduledVehicles) {
        // Check if delivery already exists for this vehicle
        const existingDelivery = await db('deliveries')
          .where('truck_id', vehicle.id)
          .where('facility_id', id)
          .whereIn('status', ['pending', 'scheduled'])
          .first();
        
        if (!existingDelivery) {
          // Create new delivery record
          await db('deliveries').insert({
            truck_id: vehicle.id,
            facility_id: id,
            zone: 'Unknown', // Will be updated based on vehicle's last route
            estimated_arrival: new Date().toISOString(),
            status: 'in-transit',
            weight: Number(currentCapacity),
            composition: JSON.stringify({ plastic, paper, glass, metal, organic }),
            created_by: updated_by || null,
          });
          console.log(`DEBUG: Created delivery record for vehicle ${vehicle.id} to site ${id}`);
        } else {
          // Update existing delivery to in-transit
          await db('deliveries')
            .where('id', existingDelivery.id)
            .update({
              status: 'in-transit',
              weight: Number(currentCapacity),
              composition: JSON.stringify({ plastic, paper, glass, metal, organic }),
              updated_at: new Date().toISOString()
            });
          console.log(`DEBUG: Updated existing delivery for vehicle ${vehicle.id} to in-transit status`);
        }
      }

      // ALSO: Complete schedules for these vehicles when waste composition is confirmed
      // This ensures resident dashboard shows correct status
      const vehicleIds = scheduledVehicles.map(v => v.id);
      if (vehicleIds.length > 0) {
        const completedSchedules = await db('schedules')
          .whereIn('vehicle_id', vehicleIds)
          .whereIn('status', ['scheduled', 'in-progress'])
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          });
        
        console.log(`DEBUG: Completed ${completedSchedules} schedules for vehicles ${vehicleIds.join(', ')} after waste composition update`);
      }
    }

    // ADDITIONAL: Complete schedules for any in-transit vehicles when waste composition is updated
    // This handles cases where vehicles were already moved to in-transit status
    const inTransitVehicles = await db('vehicles')
      .where('status', 'in-transit')
      .select('id');
    
    if (inTransitVehicles.length > 0) {
      const inTransitVehicleIds = inTransitVehicles.map(v => v.id);
      const completedSchedules = await db('schedules')
        .whereIn('vehicle_id', inTransitVehicleIds)
        .whereIn('status', ['scheduled', 'in-progress'])
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        });
      
      console.log(`DEBUG: Completed ${completedSchedules} schedules for in-transit vehicles ${inTransitVehicleIds.join(', ')} after waste composition update`);
    }

    // If annotated image is provided, update any in-transit deliveries to arrived for this site
    if (annotated_image) {
      const deliveriesUpdated = await db('deliveries')
        .where('facility_id', id)
        .where('status', 'in-transit')
        .update({ 
          status: 'arrived',
          actual_arrival: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      console.log(`DEBUG: Updated ${deliveriesUpdated} deliveries from 'in-transit' to 'arrived' for site ${id}`);
      
      // UPDATE VEHICLE STATUS: in-transit → available (final step in workflow)
      if (deliveriesUpdated > 0) {
        // Get truck IDs from the updated deliveries
        const arrivedDeliveries = await db('deliveries')
          .where('facility_id', id)
          .where('status', 'arrived')
          .where('updated_at', '>', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Updated in last 5 minutes
          .select('truck_id');
        
        const truckIds = arrivedDeliveries.map(d => d.truck_id);
        
        if (truckIds.length > 0) {
          const vehiclesUpdated = await db('vehicles')
            .whereIn('id', truckIds)
            .where('status', 'in-transit')
            .update({
              status: 'available',
              updated_at: new Date().toISOString()
            });
          
          console.log(`DEBUG: Updated ${vehiclesUpdated} vehicles from 'in-transit' to 'available' after composition update`);
        }
      }
    }

    // Get site info for notification
    const site = await db('waste_sites').where({ id }).first();

    // Create notification for recyclers
    await db('notifications').insert({
      type: 'info',
      title: 'New Waste Composition Update',
      message: `Waste composition updated at ${site.name}`,
      for_role: 'recycler',
      metadata: {
        siteId: id,
        siteName: site.name,
        updateType: 'composition',
        composition: { plastic, paper, glass, metal, organic },
        currentCapacity: Number(currentCapacity),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    });

    console.log('Waste composition updated for site', id, { plastic, paper, glass, metal, organic, currentCapacity });
    res.status(200).json({ message: 'Waste composition updated and recyclers notified', composition: insertResult });
  } catch (err) {
    console.error('Update Waste Composition error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all waste sites
export const getWasteSites = async (req: Request, res: Response) => {
  try {
    const sites = await db('waste_sites').select(
      'id',
      'name',
      'location',
      'current_capacity',
      'max_capacity',
      'last_updated',
      'composition_plastic',
      'composition_paper',
      'composition_glass',
      'composition_metal',
      'composition_organic'
    );
    // Map DB fields to frontend WasteSite type
    const mapped = sites.map(site => ({
      id: site.id,
      name: site.name,
      location: site.location,
      currentCapacity: Number(site.current_capacity),
      maxCapacity: Number(site.max_capacity),
      lastUpdated: site.last_updated,
      composition: {
        plastic: Number(site.composition_plastic),
        paper: Number(site.composition_paper),
        glass: Number(site.composition_glass),
        metal: Number(site.composition_metal),
        organic: Number(site.composition_organic),
      },
    }));
    res.json({ sites: mapped });
  } catch (err) {
    console.error('Get Waste Sites error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Waste detection controller
// Note: req type is 'any' to allow req.file (for multer). For production, extend Request type for file.
export const detectWasteFromImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    // Prepare form data for ML API
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    // Send to ML API (correct endpoint)
    const mlRes = await axios.post('https://waste-sense-api.onrender.com/predict/', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
    });

    // Parse detections, total_weight, and annotated_image
    const { detections, total_weight, annotated_image } = mlRes.data;

    // Map class names to main types
    const classToType: Record<string, keyof WasteDetectionResult> = {
      // Plastic
      'Other plastic bottle': 'plastic',
      'Clear plastic bottle': 'plastic',
      'Plastic bottle cap': 'plastic',
      'Plastic lid': 'plastic',
      'Other plastic': 'plastic',
      'Plastic film': 'plastic',
      'Garbage bag': 'plastic',
      'Other plastic wrapper': 'plastic',
      'Single-use carrier bag': 'plastic',
      'Polypropylene bag': 'plastic',
      'Crisp packet': 'plastic',
      'Spread tub': 'plastic',
      'Tupperware': 'plastic',
      'Disposable food container': 'plastic',
      'Foam food container': 'plastic',
      'Other plastic container': 'plastic',
      'Plastic glooves': 'plastic',
      'Plastic utensils': 'plastic',
      'Squeezable tube': 'plastic',
      'Plastic straw': 'plastic',
      'Six pack rings': 'plastic',
      'Other plastic cup': 'plastic',
      'Disposable plastic cup': 'plastic',
      // Paper
      'Magazine paper': 'paper',
      'Tissues': 'paper',
      'Wrapping paper': 'paper',
      'Normal paper': 'paper',
      'Paper bag': 'paper',
      'Plastified paper bag': 'paper',
      'Toilet tube': 'paper',
      'Other carton': 'paper',
      'Egg carton': 'paper',
      'Drink carton': 'paper',
      'Corrugated carton': 'paper',
      'Meal carton': 'paper',
      'Pizza box': 'paper',
      'Paper cup': 'paper',
      'Paper straw': 'paper',
      // Glass
      'Glass bottle': 'glass',
      'Broken glass': 'glass',
      'Glass cup': 'glass',
      'Glass jar': 'glass',
      // Metal
      'Aluminium foil': 'metal',
      'Battery': 'metal',
      'Aluminium blister pack': 'metal',
      'Carded blister pack': 'metal',
      'Metal bottle cap': 'metal',
      'Food Can': 'metal',
      'Aerosol': 'metal',
      'Drink can': 'metal',
      'Metal lid': 'metal',
      'Pop tab': 'metal',
      'Scrap metal': 'metal',
      // Organic
      'Food waste': 'organic',
      'Shoe': 'organic', // assuming
      'Rope & strings': 'organic', // assuming
      // Styrofoam, foam, unlabeled, cigarette, etc. can be mapped as needed
    };

    // Aggregate weights by type
    const typeWeights: Record<keyof WasteDetectionResult, number> = {
      plastic: 0,
      paper: 0,
      glass: 0,
      metal: 0,
      organic: 0,
    };
    for (const det of detections) {
      const type = classToType[det.class];
      if (type) {
        typeWeights[type] += 1;
      }
    }
    const total = Object.values(typeWeights).reduce((a, b) => a + b, 0);
    let composition: WasteDetectionResult = { plastic: 0, paper: 0, glass: 0, metal: 0, organic: 0 };
    if (total > 0) {
      for (const type of Object.keys(typeWeights) as (keyof WasteDetectionResult)[]) {
        composition[type] = Math.round((typeWeights[type] / total) * 100);
      }
    }
    res.json({ result: composition, total_weight, annotated_image, raw: mlRes.data });
  } catch (err: any) {
    console.error('Waste detection error:', err);
    res.status(500).json({ message: 'Failed to detect waste', error: err.message });
  }
};

// GET /api/waste-compositions/history - Get waste detection composition history for insights
export const getWasteCompositionHistory = async (req: Request, res: Response) => {
  try {
    const { site_id } = req.query;
    let query = db('waste_compositions')
      .select(
        'site_id',
        db.raw('DATE(created_at) as date'), // Use local date without timezone conversion
        'plastic_percent',
        'paper_percent',
        'glass_percent',
        'metal_percent',
        'organic_percent',
        'textile_percent',
        'other_percent',
        'current_capacity',
        'annotated_image',
        'created_at' // Also include full timestamp for debugging
      );
    if (site_id) {
      query = query.where('site_id', site_id);
    }
    const rows = await query.orderBy('created_at', 'desc'); // Order by full timestamp
    
    // Process dates to ensure consistent YYYY-MM-DD format
    const processedRows = rows.map(row => {
      // Extract date from the created_at timestamp preserving the local date
      // Use substring to get YYYY-MM-DD directly from the timestamp string
      let dateStr = row.date;
      if (row.created_at) {
        // If we have the full timestamp, extract date more reliably
        const timestampStr = row.created_at.toString();
        const dateMatch = timestampStr.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          dateStr = dateMatch[1];
        }
      }
      
      return {
        ...row,
        date: dateStr
      };
    });
    
    console.log('Waste composition history query result:', processedRows.slice(0, 2)); // Log first 2 records
    res.json({ history: processedRows });
  } catch (err) {
    console.error('Get Waste Composition History error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// LLM-based waste detection controller
export const detectWasteFromImageLLM = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not set in environment' });
    }

    // Prepare image as base64
    const imageBase64 = req.file.buffer.toString('base64');
    const prompt = `You are a waste management expert. Given the attached image of a waste pile, estimate the percentage composition by material type (plastic, metal, organic, paper, glass, textile, other). Return your answer as a JSON object with keys as material types and values as percentages (e.g., { "plastic": 70, "paper": 12, ... }).`;

    // Call OpenAI API (GPT-4 Vision)
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for waste composition analysis.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${req.file.mimetype};base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse the response
    const content = openaiRes.data.choices[0].message.content;
    console.log('LLM raw response:', content);
    let composition = null;
    try {
      let match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        // Try to fix common issues
        let fixed = content
          .replace(/'/g, '"') // single to double quotes
          .replace(/,(\s*[}\]])/g, '$1'); // remove trailing commas
        match = fixed.match(/\{[\s\S]*\}/);
      }
      if (match) {
        composition = JSON.parse(match[0]);
      } else {
        throw new Error('No JSON object found in LLM response');
      }
    } catch (err) {
      return res.status(500).json({ message: 'Failed to parse LLM response', raw: content });
    }

    // Compress the image before returning as base64 to reduce payload size
    // Create a smaller version for display (max 800px width while maintaining aspect ratio)
    let compressedImageBuffer;
    try {
      compressedImageBuffer = await sharp(req.file.buffer)
        .resize(800, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch (sharpError) {
      // Fallback: use original image if sharp fails
      console.warn('Sharp compression failed, using original image:', sharpError);
      compressedImageBuffer = req.file.buffer;
    }
    
    const annotatedImageBase64 = compressedImageBuffer.toString('base64');

    res.json({ 
      composition, 
      raw: content,
      annotated_image: annotatedImageBase64
    });
  } catch (err: any) {
    console.error('LLM waste detection error:', err.response?.data || err.message);
    res.status(500).json({ message: 'LLM waste detection failed', error: err.response?.data || err.message });
  }
};

// Export multer upload for use in routes
export { upload };

// Get reports for a specific user (for resident dashboard)
export const getUserReports = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const reports = await db('reports')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    res.json({ reports });
  } catch (err) {
    console.error('Get User Reports error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get collection schedules for residents
export const getCollectionSchedules = async (req: Request, res: Response) => {
  try {
    const { zone } = req.query;
    
    let query = db('schedules')
      .leftJoin('vehicles', 'schedules.vehicle_id', 'vehicles.id')
      .select(
        'schedules.*',
        'vehicles.make',
        'vehicles.model', 
        'vehicles.registration_number',
        'vehicles.type as vehicle_type'
      )
      .where(function() {
        this.whereIn('schedules.status', ['scheduled', 'in-progress'])
          .orWhere(function() {
            this.where('schedules.status', 'completed')
              .andWhere('schedules.updated_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
          });
      })
      .orderBy('schedules.scheduled_start', 'desc'); // Show most recent first

    // Filter by zone if specified (for residents)
    if (zone) {
      query = query.where('schedules.zone', zone);
    }

    const schedules = await query;

    // Format the response
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      zone: schedule.zone,
      scheduledStart: schedule.scheduled_start,
      estimatedCompletion: schedule.estimated_completion,
      status: schedule.status,
      reportsCount: schedule.reports_count,
      estimatedDistance: schedule.estimated_distance_km,
      estimatedFuelConsumption: schedule.estimated_fuel_consumption,
      driverName: schedule.driver_name,
      driverContact: schedule.driver_contact,
      vehicle: {
        id: schedule.vehicle_id,
        make: schedule.make,
        model: schedule.model,
        registrationNumber: schedule.registration_number,
        type: schedule.vehicle_type
      }
    }));

    res.json({ schedules: formattedSchedules });
  } catch (err) {
    console.error('Get Collection Schedules error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get system configuration
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    const configs = await db('system_config').select('key', 'value');
    
    const configObject: { [key: string]: any } = {};
    configs.forEach(config => {
      try {
        configObject[config.key] = JSON.parse(config.value);
      } catch (err) {
        configObject[config.key] = config.value;
      }
    });

    res.json({ config: configObject });
  } catch (err) {
    console.error('Get System Config error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update system configuration
export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const { config } = req.body;
    
    // Update each configuration key
    for (const [key, value] of Object.entries(config)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await db('system_config')
        .insert({
          key,
          value: stringValue,
          updated_at: new Date().toISOString()
        })
        .onConflict('key')
        .merge({
          value: stringValue,
          updated_at: new Date().toISOString()
        });
    }

    res.json({ message: 'Configuration updated successfully' });
  } catch (err) {
    console.error('Update System Config error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Complete schedules when reports are collected
export const completeSchedulesByReports = async (req: Request, res: Response) => {
  try {
    // Find zones that have recently collected reports
    const zonesWithCollectedReports = await db('reports')
      .select('zone')
      .where('status', 'collected')
      .where('updated_at', '>', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Updated in last 10 minutes
      .groupBy('zone');

    const zonesToComplete = zonesWithCollectedReports.map((row: any) => row.zone);

    if (zonesToComplete.length > 0) {
      // Update schedules for these zones to completed
      const updatedCount = await db('schedules')
        .whereIn('zone', zonesToComplete)
        .whereIn('status', ['scheduled', 'in-progress'])
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        });

      // Also update vehicle status back to available for completed schedules
      const completedSchedules = await db('schedules')
        .whereIn('zone', zonesToComplete)
        .where('status', 'completed')
        .select('vehicle_id');

      if (completedSchedules.length > 0) {
        const vehicleIds = completedSchedules.map(s => s.vehicle_id);
        await db('vehicles')
          .whereIn('id', vehicleIds)
          .update({
            status: 'available',
            updated_at: new Date().toISOString()
          });
      }

      console.log(`Completed ${updatedCount} schedules for zones: ${zonesToComplete.join(', ')}`);
      res.json({ 
        message: 'Schedules updated successfully', 
        completedSchedules: updatedCount,
        zones: zonesToComplete 
      });
    } else {
      res.json({ message: 'No schedules to complete', completedSchedules: 0 });
    }
  } catch (err) {
    console.error('Complete Schedules error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 