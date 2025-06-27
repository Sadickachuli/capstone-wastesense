import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Vehicle {
  id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  fuel_efficiency_kmpl: number;
  tank_capacity_liters: number;
  current_fuel_level: number;
  total_distance_km: number;
  status: string;
  fuel_percentage: number;
  estimated_range_km: number;
  needs_refuel: boolean;
}

interface FuelAnalytics {
  total_distance: number;
  total_fuel_consumed: number;
  total_cost: number;
  avg_cost_per_km: number;
  total_trips: number;
}

interface FuelLog {
  id: string;
  vehicle_id: string;
  trip_type: string;
  distance_km: number;
  fuel_consumed_liters: number;
  actual_efficiency_kmpl: number;
  fuel_cost?: number;
  route_description?: string;
  trip_start: string;
  trip_end: string;
  make: string;
  model: string;
  created_at: string;
}

export default function FuelTracking() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelAnalytics, setFuelAnalytics] = useState<FuelAnalytics | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [tripData, setTripData] = useState({
    distance_km: '',
    trip_start: '',
    trip_end: '',
    fuel_cost: '',
    route_description: ''
  });

  useEffect(() => {
    fetchVehicles();
    fetchAnalytics();
    fetchLogs();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('/api/fuel/vehicles');
      setVehicles(res.data.vehicles);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/fuel/analytics?period=7');
      if (res.data.summary) {
        setFuelAnalytics(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/fuel/logs?limit=10');
      setFuelLogs(res.data.logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !tripData.distance_km || !tripData.trip_start || !tripData.trip_end) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await axios.post('/api/fuel/logs', {
        vehicle_id: selectedVehicle,
        trip_type: 'collection',
        distance_km: Number(tripData.distance_km),
        trip_start: tripData.trip_start,
        trip_end: tripData.trip_end,
        fuel_cost: tripData.fuel_cost ? Number(tripData.fuel_cost) : null,
        route_description: tripData.route_description
      });

      // Reset form and refresh data
      setTripData({
        distance_km: '',
        trip_start: '',
        trip_end: '',
        fuel_cost: '',
        route_description: ''
      });
      setSelectedVehicle('');
      setShowLogModal(false);
      
      fetchVehicles();
      fetchAnalytics();
      fetchLogs();
      
      alert('Fuel consumption logged successfully');
    } catch (err) {
      alert('Failed to log fuel consumption');
    }
  };

  if (loading) {
    return <div className="p-4">Loading fuel tracking data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Fuel Analytics Summary */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Fuel Analytics (Last 7 Days)</h2>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Log Fuel Usage
          </button>
        </div>
        
        {fuelAnalytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{fuelAnalytics.total_distance.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Total Distance (km)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{fuelAnalytics.total_fuel_consumed.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Fuel Used (L)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">₵{fuelAnalytics.total_cost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₵{fuelAnalytics.avg_cost_per_km.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Cost per km</div>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Status */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className={`p-4 rounded-lg border-2 ${vehicle.needs_refuel ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-gray-900">{vehicle.id}</div>
                  <div className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                  vehicle.status === 'on-route' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {vehicle.status}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fuel Level:</span>
                  <span className={vehicle.needs_refuel ? 'text-red-600 font-bold' : 'text-gray-900'}>
                    {vehicle.fuel_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      vehicle.fuel_percentage < 25 ? 'bg-red-500' :
                      vehicle.fuel_percentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${vehicle.fuel_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Range: {vehicle.estimated_range_km}km</span>
                  <span>Efficiency: {vehicle.fuel_efficiency_kmpl} km/L</span>
                </div>
                {vehicle.needs_refuel && (
                  <div className="text-xs text-red-600 font-medium">⚠️ Needs Refuel</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Fuel Logs */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Fuel Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fuel Used</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fuelLogs.map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {log.vehicle_id} ({log.make} {log.model})
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{log.distance_km} km</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{log.fuel_consumed_liters.toFixed(1)} L</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{log.actual_efficiency_kmpl.toFixed(1)} km/L</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {log.fuel_cost ? `₵${log.fuel_cost.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Fuel Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Log Fuel Consumption</h3>
            
            <form onSubmit={handleLogFuel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={selectedVehicle}
                  onChange={e => setSelectedVehicle(e.target.value)}
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.id} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={tripData.distance_km}
                  onChange={e => setTripData(prev => ({ ...prev, distance_km: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trip Start</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={tripData.trip_start}
                    onChange={e => setTripData(prev => ({ ...prev, trip_start: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trip End</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={tripData.trip_end}
                    onChange={e => setTripData(prev => ({ ...prev, trip_end: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fuel Cost (₵) - Optional</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={tripData.fuel_cost}
                  onChange={e => setTripData(prev => ({ ...prev, fuel_cost: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Route Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={tripData.route_description}
                  onChange={e => setTripData(prev => ({ ...prev, route_description: e.target.value }))}
                  placeholder="e.g., Collection route from Ablekuma North to North Dumping Site"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Log Fuel Usage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 