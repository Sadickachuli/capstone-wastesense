import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface Route {
  id: string;
  truckId: string;
  status: 'active' | 'completed' | 'pending';
  estimatedTime: number;
  distance: number;
  bins: string[];
}

// Mock data for demonstration
const mockRoutes: Route[] = [
  {
    id: 'R001',
    truckId: 'T001',
    status: 'active',
    estimatedTime: 45,
    distance: 5.2,
    bins: ['B001', 'B002', 'B003'],
  },
  {
    id: 'R002',
    truckId: 'T002',
    status: 'pending',
    estimatedTime: 30,
    distance: 3.8,
    bins: ['B004', 'B005'],
  },
];

export default function Routes() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Collection Routes</h1>
        <button className="btn btn-primary">Create New Route</button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Active Routes
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {mockRoutes.map((route) => (
              <li key={route.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-primary-600">
                        Route {route.id}
                      </div>
                      <span
                        className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          route.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : route.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
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