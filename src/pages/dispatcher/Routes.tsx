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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Collection Routes</h1>
        <button className="btn btn-primary">Create New Route</button>
      </div>

      {/* Waste Composition Modal */}
      {showCompositionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Waste Composition</h3>
            
            <form onSubmit={handleCompositionSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Select Dumping Site</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  required
                >
                  <option value="">Select a site</option>
                  <option value="WS001">North Dumping Site</option>
                  <option value="WS002">South Dumping Site</option>
                </select>
              </div>

              {/* Total Percentage Indicator */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Percentage:</span>
                  <span className={`text-sm font-medium ${
                    totalPercentage === 100 
                      ? 'text-green-600' 
                      : totalPercentage > 100 
                        ? 'text-red-600'
                        : 'text-yellow-600'
                  }`}>
                    {totalPercentage}%
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      totalPercentage === 100 
                        ? 'bg-green-600' 
                        : totalPercentage > 100 
                          ? 'bg-red-600'
                          : 'bg-yellow-600'
                    }`}
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                  />
                </div>
                {totalPercentage !== 100 && (
                  <p className={`mt-1 text-sm ${
                    totalPercentage > 100 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {totalPercentage > 100 
                      ? 'Total percentage exceeds 100%' 
                      : 'Total percentage must equal 100%'}
                  </p>
                )}
              </div>

              {Object.entries(composition).map(([type, value]) => (
                <div key={type} className="grid grid-cols-2 gap-4 items-center">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {type} (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleCompositionChange(type as keyof CompositionUpdate, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              ))}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCompositionModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totalPercentage !== 100}
                  className={`btn ${totalPercentage === 100 ? 'btn-primary' : 'btn-disabled'}`}
                >
                  {isSubmitting ? 'Updating...' : 'Update Composition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Active Routes
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {mockRoutes.map((route) => (
              <li key={route.id} className="px-4 py-4 sm:px-6 card dark:shadow-white dark:border-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-primary-600">
                        Route {route.id}
                      </div>
                      <span
                        className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          route.status === 'active'
                            ? 'bg-green-100 text-black dark:text-black'
                            : route.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-black dark:text-black'
                        }`}
                      >
                        {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-500">
                        <span className="mr-4">Truck: {route.truckId}</span>
                        <span className="mr-4">
                          Time: {route.estimatedTime} mins
                        </span>
                        <span>Distance: {route.distance} km</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Bins: {route.bins.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn btn-secondary btn-sm">Edit</button>
                    <button className="btn btn-secondary btn-sm">Track</button>
                    {route.status === 'active' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowCompositionModal(true);
                        }}
                      >
                        Complete & Update
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 