import { Request, Response } from 'express';
import { db } from '../db';

// Get all vehicles with current fuel status
export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await db('vehicles')
      .select('*')
      .orderBy('id');
    
    // Calculate fuel percentage and range for each vehicle
    const vehiclesWithStatus = vehicles.map(vehicle => ({
      ...vehicle,
      fuel_percentage: Math.round((vehicle.current_fuel_level / vehicle.tank_capacity_liters) * 100),
      estimated_range_km: Math.round(vehicle.current_fuel_level * vehicle.fuel_efficiency_kmpl),
      needs_refuel: (vehicle.current_fuel_level / vehicle.tank_capacity_liters) < 0.25 // Alert when < 25%
    }));

    res.json({ vehicles: vehiclesWithStatus });
  } catch (err) {
    console.error('Get Vehicles error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Log fuel consumption for a trip
export const logFuelConsumption = async (req: Request, res: Response) => {
  try {
    const {
      vehicle_id,
      trip_type,
      related_id,
      distance_km,
      trip_start,
      trip_end,
      route_description,
      fuel_cost
    } = req.body;

    if (!vehicle_id || !trip_type || !distance_km || !trip_start || !trip_end) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get vehicle details for fuel efficiency calculation
    const vehicle = await db('vehicles').where('id', vehicle_id).first();
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Calculate fuel consumption based on distance and vehicle efficiency
    const fuel_consumed_liters = Number((distance_km / vehicle.fuel_efficiency_kmpl).toFixed(2));
    const actual_efficiency_kmpl = Number((distance_km / fuel_consumed_liters).toFixed(2));

    // Create fuel log entry
    const [fuelLog] = await db('fuel_logs')
      .insert({
        vehicle_id,
        trip_type,
        related_id,
        distance_km: Number(distance_km),
        fuel_consumed_liters,
        actual_efficiency_kmpl,
        fuel_cost: fuel_cost || null,
        route_description,
        trip_start,
        trip_end,
        logged_by: (req as any).user?.id || null
      })
      .returning('*');

    // Update vehicle fuel level and total distance
    await db('vehicles')
      .where('id', vehicle_id)
      .update({
        current_fuel_level: Math.max(0, vehicle.current_fuel_level - fuel_consumed_liters),
        total_distance_km: Number(vehicle.total_distance_km) + Number(distance_km),
        updated_at: new Date().toISOString()
      });

    // If this is related to a delivery, update delivery with fuel data
    if (trip_type === 'delivery' && related_id) {
      await db('deliveries')
        .where('id', related_id)
        .update({
          actual_distance_km: distance_km,
          fuel_consumed_liters,
          fuel_cost: fuel_cost || null,
          actual_departure: trip_start,
          actual_arrival: trip_end,
          updated_at: new Date().toISOString()
        });
    }

    res.status(201).json({ fuelLog });
  } catch (err) {
    console.error('Log Fuel Consumption error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Refuel a vehicle
export const refuelVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicle_id, liters_added, cost_per_liter, total_cost } = req.body;

    if (!vehicle_id || !liters_added) {
      return res.status(400).json({ message: 'Vehicle ID and liters added are required' });
    }

    const vehicle = await db('vehicles').where('id', vehicle_id).first();
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const new_fuel_level = Math.min(
      vehicle.tank_capacity_liters,
      Number(vehicle.current_fuel_level) + Number(liters_added)
    );

    // Update vehicle fuel level
    await db('vehicles')
      .where('id', vehicle_id)
      .update({
        current_fuel_level: new_fuel_level,
        updated_at: new Date().toISOString()
      });

    // Log refuel event
    await db('fuel_logs')
      .insert({
        vehicle_id,
        trip_type: 'refuel',
        distance_km: 0,
        fuel_consumed_liters: -Number(liters_added), // Negative for refuel
        actual_efficiency_kmpl: 0,
        fuel_cost: total_cost || (Number(liters_added) * Number(cost_per_liter || 0)),
        route_description: `Refuel: ${liters_added}L added`,
        trip_start: new Date().toISOString(),
        trip_end: new Date().toISOString(),
        logged_by: (req as any).user?.id || null
      });

    res.json({ 
      message: 'Vehicle refueled successfully',
      new_fuel_level,
      fuel_percentage: Math.round((new_fuel_level / vehicle.tank_capacity_liters) * 100)
    });
  } catch (err) {
    console.error('Refuel Vehicle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get fuel consumption analytics
export const getFuelAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = '7', vehicle_id } = req.query;
    const daysBack = parseInt(period as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    let query = db('fuel_logs')
      .select(
        'vehicle_id',
        db.raw('SUM(distance_km) as total_distance'),
        db.raw('SUM(CASE WHEN fuel_consumed_liters > 0 THEN fuel_consumed_liters ELSE 0 END) as total_fuel_consumed'),
        db.raw('AVG(CASE WHEN fuel_consumed_liters > 0 THEN actual_efficiency_kmpl ELSE NULL END) as avg_efficiency'),
        db.raw('SUM(CASE WHEN fuel_cost IS NOT NULL THEN fuel_cost ELSE 0 END) as total_fuel_cost'),
        db.raw('COUNT(CASE WHEN trip_type = \'collection\' THEN 1 END) as collection_trips'),
        db.raw('COUNT(CASE WHEN trip_type = \'delivery\' THEN 1 END) as delivery_trips')
      )
      .where('created_at', '>=', startDate.toISOString())
      .groupBy('vehicle_id');

    if (vehicle_id) {
      query = query.where('vehicle_id', vehicle_id as string);
    }

    const analytics = await query;

    // Get vehicle details
    const vehicles = await db('vehicles').select('*');
    
    // Combine analytics with vehicle details
    const result = analytics.map(analytic => {
      const vehicle = vehicles.find(v => v.id === analytic.vehicle_id);
      return {
        ...analytic,
        vehicle_details: vehicle,
        efficiency_vs_rated: vehicle ? 
          ((Number(analytic.avg_efficiency) / Number(vehicle.fuel_efficiency_kmpl)) * 100).toFixed(1) : null
      };
    });

    // Calculate overall statistics
    const totalStats = {
      total_distance: analytics.reduce((sum, a) => sum + Number(a.total_distance), 0),
      total_fuel_consumed: analytics.reduce((sum, a) => sum + Number(a.total_fuel_consumed), 0),
      total_cost: analytics.reduce((sum, a) => sum + Number(a.total_fuel_cost), 0),
      total_trips: analytics.reduce((sum, a) => sum + Number(a.collection_trips) + Number(a.delivery_trips), 0),
      avg_cost_per_km: 0
    };

    if (totalStats.total_distance > 0) {
      totalStats.avg_cost_per_km = Number((totalStats.total_cost / totalStats.total_distance).toFixed(2));
    }

    res.json({ 
      period_days: daysBack,
      vehicles: result,
      summary: totalStats
    });
  } catch (err) {
    console.error('Get Fuel Analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get recent fuel logs
export const getFuelLogs = async (req: Request, res: Response) => {
  try {
    const { limit = 50, vehicle_id } = req.query;

    let query = db('fuel_logs')
      .select(
        'fuel_logs.*',
        'vehicles.make',
        'vehicles.model'
      )
      .join('vehicles', 'fuel_logs.vehicle_id', 'vehicles.id')
      .orderBy('fuel_logs.created_at', 'desc')
      .limit(parseInt(limit as string, 10));

    if (vehicle_id) {
      query = query.where('fuel_logs.vehicle_id', vehicle_id as string);
    }

    const logs = await query;

    res.json({ logs });
  } catch (err) {
    console.error('Get Fuel Logs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Calculate planned fuel consumption for a route
export const calculatePlannedFuelConsumption = async (req: Request, res: Response) => {
  try {
    const { vehicle_id, planned_distance_km } = req.body;

    if (!vehicle_id || !planned_distance_km) {
      return res.status(400).json({ message: 'Vehicle ID and planned distance are required' });
    }

    const vehicle = await db('vehicles').where('id', vehicle_id).first();
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const planned_fuel_consumption = Number((planned_distance_km / vehicle.fuel_efficiency_kmpl).toFixed(2));
    const sufficient_fuel = vehicle.current_fuel_level >= planned_fuel_consumption;
    const fuel_needed = sufficient_fuel ? 0 : planned_fuel_consumption - vehicle.current_fuel_level;

    res.json({
      vehicle_id,
      planned_distance_km: Number(planned_distance_km),
      planned_fuel_consumption,
      current_fuel_level: vehicle.current_fuel_level,
      sufficient_fuel,
      fuel_needed: Number(fuel_needed.toFixed(2)),
      estimated_range_current: Math.round(vehicle.current_fuel_level * vehicle.fuel_efficiency_kmpl)
    });
  } catch (err) {
    console.error('Calculate Planned Fuel Consumption error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add a new vehicle
export const addVehicle = async (req: Request, res: Response) => {
  try {
    const {
      id,
      type,
      make,
      model,
      year,
      fuel_efficiency_kmpl,
      tank_capacity_liters,
      current_fuel_level,
      registration_number,
      driver_name,
      driver_contact
    } = req.body;

    if (!id || !type || !make || !model || !year || !fuel_efficiency_kmpl || !tank_capacity_liters) {
      return res.status(400).json({ message: 'Required fields: id, type, make, model, year, fuel_efficiency_kmpl, tank_capacity_liters' });
    }

    // Check if vehicle ID already exists
    const existingVehicle = await db('vehicles').where('id', id).first();
    if (existingVehicle) {
      return res.status(409).json({ message: 'Vehicle ID already exists' });
    }

    // Calculate fuel percentage and estimated range
    const fuel_percentage = Math.round((current_fuel_level / tank_capacity_liters) * 100);
    const estimated_range_km = Math.round(current_fuel_level * fuel_efficiency_kmpl);
    const needs_refuel = fuel_percentage < 25; // Flag if fuel is below 25%

    const vehicleData = {
      id,
      type,
      make,
      model,
      year: parseInt(year),
      fuel_efficiency_kmpl: parseFloat(fuel_efficiency_kmpl),
      tank_capacity_liters: parseFloat(tank_capacity_liters),
      current_fuel_level: parseFloat(current_fuel_level || 0),
      total_distance_km: 0,
      status: 'available',
      registration_number: registration_number || null,
      driver_name: driver_name || null,
      driver_contact: driver_contact || null,
      fuel_percentage,
      estimated_range_km,
      needs_refuel
    };

    const [vehicle] = await db('vehicles').insert(vehicleData).returning('*');

    res.status(201).json({ 
      message: 'Vehicle added successfully',
      vehicle 
    });
  } catch (err) {
    console.error('Add Vehicle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an existing vehicle
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const {
      type,
      make,
      model,
      year,
      fuel_efficiency_kmpl,
      tank_capacity_liters,
      current_fuel_level,
      registration_number,
      driver_name,
      driver_contact
    } = req.body;

    const existingVehicle = await db('vehicles').where('id', vehicleId).first();
    if (!existingVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Calculate fuel percentage and estimated range
    const tankCapacity = tank_capacity_liters || existingVehicle.tank_capacity_liters;
    const fuelLevel = current_fuel_level !== undefined ? current_fuel_level : existingVehicle.current_fuel_level;
    const fuelEfficiency = fuel_efficiency_kmpl || existingVehicle.fuel_efficiency_kmpl;
    
    const fuel_percentage = Math.round((fuelLevel / tankCapacity) * 100);
    const estimated_range_km = Math.round(fuelLevel * fuelEfficiency);
    const needs_refuel = fuel_percentage < 25;

    const updateData = {
      type: type || existingVehicle.type,
      make: make || existingVehicle.make,
      model: model || existingVehicle.model,
      year: year ? parseInt(year) : existingVehicle.year,
      fuel_efficiency_kmpl: fuel_efficiency_kmpl ? parseFloat(fuel_efficiency_kmpl) : existingVehicle.fuel_efficiency_kmpl,
      tank_capacity_liters: tank_capacity_liters ? parseFloat(tank_capacity_liters) : existingVehicle.tank_capacity_liters,
      current_fuel_level: current_fuel_level !== undefined ? parseFloat(current_fuel_level) : existingVehicle.current_fuel_level,
      registration_number: registration_number !== undefined ? registration_number : existingVehicle.registration_number,
      driver_name: driver_name !== undefined ? driver_name : existingVehicle.driver_name,
      driver_contact: driver_contact !== undefined ? driver_contact : existingVehicle.driver_contact,
      fuel_percentage,
      estimated_range_km,
      needs_refuel,
      updated_at: new Date().toISOString()
    };

    await db('vehicles').where('id', vehicleId).update(updateData);

    const updatedVehicle = await db('vehicles').where('id', vehicleId).first();

    res.json({ 
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle 
    });
  } catch (err) {
    console.error('Update Vehicle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a vehicle
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const existingVehicle = await db('vehicles').where('id', vehicleId).first();
    if (!existingVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if vehicle has any fuel logs (optional - you might want to prevent deletion if there are logs)
    const fuelLogs = await db('fuel_logs').where('vehicle_id', vehicleId).first();
    if (fuelLogs) {
      return res.status(400).json({ 
        message: 'Cannot delete vehicle with existing fuel logs. Archive the vehicle instead.' 
      });
    }

    // Delete the vehicle
    await db('vehicles').where('id', vehicleId).del();

    res.json({ 
      message: 'Vehicle deleted successfully'
    });
  } catch (err) {
    console.error('Delete Vehicle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 