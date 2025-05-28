import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface Route {
  id: string;
  truckId: string;
  status: 'active' | 'completed' | 'pending';
  estimatedTime: number;
  distance: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

// Mock data for demonstration
const mockRoutes: Route[] = [
  {
    id: 'R001',
    truckId: 'T001',
    status: 'active',
    estimatedTime: 45,
    distance: 5.2,
  },
  {
    id: 'R002',
    truckId: 'T002',
    status: 'pending',
    estimatedTime: 30,
    distance: 3.8,
  },
];

const mockAlerts: Alert[] = [
  {
    id: 'A001',
    type: 'warning',
    message: 'Bin overflow reported in Zone A',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'A002',
    type: 'info',
    message: 'Truck T001 completed route R003',
    timestamp: new Date().toISOString(),
  },
];

export default function DispatcherDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dispatcher Dashboard
        </h1>
        <button className="btn btn-primary">Create New Route</button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Active Routes</h3>
          <p className="text-3xl font-bold text-blue-600">3</p>
        </div>
        <div className="card bg-green-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Available Trucks
          </h3>
          <p className="text-3xl font-bold text-green-600">5</p>
        </div>
        <div className="card bg-yellow-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pending Reports
          </h3>
          <p className="text-3xl font-bold text-yellow-600">8</p>
        </div>
      </div>

      {/* Active Routes */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Active Routes</h2>
        <div className="space-y-4">
          {mockRoutes.map((route) => (
            <div
              key={route.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">Route {route.id}</p>
                <p className="text-sm text-gray-600">Truck: {route.truckId}</p>
                <p className="text-sm text-gray-600">
                  ETA: {route.estimatedTime} mins
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    route.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {route.status}
                </span>
                <button className="btn btn-secondary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h2>
        <div className="space-y-4">
          {mockAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg ${
                alert.type === 'warning'
                  ? 'bg-yellow-50'
                  : alert.type === 'error'
                  ? 'bg-red-50'
                  : 'bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`font-medium ${
                      alert.type === 'warning'
                        ? 'text-yellow-800'
                        : alert.type === 'error'
                        ? 'text-red-800'
                        : 'text-blue-800'
                    }`}
                  >
                    {alert.message}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  Mark as read
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 