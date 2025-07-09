import React, { useState, useEffect, useRef } from 'react';
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
  const { isDarkMode } = useTheme();
  const [fuelAnalytics, setFuelAnalytics] = useState<FuelAnalytics | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7');

  // Animation states
  const [animationInView, setAnimationInView] = useState(false);
  const analyticsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimationInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (analyticsRef.current) {
      observer.observe(analyticsRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
        return 'bg-gradient-to-r from-emerald-500 to-green-500';
      case 'on-route':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      case 'maintenance':
        return 'bg-gradient-to-r from-red-500 to-rose-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Analytics
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Processing operational insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={analyticsRef}
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-gray-900 dark:to-indigo-950 transition-all duration-700 ease-out ${
        animationInView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10 shadow-sm transition-all duration-500 ease-out ${
        animationInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-4 transition-all duration-600 ease-out delay-100 ${
              animationInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
            }`}>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Operational Performance Insights</p>
              </div>
            </div>
            
            {/* Period Selector */}
            <div className={`flex items-center gap-3 transition-all duration-600 ease-out delay-200 ${
              animationInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'
            }`}>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Period:
              </label>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Error Display */}
      {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
        </div>
      )}

        {/* Key Metrics Overview */}
        <div className={`transition-all duration-600 ease-out delay-300 ${
          animationInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Collections */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Collections</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsSummary.totalCollections}</p>
                </div>
              </div>
            </div>

            {/* Active Routes */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Routes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsSummary.activeRoutes}</p>
                </div>
              </div>
            </div>

            {/* Total Distance */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Distance ({getPeriodLabel(period)})</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{fuelAnalytics?.total_distance?.toFixed(0) || '0'} km</p>
                </div>
              </div>
            </div>

            {/* Efficiency */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageFuelEfficiency.toFixed(1)} km/L</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fuel Analytics Section */}
        {fuelAnalytics && (
          <div className={`transition-all duration-600 ease-out delay-400 ${
            animationInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Fuel Analytics - {getPeriodLabel(period)}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Overview */}
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Cost Analysis
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Cost</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">₵{fuelAnalytics.total_cost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost per KM</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">₵{fuelAnalytics.avg_cost_per_km.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Trips</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{fuelAnalytics.total_trips}</span>
                  </div>
                </div>
              </div>

              {/* Consumption Overview */}
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Consumption Metrics
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Consumed</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{fuelAnalytics.total_fuel_consumed.toFixed(1)}L</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Distance Covered</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{fuelAnalytics.total_distance.toFixed(0)} km</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Efficiency</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {fuelAnalytics.total_fuel_consumed > 0 ? 
                        (fuelAnalytics.total_distance / fuelAnalytics.total_fuel_consumed).toFixed(1) : '0'} km/L
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fleet Status */}
        <div className={`transition-all duration-600 ease-out delay-500 ${
          animationInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Fleet Status</h2>
          
          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle, index) => (
                <div 
                  key={vehicle.id}
                  className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 delay-${(index % 3) * 100}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{vehicle.make} {vehicle.model}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{vehicle.status.replace('-', ' ')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Fuel Level</span>
                      <span className="font-medium text-gray-900 dark:text-white">{vehicle.fuel_percentage}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          vehicle.fuel_percentage > 50 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                          vehicle.fuel_percentage > 25 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-rose-500'
                        }`}
                        style={{ width: `${vehicle.fuel_percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Range</span>
                      <span className="font-medium text-gray-900 dark:text-white">{vehicle.estimated_range_km} km</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Efficiency</span>
                      <span className="font-medium text-gray-900 dark:text-white">{vehicle.fuel_efficiency_kmpl} km/L</span>
                    </div>
                    
                    {vehicle.needs_refuel && (
                      <div className="mt-3 p-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Needs Refuel
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Fleet Data</h3>
              <p className="text-gray-600 dark:text-gray-400">Vehicle information will appear here once fleet data is available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 