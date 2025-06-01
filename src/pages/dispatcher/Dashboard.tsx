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
  const [activeReports, setActiveReports] = useState<any[]>([]);
  const [activeReportsLoading, setActiveReportsLoading] = useState(true);
  const [activeReportsError, setActiveReportsError] = useState('');
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [markAllMessage, setMarkAllMessage] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archivedNotifications, setArchivedNotifications] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedError, setArchivedError] = useState('');
  const [mlRecommendation, setMlRecommendation] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlError, setMlError] = useState('');

  // Calculate total percentage
  const totalPercentage = Object.values(composition).reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
    let interval: ReturnType<typeof setInterval>;
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

  // Fetch active reports with polling
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchActiveReports = async () => {
      setActiveReportsLoading(true);
      setActiveReportsError('');
      try {
        const res = await axios.get('/api/auth/reports/active');
        setActiveReports(res.data.reports);
      } catch (err) {
        setActiveReportsError('Failed to fetch active reports');
      } finally {
        setActiveReportsLoading(false);
      }
    };
    fetchActiveReports();
    interval = setInterval(fetchActiveReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchArchivedNotifications = async () => {
    setArchivedLoading(true);
    setArchivedError('');
    try {
      const res = await axios.get('/api/auth/notifications/dispatcher/archived');
      setArchivedNotifications(res.data.notifications);
    } catch (err) {
      setArchivedError('Failed to fetch archived notifications');
    } finally {
      setArchivedLoading(false);
    }
  };

  const handleToggleArchived = () => {
    if (!showArchived) {
      fetchArchivedNotifications();
    }
    setShowArchived((prev) => !prev);
  };

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

  // Handler to mark report as collected
  const handleMarkCollected = async (reportId: string) => {
    setUpdatingReportId(reportId);
    try {
      await axios.patch(`/api/auth/reports/${reportId}/status`, { status: 'collected' });
      // Refresh active reports
      const res = await axios.get('/api/auth/reports/active');
      setActiveReports(res.data.reports);
    } catch (err) {
      alert('Failed to update report status');
    } finally {
      setUpdatingReportId(null);
    }
  };

  // Handler to mark all reports as collected
  const handleMarkAllCollected = async () => {
    setMarkAllLoading(true);
    setMarkAllMessage('');
    try {
      const res = await axios.patch('/api/auth/reports/mark-all-collected');
      setMarkAllMessage(`Marked ${res.data.updatedCount} reports as collected.`);
      // Refresh active reports
      const refreshed = await axios.get('/api/auth/reports/active');
      setActiveReports(refreshed.data.reports);
    } catch (err) {
      setMarkAllMessage('Failed to mark all as collected');
    } finally {
      setMarkAllLoading(false);
    }
  };

  // Fetch ML dispatch recommendation with polling
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchRecommendation = async () => {
      setMlLoading(true);
      setMlError('');
      try {
        const res = await axios.get('/api/auth/dispatch/recommendation');
        setMlRecommendation(res.data);
      } catch (err) {
        setMlError('Failed to fetch dispatch recommendation');
      } finally {
        setMlLoading(false);
      }
    };
    fetchRecommendation();
    interval = setInterval(fetchRecommendation, 10000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="flex items-center mb-2">
          <button
            className="btn btn-secondary btn-xs"
            onClick={handleToggleArchived}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
        {showArchived && (
          <div className="mb-2">
            {archivedLoading ? (
              <p>Loading archived notifications...</p>
            ) : archivedError ? (
              <p className="text-red-600">{archivedError}</p>
            ) : archivedNotifications.length > 0 ? (
              <ul className="space-y-2">
                {archivedNotifications.map((n) => (
                  <li key={n.id} className="p-2 rounded bg-gray-100 shadow">
                    <div className="font-semibold text-gray-800">{n.title}</div>
                    <div className="text-sm text-gray-700">{n.message}</div>
                    <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No archived notifications.</p>
            )}
          </div>
        )}
      </div>

      {/* ML Dispatch Recommendation */}
      <div className="card bg-purple-50 mb-4">
        <h2 className="text-lg font-medium text-purple-900 mb-2">ML Dispatch Recommendation</h2>
        {mlLoading ? (
          <p>Loading recommendation...</p>
        ) : mlError ? (
          <p className="text-red-600">{mlError}</p>
        ) : mlRecommendation ? (
          <div>
            <p className="text-purple-900 font-semibold">{mlRecommendation.recommendation}</p>
            <p className="text-sm text-gray-700">Confidence: {(mlRecommendation.confidence * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-700">Next Collection: {new Date(mlRecommendation.nextCollectionTime).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Reason: {mlRecommendation.reason}</p>
          </div>
        ) : null}
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
          <p className="text-3xl font-bold text-yellow-600">{activeReports.length}</p>
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

      {/* Bin Full Reports Section */}
      <div className="card bg-yellow-50 mb-4">
        <h2 className="text-lg font-medium text-yellow-900 mb-2">Active Bin Full Reports</h2>
        <div className="mb-2 flex items-center space-x-4">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleMarkAllCollected}
            disabled={
              markAllLoading ||
              activeReports.length === 0 ||
              !thresholdStatus ||
              thresholdStatus.reportedCount < thresholdStatus.threshold
            }
          >
            {markAllLoading ? 'Marking All...' : 'Mark All as Collected'}
          </button>
          {markAllMessage && <span className="text-sm text-gray-700">{markAllMessage}</span>}
        </div>
        {activeReportsLoading ? (
          <p>Loading reports...</p>
        ) : activeReportsError ? (
          <p className="text-red-600">{activeReportsError}</p>
        ) : activeReports.length === 0 ? (
          <p className="text-gray-600">No active reports</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activeReports.map((report) => (
              <li key={report.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{report.resident_name} ({report.zone})</p>
                  <p className="text-sm text-gray-600">{report.description || 'No description'}</p>
                  <p className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={updatingReportId === report.id}
                  onClick={() => handleMarkCollected(report.id)}
                >
                  {updatingReportId === report.id ? 'Updating...' : 'Mark as Collected'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 