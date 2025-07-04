import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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

// Real data fetching instead of mock
export default function Analytics() {
  const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
        </div>
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <select 
            className="form-select dark:bg-white dark:text-black"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7" className="dark:text-black">Last 7 Days</option>
            <option value="30" className="dark:text-black">Last 30 Days</option>
            <option value="90" className="dark:text-black">Last 90 Days</option>
          </select>
          <button className="btn btn-secondary">Export Report</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Real Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Active Bin Reports
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {analyticsSummary.totalCollections}
            </dd>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Active Routes
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {analyticsSummary.activeRoutes}
            </dd>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Total Distance ({period} days)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {fuelAnalytics?.total_distance.toFixed(1) || '0'} km
            </dd>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Fuel Consumed ({period} days)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {fuelAnalytics?.total_fuel_consumed.toFixed(1) || '0'} L
            </dd>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Average Fuel Efficiency
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {averageFuelEfficiency.toFixed(1)} km/L
            </dd>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              Fuel Cost ({period} days)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              ₵{fuelAnalytics?.total_cost.toFixed(2) || '0.00'}
            </dd>
          </div>
        </div>
      </div>

      {/* Fuel Efficiency Insights */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Fuel Efficiency Insights
          </h3>
          <div className="mt-4">
            <ul className="divide-y divide-gray-200">
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Average cost per kilometer:
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    ₵{fuelAnalytics?.avg_cost_per_km.toFixed(2) || '0.00'}
                  </div>
                </div>
              </li>
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Total trips completed: 
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {fuelAnalytics?.total_trips || 0}
                  </div>
                </div>
              </li>
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Vehicles needing refuel:
                  </div>
                  <div className={`text-sm font-medium ${vehiclesNeedingRefuel > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {vehiclesNeedingRefuel} of {vehicles.length}
                  </div>
                </div>
              </li>
              {fuelAnalytics && fuelAnalytics.total_distance > 0 && (
                <li className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Actual vs rated efficiency:
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {((fuelAnalytics.total_distance / fuelAnalytics.total_fuel_consumed) / averageFuelEfficiency * 100).toFixed(1)}%
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Vehicle Status Overview */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Vehicle Fleet Status
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className={`p-4 rounded-lg border ${
                vehicle.needs_refuel ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' : 
                vehicle.status === 'available' ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' :
                'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-gray-900 dark:text-gray-100">{vehicle.id}</div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    vehicle.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' :
                    vehicle.status === 'on-route' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {vehicle.status}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {vehicle.make} {vehicle.model}
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                  <span>Fuel: {vehicle.fuel_percentage}%</span>
                  <span>Range: {vehicle.estimated_range_km}km</span>
                </div>
                {vehicle.needs_refuel && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Needs Refuel
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 