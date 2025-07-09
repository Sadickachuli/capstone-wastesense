import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { environment } from '../../config/environment';
import axios from 'axios';

interface AnalyticsSummary {
  totalCollections: number;
  completedRoutes: number;
  activeRoutes: number;
  totalDistance: number;
  efficiency: number;
  complaints: number;
}

interface FuelAnalytics {
  total_distance: number;
  total_fuel_consumed: number;
  total_cost: number;
  avg_cost_per_km: number;
  total_trips: number;
}

interface Vehicle {
  id: string;
  type: string;
  make: string;
  model: string;
  fuel_efficiency_kmpl: number;
  fuel_percentage: number;
  estimated_range_km: number;
  needs_refuel: boolean;
  status: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [fuelAnalytics, setFuelAnalytics] = useState<FuelAnalytics | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7');

  // Real analytics summary calculated from actual data
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary>({
    totalCollections: 0,
    completedRoutes: 0,
    activeRoutes: 0,
    totalDistance: 0,
    efficiency: 0,
    complaints: 0,
  });

  useEffect(() => {
    fetchAnalytics();
    fetchVehicles();
    fetchRealAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const API_BASE_URL = environment.getApiUrl();
      const res = await axios.get(`${API_BASE_URL}/fuel/analytics?period=${period}`);
      if (res.data.summary) {
        setFuelAnalytics(res.data.summary);
      }
    } catch (err) {
      setError('Failed to fetch fuel analytics');
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const API_BASE_URL = environment.getApiUrl();
      const res = await axios.get(`${API_BASE_URL}/fuel/vehicles`);
      setVehicles(res.data.vehicles);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  const fetchRealAnalytics = async () => {
    try {
      // Fetch active reports for current collections
      const API_BASE_URL = environment.getApiUrl();
      const reportsRes = await axios.get(`${API_BASE_URL}/auth/reports/active`);
      const activeReports = reportsRes.data.reports || [];
      
      // Calculate real metrics from data
      const analytics: AnalyticsSummary = {
        totalCollections: activeReports.length,
        completedRoutes: 0, // Will be updated when route completion tracking is implemented
        activeRoutes: Math.ceil(activeReports.length / 3), // Approximate routes based on reports
        totalDistance: fuelAnalytics?.total_distance || 0,
        efficiency: fuelAnalytics ? 
          Math.round((fuelAnalytics.total_distance / Math.max(fuelAnalytics.total_fuel_consumed, 1)) * 10) / 10 : 0,
        complaints: 0, // Can be calculated from reports with negative sentiment
      };
      
      setAnalyticsSummary(analytics);
    } catch (err) {
      console.error('Failed to fetch real analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const averageFuelEfficiency = vehicles.length > 0 ? 
    vehicles.reduce((sum, v) => sum + v.fuel_efficiency_kmpl, 0) / vehicles.length : 0;

  const vehiclesNeedingRefuel = vehicles.filter(v => v.needs_refuel).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'on-route':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      case 'maintenance':
        return 'bg-gradient-to-r from-red-500 to-pink-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
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

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7':
        return 'Last 7 Days';
      case '30':
        return 'Last 30 Days';
      case '90':
        return 'Last 90 Days';
      default:
        return `Last ${period} Days`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading analytics...</p>
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
            Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Comprehensive insights into waste collection operations
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              📊 Time Period:
            </label>
          <select 
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
          </select>
          </div>
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            📥 Export Report
          </button>
      </div>

        {/* Error Display */}
      {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
        </div>
      )}

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Active Bin Reports */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Bin Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current collections</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {analyticsSummary.totalCollections}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {getPeriodLabel(period)}
            </div>
          </div>

          {/* Active Routes */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🚛</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Routes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Currently running</p>
          </div>
        </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {analyticsSummary.activeRoutes}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Routes in progress
            </div>
          </div>

          {/* Total Distance */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📏</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Distance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getPeriodLabel(period)}</p>
          </div>
        </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {fuelAnalytics?.total_distance.toFixed(1) || '0'} km
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Fleet coverage
            </div>
          </div>

          {/* Fuel Consumed */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⛽</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fuel Consumed</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getPeriodLabel(period)}</p>
          </div>
        </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {fuelAnalytics?.total_fuel_consumed.toFixed(1) || '0'} L
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total consumption
            </div>
          </div>

          {/* Average Fuel Efficiency */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-pink-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Avg Fuel Efficiency</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fleet average</p>
          </div>
        </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {averageFuelEfficiency.toFixed(1)} km/L
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Efficiency rating
            </div>
          </div>

          {/* Vehicles Needing Refuel */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-6 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Need Refuel</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vehicles requiring fuel</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {vehiclesNeedingRefuel}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Out of {vehicles.length} vehicles
        </div>
          </div>

        </div>

        {/* Fuel Cost Analysis */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Fuel Cost Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl p-6 border border-green-200/30 dark:border-green-700/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">💵</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Total Cost</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{getPeriodLabel(period)}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₵{fuelAnalytics?.total_cost.toFixed(2) || '0.00'}
        </div>
      </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-700/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cost per km</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average efficiency</p>
                </div>
                  </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₵{fuelAnalytics?.avg_cost_per_km.toFixed(2) || '0.00'}
                  </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl p-6 border border-purple-200/30 dark:border-purple-700/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🚗</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Total Trips</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Collection rounds</p>
                </div>
                  </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {fuelAnalytics?.total_trips || 0}
                  </div>
                </div>
                  </div>
                </div>

        {/* Vehicle Status Overview */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🚛 Vehicle Status Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200/30 dark:border-gray-600/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">{getStatusIcon(vehicle.status)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{vehicle.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{vehicle.make} {vehicle.model}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fuel Level</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{vehicle.fuel_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        vehicle.fuel_percentage > 60 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : vehicle.fuel_percentage > 30 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${vehicle.fuel_percentage}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Range</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{vehicle.estimated_range_km}km</p>
                </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Efficiency</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{vehicle.fuel_efficiency_kmpl}km/L</p>
                </div>
                  </div>
                  
                {vehicle.needs_refuel && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400">⚠️</span>
                        <span className="text-xs font-medium text-red-700 dark:text-red-300">
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

      </div>
    </div>
  );
} 