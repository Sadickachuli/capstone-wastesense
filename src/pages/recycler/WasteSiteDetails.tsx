import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWasteSites } from '../../hooks/useWasteSites';
import { WasteSite } from '../../types';

export default function WasteSiteDetails() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { sites } = useWasteSites();
  const [site, setSite] = useState<WasteSite | null>(null);

  useEffect(() => {
    if (siteId && sites.length > 0) {
      const foundSite = sites.find(s => s.id === siteId);
      setSite(foundSite || null);
    }
  }, [siteId, sites]);

  const getCapacityColor = (percentage: number) => {
    if (percentage > 90) return 'from-red-500 to-red-600';
    if (percentage > 70) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-green-600';
  };

  const getCapacityIcon = (percentage: number) => {
    if (percentage > 90) return '🚨';
    if (percentage > 70) return '⚠️';
    return '✅';
  };

  const getWasteIcon = (type: string) => {
    switch (type) {
      case 'plastic': return '🧴';
      case 'paper': return '📄';
      case 'glass': return '🪟';
      case 'metal': return '🔩';
      case 'organic': return '🌱';
      default: return '🗑️';
    }
  };

  const getWasteColor = (type: string) => {
    switch (type) {
      case 'plastic': return 'from-blue-400 to-blue-600';
      case 'paper': return 'from-yellow-400 to-yellow-600';
      case 'glass': return 'from-green-400 to-green-600';
      case 'metal': return 'from-gray-400 to-gray-600';
      case 'organic': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (!site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">🚫</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Site Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The requested waste site could not be found or may have been removed.
            </p>
            <button
              onClick={() => navigate('/recycler/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <span>🏠</span>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const capacityPercentage = Math.round((site.currentCapacity / site.maxCapacity) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <span>←</span>
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏢</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {site.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="text-sm">📍</span>
                  {site.location}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {site.lastUpdated 
                  ? new Date(site.lastUpdated).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Site Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Capacity Status */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${getCapacityColor(capacityPercentage)} rounded-xl flex items-center justify-center`}>
                  <span className="text-white text-xl">{getCapacityIcon(capacityPercentage)}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Capacity Status</h2>
                  <p className="text-gray-600 dark:text-gray-400">Current site utilization</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Capacity Progress */}
                <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Current Usage</span>
                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {capacityPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-4">
                    <div
                      className={`h-4 rounded-full bg-gradient-to-r ${getCapacityColor(capacityPercentage)} transition-all duration-500`}
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>0 tons</span>
                    <span>{site.maxCapacity} tons</span>
                  </div>
                </div>

                {/* Capacity Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Current Load</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active waste volume</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {site.currentCapacity} tons
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🏗️</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Maximum Capacity</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Site limit</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {site.maxCapacity} tons
                    </p>
                  </div>
                </div>

                {/* Remaining Capacity */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📦</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Remaining Capacity</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {site.maxCapacity - site.currentCapacity} tons
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Site Info */}
          <div className="space-y-6">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">ℹ️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Site Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Site ID</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{site.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{site.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    capacityPercentage > 90 ? 'bg-red-100 text-red-800' :
                    capacityPercentage > 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {capacityPercentage > 90 ? '🚨 Critical' :
                     capacityPercentage > 70 ? '⚠️ High' :
                     '✅ Normal'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Quick Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Utilization</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{capacityPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free Space</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{100 - capacityPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Waste Types</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{Object.keys(site.composition).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Composition */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🧪</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Waste Composition</h2>
              <p className="text-gray-600 dark:text-gray-400">Material breakdown by type</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(site.composition).map(([type, percentage]) => (
              <div key={type} className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getWasteColor(type)} rounded-xl flex items-center justify-center`}>
                    <span className="text-white text-lg">{getWasteIcon(type)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{type}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Material type</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Percentage</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${getWasteColor(type)} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ≈ {((percentage / 100) * site.currentCapacity).toFixed(1)} tons
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Data Placeholder */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📈</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Historical Data</h2>
              <p className="text-gray-600 dark:text-gray-400">Trends and analytics over time</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Historical Analytics Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We're working on detailed historical data visualization including capacity trends, composition changes, and predictive analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 