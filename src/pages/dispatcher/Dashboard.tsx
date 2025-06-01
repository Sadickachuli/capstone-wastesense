import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/mockApi';
import { Route, WasteSite } from '../../types';
import axios from 'axios';

interface Alert {
  id: string;
  type: 'warning' | 'info';
  message: string;
  timestamp: string;
}

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
    status: 'active',
    estimatedTime: 45,
    distance: 5.2,
    bins: ['1', '2'],
  },
  {
    id: 'R002',
    truckId: 'T002',
    status: 'pending',
    estimatedTime: 30,
    distance: 3.8,
    bins: ['3', '4'],
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
  const [thresholdStatus, setThresholdStatus] = useState<{ reportedCount: number; total: number; threshold: number } | null>(null);
  const [thresholdLoading, setThresholdLoading] = useState(true);
  const [thresholdError, setThresholdError] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState('');

  // Calculate total percentage
  const totalPercentage = Object.values(composition).reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchThreshold = async () => {
      setThresholdLoading(true);
      setThresholdError('');
      try {
        const res = await axios.get('/api/auth/reports/threshold-status');
        setThresholdStatus(res.data);
      } catch (err) {
        setThresholdError('Failed to fetch threshold status');
      } finally {
        setThresholdLoading(false);
      }
    };
    fetchThreshold();
    interval = setInterval(fetchThreshold, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications with polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchNotifications = async () => {
      setNotificationsLoading(true);
      setNotificationsError('');
      try {
        const res = await axios.get('/api/auth/notifications/dispatcher');
        setNotifications(res.data.notifications);
      } catch (err) {
        setNotificationsError('Failed to fetch notifications');
      } finally {
        setNotificationsLoading(false);
      }
    };
    fetchNotifications();
    interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCompositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;

    if (totalPercentage !== 100) {
      alert('Total percentage must equal 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update waste composition
      await api.wasteSites.updateComposition(selectedSite, composition);
      
      // Create notification for recyclers
      const site = await api.wasteSites.getById(selectedSite);
      await api.notifications.create({
        type: 'info',
        title: 'New Waste Composition Update',
        message: `Waste composition updated at ${site.name}`,
        forRole: 'recycler',
        metadata: {
          siteId: selectedSite,
          siteName: site.name,
          updateType: 'composition'
        }
      });

      setShowCompositionModal(false);
      // Show success message
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

  const handleRouteComplete = (route: Route) => {
    setSelectedRoute(route);
    setShowCompositionModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dispatcher Dashboard
        </h1>
        <button className="btn btn-primary">Create New Route</button>
      </div>

      <div className="card bg-blue-50 mb-4">
        <h2 className="text-lg font-medium text-blue-900 mb-2">Bin Full Reports Status</h2>
        {thresholdLoading ? (
          <p>Loading status...</p>
        ) : thresholdError ? (
          <p className="text-red-600">{thresholdError}</p>
        ) : thresholdStatus ? (
          <div>
            <p className="text-blue-900 font-semibold">
              {thresholdStatus.reportedCount} / {thresholdStatus.total} residents have reported their bins full
            </p>
            <p className={
              thresholdStatus.reportedCount >= thresholdStatus.threshold
                ? 'text-green-700 font-bold'
                : 'text-yellow-700 font-semibold'
            }>
              {thresholdStatus.reportedCount >= thresholdStatus.threshold
                ? 'Threshold reached! Trucks should be dispatched.'
                : `${thresholdStatus.threshold - thresholdStatus.reportedCount} more reports needed to reach threshold.`}
            </p>
          </div>
        ) : null}
      </div>

      <div className="card bg-green-50 mb-4">
        <h2 className="text-lg font-medium text-green-900 mb-2">Notifications</h2>
        {notificationsLoading ? (
          <p>Loading notifications...</p>
        ) : notificationsError ? (
          <p className="text-red-600">{notificationsError}</p>
        ) : notifications.length > 0 ? (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="p-2 rounded bg-white shadow">
                <div className="font-semibold text-green-800">{n.title}</div>
                <div className="text-sm text-gray-700">{n.message}</div>
                <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No notifications yet.</p>
        )}
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
                {route.status === 'active' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRouteComplete(route)}
                  >
                    Complete & Update Waste
                  </button>
                )}
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
                  ? 'bg-yellow-50 text-yellow-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              <p className="text-sm">{alert.message}</p>
              <p className="text-xs mt-1 text-gray-500">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 