import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { environment } from '../../config/environment';
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
  const { theme } = useTheme();
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
      const API_BASE_URL = environment.getApiUrl();
      const res = await axios.get(`${API_BASE_URL}/fuel/vehicles`);
      setVehicles(res.data.vehicles);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const API_BASE_URL = environment.getApiUrl();
      const res = await axios.get(`${API_BASE_URL}/fuel/analytics?period=7`);
      if (res.data.summary) {
        setFuelAnalytics(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const API_BASE_URL = environment.getApiUrl();
      const res = await axios.get(`${API_BASE_URL}/fuel/logs?limit=10`);
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
      const API_BASE_URL = environment.getApiUrl();
      await axios.post(`${API_BASE_URL}/fuel/logs`, {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'on-route':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'maintenance':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return '✅';
      case 'on-route':
        return '🚛';
      case 'maintenance':
        return '🔧';
      default:
        return '❓';
    }
  };

  const getFuelLevelColor = (percentage: number) => {
    if (percentage > 60) return 'from-green-500 to-emerald-500';
    if (percentage > 30) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading fuel tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Fuel Tracking
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Monitor fuel consumption and vehicle efficiency
          </p>
        </div>

      {/* Fuel Analytics Summary */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ⛽ Fuel Analytics (Last 7 Days)
            </h2>
          <button
            onClick={() => setShowLogModal(true)}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
              📝 Log Fuel Usage
          </button>
        </div>
        
        {fuelAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📏</span>
            </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {fuelAnalytics.total_distance.toFixed(1)}
            </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Distance (km)</div>
            </div>
          </div>
      </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl p-6 border border-green-200/30 dark:border-green-700/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">⛽</span>
                  </div>
                <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {fuelAnalytics.total_fuel_consumed.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Fuel Used (L)</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl p-6 border border-purple-200/30 dark:border-purple-700/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">💰</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ₵{fuelAnalytics.total_cost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Cost</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/50 dark:to-yellow-900/50 rounded-2xl p-6 border border-orange-200/30 dark:border-orange-700/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      ₵{fuelAnalytics.avg_cost_per_km.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Cost per km</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Status */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🚛 Vehicle Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className={`bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-800/80 rounded-2xl p-6 border-2 backdrop-blur-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                vehicle.needs_refuel 
                  ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20' 
                  : 'border-gray-200/30 dark:border-gray-600/30'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">{getStatusIcon(vehicle.status)}</span>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900 dark:text-white">{vehicle.id}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{vehicle.make} {vehicle.model}</div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Fuel Level */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Level</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{vehicle.fuel_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${getFuelLevelColor(vehicle.fuel_percentage)} transition-all duration-300`}
                    style={{ width: `${vehicle.fuel_percentage}%` }}
                  />
                </div>
                  </div>
                  
                  {/* Vehicle Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Range</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{vehicle.estimated_range_km}km</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Efficiency</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{vehicle.fuel_efficiency_kmpl}km/L</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Total Distance</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{vehicle.total_distance_km}km</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Tank Capacity</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{vehicle.tank_capacity_liters}L</div>
                    </div>
                </div>
                  
                {vehicle.needs_refuel && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400">⚠️</span>
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">
                          Needs Refuel
                        </span>
                      </div>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Fuel Logs */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📋 Recent Fuel Logs
          </h2>
          
          {fuelLogs.length > 0 ? (
            <div className="space-y-4">
              {fuelLogs.map((log) => (
                <div key={log.id} className="bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/30 dark:border-gray-600/30 backdrop-blur-lg shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">⛽</span>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {log.vehicle_id} - {log.make} {log.model}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {log.route_description || 'Collection Route'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Distance</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{log.distance_km}km</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Fuel Consumed</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{log.fuel_consumed_liters}L</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{log.actual_efficiency_kmpl}km/L</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Cost</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {log.fuel_cost ? `₵${log.fuel_cost.toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">No fuel logs available</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Start logging fuel usage to see efficiency trends
              </p>
            </div>
          )}
        </div>

        {/* Fuel Logging Modal */}
        {showLogModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📝 Log Fuel Usage
                </h3>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                >
                  ✕
                </button>
      </div>

              <form onSubmit={handleLogFuel} className="space-y-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🚛 Select Vehicle
                  </label>
                <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                  required
                >
                    <option value="">Choose a vehicle...</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.id} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📏 Distance (km)
                  </label>
                <input
                  type="number"
                  step="0.1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  value={tripData.distance_km}
                    onChange={(e) => setTripData({...tripData, distance_km: e.target.value})}
                    placeholder="Enter distance"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🕐 Trip Start
                    </label>
                  <input
                    type="datetime-local"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    value={tripData.trip_start}
                      onChange={(e) => setTripData({...tripData, trip_start: e.target.value})}
                    required
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🕐 Trip End
                    </label>
                  <input
                    type="datetime-local"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    value={tripData.trip_end}
                      onChange={(e) => setTripData({...tripData, trip_end: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    💰 Fuel Cost (₵) - Optional
                  </label>
                <input
                  type="number"
                  step="0.01"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  value={tripData.fuel_cost}
                    onChange={(e) => setTripData({...tripData, fuel_cost: e.target.value})}
                    placeholder="Enter fuel cost"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📝 Route Description - Optional
                  </label>
                <textarea
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  value={tripData.route_description}
                    onChange={(e) => setTripData({...tripData, route_description: e.target.value})}
                    placeholder="Describe the route..."
                    rows={3}
                />
              </div>

                <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    📊 Log Fuel Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 