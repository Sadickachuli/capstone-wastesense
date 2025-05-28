import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface AnalyticsSummary {
  totalCollections: number;
  completedRoutes: number;
  activeRoutes: number;
  totalDistance: number;
  efficiency: number;
  complaints: number;
}

// Mock data for demonstration
const mockAnalytics: AnalyticsSummary = {
  totalCollections: 156,
  completedRoutes: 42,
  activeRoutes: 3,
  totalDistance: 892.5,
  efficiency: 87,
  complaints: 5,
};

export default function Analytics() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <select className="form-select">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <button className="btn btn-secondary">Export Report</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Collections
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mockAnalytics.totalCollections}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Completed Routes
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mockAnalytics.completedRoutes}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Routes
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mockAnalytics.activeRoutes}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Distance (km)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mockAnalytics.totalDistance}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Route Efficiency
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mockAnalytics.efficiency}%
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Customer Complaints
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {mockAnalytics.complaints}
            </dd>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Performance Insights
          </h3>
          <div className="mt-4">
            <ul className="divide-y divide-gray-200">
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Most efficient route: <span className="font-medium">R007</span>
                  </div>
                  <div className="text-sm text-green-600">92% efficiency</div>
                </div>
              </li>
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Busiest collection day: <span className="font-medium">Wednesday</span>
                  </div>
                  <div className="text-sm text-gray-600">35 collections</div>
                </div>
              </li>
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Average route completion time:
                  </div>
                  <div className="text-sm text-gray-600">45 minutes</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 