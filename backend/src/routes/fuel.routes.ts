import { Router } from 'express';
import { 
  getVehicles, 
  addVehicle,
  updateVehicle,
  deleteVehicle,
  logFuelConsumption, 
  refuelVehicle, 
  getFuelAnalytics, 
  getFuelLogs,
  calculatePlannedFuelConsumption
} from '../controllers/fuel.controller';

const router = Router();

// Vehicle management
router.get('/vehicles', getVehicles);
router.post('/vehicles', addVehicle);
router.put('/vehicles/:vehicleId', updateVehicle);
router.delete('/vehicles/:vehicleId', deleteVehicle);
router.post('/vehicles/refuel', refuelVehicle);

// Fuel logging
router.post('/logs', logFuelConsumption);
router.get('/logs', getFuelLogs);

// Analytics
router.get('/analytics', getFuelAnalytics);

// Planning
router.post('/calculate-consumption', calculatePlannedFuelConsumption);

export default router; 