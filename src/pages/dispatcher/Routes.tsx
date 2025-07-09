import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWasteSites } from '../../hooks/useWasteSites';
import { api } from '../../api/mockApi';
import { Route, WasteSite } from '../../types';

interface CompositionUpdate {
  plastic: number;
  paper: number;
  glass: number;
  metal: number;
  organic: number;
}

// Mock data for demonstration
const mockRoutes: Route[] = [
  {
    id: 'R001',
    truckId: 'T001',
    bins: ['1', '2'],
    status: 'active',
    estimatedTime: 45,
    distance: 5.2,
  },
  {
    id: 'R002',
    truckId: 'T002',
    bins: ['3', '4'],
    status: 'pending',
    estimatedTime: 30,
    distance: 3.8,
  },
  {
    id: 'R003',
    truckId: 'T003',
    bins: ['5', '6'],
    status: 'completed',
    estimatedTime: 60,
    distance: 7.5,
  },
];

export default function Routes() {
  const { user } = useAuth();
  const { updateSiteComposition } = useWasteSites();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [composition, setComposition] = useState<CompositionUpdate>({
    plastic: 0,
    paper: 0,
    glass: 0,
    metal: 0,
    organic: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return Object.values(composition).reduce((sum, value) => sum + value, 0);
  }, [composition]);

  const handleCompositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;

    if (totalPercentage !== 100) {
      alert('Total percentage must equal 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSiteComposition(selectedSite, composition);
      setShowCompositionModal(false);
      alert('Waste composition updated successfully');
    } catch (error) {
      console.error('Failed to update composition:', error);
      alert('Failed to update waste composition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompositionChange = (type: keyof CompositionUpdate, value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

    setComposition(prev => ({
      ...prev,
      [type]: numValue
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'pending':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'completed':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🚛';
      case 'pending':
        return '⏳';
      case 'completed':
        return '✅';
      default:
        return '❓';
    }
  };

  // Filter routes by status
  const activeRoutes = mockRoutes.filter(route => route.status === 'active');
  const pendingRoutes = mockRoutes.filter(route => route.status === 'pending');
  const completedRoutes = mockRoutes.filter(route => route.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Collection Routes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage waste collection routes and schedules
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            ➕ Create New Route
          </button>
          <button 
            onClick={() => setShowCompositionModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            🗂️ Update Composition
          </button>
        </div>

        {/* Route Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🚛</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Routes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeRoutes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⏳</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Routes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRoutes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedRoutes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Routes List */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📋 All Routes
          </h2>
          
          <div className="space-y-4">
            {mockRoutes.map((route) => (
              <div key={route.id} className="bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-800/80 rounded-2xl p-6 border border-gray-200/30 dark:border-gray-600/30 backdrop-blur-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">{getStatusIcon(route.status)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Route {route.id}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Truck {route.truckId} • {route.bins.length} bins
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Distance</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{route.distance}km</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Est. Time</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{route.estimatedTime}min</div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(route.status)}`}>
                      {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    📍 View Details
                  </button>
                  <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    ✏️ Edit Route
                  </button>
                  {route.status === 'active' && (
                    <button className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      ⏹️ Stop Route
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
      </div>

      {/* Waste Composition Modal */}
      {showCompositionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🗂️ Update Waste Composition
                </h3>
                <button
                  onClick={() => setShowCompositionModal(false)}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCompositionSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📍 Select Dumping Site
                  </label>
                <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  required
                >
                    <option value="">Choose a site...</option>
                    <option value="WS001">🏭 North Dumping Site</option>
                    <option value="WS002">🏭 South Dumping Site</option>
                </select>
              </div>

              {/* Total Percentage Indicator */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📊 Total Percentage:</span>
                    <span className={`text-sm font-bold ${
                    totalPercentage === 100 
                        ? 'text-green-600 dark:text-green-400' 
                      : totalPercentage > 100 
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {totalPercentage}%
                  </span>
                </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                      totalPercentage === 100 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : totalPercentage > 100 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    }`}
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                  />
                </div>
                {totalPercentage !== 100 && (
                    <p className={`mt-2 text-xs ${
                      totalPercentage > 100 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {totalPercentage > 100 
                        ? '⚠️ Total percentage exceeds 100%' 
                        : '⚠️ Total percentage must equal 100%'}
                  </p>
                )}
              </div>

                {/* Composition Inputs */}
                <div className="space-y-4">
              {Object.entries(composition).map(([type, value]) => (
                    <div key={type} className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">
                          {type === 'plastic' && '🥤'} {type === 'paper' && '📄'} {type === 'glass' && '🍾'} {type === 'metal' && '🔧'} {type === 'organic' && '🍎'} {type} (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleCompositionChange(type as keyof CompositionUpdate, e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          placeholder="0"
                  />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCompositionModal(false)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totalPercentage !== 100}
                    className={`px-6 py-3 rounded-xl font-medium transform transition-all duration-300 ${
                      totalPercentage === 100 && !isSubmitting
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? '⏳ Updating...' : '✅ Update Composition'}
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