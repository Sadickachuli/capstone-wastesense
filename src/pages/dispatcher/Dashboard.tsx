import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/mockApi';
import { useWasteSites } from '../../hooks/useWasteSites';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useReports } from '../../hooks/useReports';
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

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
}

interface TruckRoute {
  id: string;
  truckId: string;
  zone: string;
  status: 'pending' | 'in-progress' | 'completed';
  timestamp: string;
  estimatedCompletion?: string;
}

const WASTE_COLORS: Record<string, string> = {
  plastic: '#2563eb', // blue
  metal: '#6b7280',   // gray
  organic: '#22c55e', // green
  paper: '#eab308',   // yellow
  glass: '#10b981',   // teal
};

// Mock data for demonstration
const mockRoutes: TruckRoute[] = [
  {
    id: 'R001',
    truckId: 'T001',
    zone: 'North',
    status: 'in-progress',
    timestamp: '2024-03-20T08:00:00Z',
    estimatedCompletion: '2024-03-20T12:00:00Z',
  },
  {
    id: 'R002',
    truckId: 'T003',
    zone: 'South',
    status: 'pending',
    timestamp: '2024-03-20T08:30:00Z',
    estimatedCompletion: '2024-03-20T13:00:00Z',
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
  const { reports, loading: reportsLoading, error: reportsError } = useReports();
  const { sites, loading: sitesLoading, error: sitesError } = useWasteSites();
  const { updateSiteComposition } = useWasteSites();
  const [selectedRoute, setSelectedRoute] = useState<TruckRoute | null>(null);
  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [composition, setComposition] = useState<CompositionUpdate & { textile?: number; other?: number }>({
    plastic: 0,
    paper: 0,
    glass: 0,
    metal: 0,
    organic: 0,
    textile: 0,
    other: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thresholdStatus, setThresholdStatus] = useState<any>(null);
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
  const [archivedError, setArchivedError] = useState<string | null>(null);
  const [mlRecommendation, setMlRecommendation] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [currentCapacity, setCurrentCapacity] = useState<number | ''>('');
  const [wasteImage, setWasteImage] = useState<File | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [detectionLoading, setDetectionLoading] = useState(false);
  const [detectionError, setDetectionError] = useState('');
  const [selectedSiteForDetection, setSelectedSiteForDetection] = useState('');
  const [detectionMethod, setDetectionMethod] = useState<'llm' | 'yolo'>('llm');
  const [availableTrucks, setAvailableTrucks] = useState(5);
  const [manualTotalWeight, setManualTotalWeight] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showDumpingSiteModal, setShowDumpingSiteModal] = useState(false);
  const [selectedDumpingSite, setSelectedDumpingSite] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('T001');

  // Calculate total percentage
  const totalPercentage = Object.values(composition).reduce((sum, value) => sum + value, 0);

  // Toast functions
  const addToast = (toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const newToast: Toast = {
      ...toast,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
    interval = setInterval(fetchThreshold, 30000);
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
    interval = setInterval(fetchNotifications, 30000);
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
    interval = setInterval(fetchActiveReports, 30000);
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
    if (currentCapacity === '' || isNaN(Number(currentCapacity)) || Number(currentCapacity) < 0) {
      alert('Please enter a valid current capacity');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateSiteComposition(selectedSite, Object.assign({}, composition, { currentCapacity: Number(currentCapacity) }));
      setShowCompositionModal(false);
      alert('Waste composition updated successfully');
    } catch (error) {
      console.error('Failed to update composition:', error);
      alert('Failed to update waste composition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompositionChange = (type: keyof CompositionUpdate | 'textile' | 'other', value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setComposition(prev => ({
      ...prev,
      [type]: numValue
    }));
  };

  const handleRouteComplete = (route: TruckRoute) => {
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
    setShowDumpingSiteModal(true);
  };

  const handleConfirmCollection = async () => {
    if (!selectedDumpingSite) {
      alert('Please select a dumping site');
      return;
    }

    setMarkAllLoading(true);
    setMarkAllMessage('');
    try {
      const res = await axios.patch('/api/auth/reports/mark-all-collected', {
        dumpingSiteId: selectedDumpingSite,
        truckId: selectedTruckId
      });
      setMarkAllMessage(`Marked ${res.data.updatedCount} reports as collected and created delivery to ${selectedDumpingSite === 'WS001' ? 'North Dumping Site' : 'South Dumping Site'}.`);
      // Refresh active reports
      const refreshed = await axios.get('/api/auth/reports/active');
      setActiveReports(refreshed.data.reports);
      setShowDumpingSiteModal(false);
      setSelectedDumpingSite('');
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
        const res = await axios.get(`/api/auth/dispatch/recommendation?trucks=${availableTrucks}`);
        setMlRecommendation(res.data);
      } catch (err) {
        setMlError('Failed to fetch dispatch recommendation');
      } finally {
        setMlLoading(false);
      }
    };
    fetchRecommendation();
    interval = setInterval(fetchRecommendation, 30000);
    return () => clearInterval(interval);
  }, [availableTrucks]);

  const handleWasteImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWasteImage(e.target.files[0]);
      setDetectionResult(null);
      setDetectionError('');
    }
  };

  const handleWasteImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteImage) return;
    setDetectionLoading(true);
    setDetectionError('');
    setDetectionResult(null);
    try {
      const formData = new FormData();
      formData.append('file', wasteImage);
      let res;
      if (detectionMethod === 'llm') {
        res = await axios.post('/api/auth/detect-waste-llm', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDetectionResult({ 
          result: res.data.composition, 
          total_weight: 0, 
          annotated_image: res.data.annotated_image || '', // Now using the actual image from LLM
          raw: res.data.raw 
        });
      } else {
        res = await axios.post('/api/auth/detect-waste-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDetectionResult(res.data);
      }
    } catch (err: any) {
      setDetectionError(err?.response?.data?.message || 'Failed to detect waste composition');
    } finally {
      setDetectionLoading(false);
    }
  };

  const handleConfirmDetection = async () => {
    if (!detectionResult || !selectedSiteForDetection) return;
    let totalWeight = detectionResult.total_weight;
    // If LLM and no total_weight, use manual input
    if (detectionMethod === 'llm' && (!totalWeight || totalWeight === 0)) {
      totalWeight = Number(manualTotalWeight);
    }
    if (!totalWeight || isNaN(totalWeight) || totalWeight <= 0) {
      alert('Please enter the total weight of the waste (kg) before updating.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Always send all 7 types, defaulting to 0 if missing
      const allTypes = ['plastic', 'paper', 'glass', 'metal', 'organic', 'textile', 'other'] as const;
      type WasteComposition = { [K in typeof allTypes[number]]: number };
      const normalizedResult: WasteComposition = allTypes.reduce((acc, type) => {
        acc[type] = Number(detectionResult.result[type] ?? 0);
        return acc;
      }, {} as WasteComposition);
      await updateSiteComposition(selectedSiteForDetection, {
        ...normalizedResult,
        currentCapacity: totalWeight,
        annotated_image: detectionResult.annotated_image || '',
      });
      // AUTOMATICALLY CREATE/UPDATE DELIVERY
      // Find the site and its zone
      const siteObj = [
        { id: 'WS001', name: 'North Dumping Site', zone: 'Ablekuma North' },
        { id: 'WS002', name: 'South Dumping Site', zone: 'Ayawaso West' },
      ].find(s => s.id === selectedSiteForDetection);
      if (siteObj) {
        await api.deliveries.create({
          truckId: 'T001', // Or use a smarter assignment if available
          facilityId: siteObj.id,
          zone: siteObj.zone,
          estimatedArrival: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          status: 'in-transit',
          weight: totalWeight,
          composition: normalizedResult,
        });
      }
      setDetectionResult(null);
      setWasteImage(null);
      setSelectedSiteForDetection('');
      setManualTotalWeight('');
      addToast({
        type: 'success',
        title: 'Success!',
        message: 'Waste composition and weight updated successfully! Delivery created.'
      });
    } catch (error) {
      console.error('Failed to update waste site:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: `Failed to update waste site: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-0 md:p-0 font-sans">
      {/* Topbar (optional, for user info/notifications) */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Dispatcher Dashboard</h1>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-base">Create New Route</button>
          {/* Placeholder for user avatar/profile */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">D</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ablekuma North Zone Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-3xl p-8 shadow flex flex-col gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-300 mb-1">Ablekuma North</span>
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
              Reports: {mlRecommendation?.reportCounts?.North ?? '--'}
            </span>
            <span className="text-base text-gray-700 dark:text-gray-200">
              Threshold: {thresholdStatus ? thresholdStatus.threshold : '--'}
            </span>
            <span className={
              mlRecommendation?.reportCounts?.North >= (thresholdStatus?.threshold ?? 0)
                ? 'text-green-700 dark:text-green-300 font-semibold'
                : 'text-yellow-700 dark:text-yellow-300 font-semibold'
            }>
              {mlRecommendation?.reportCounts?.North >= (thresholdStatus?.threshold ?? 0)
                ? `Threshold reached${mlRecommendation?.allocation?.North ? `, Trucks Assigned: ${mlRecommendation.allocation.North}` : ''}`
                : `${(thresholdStatus?.threshold ?? 0) - (mlRecommendation?.reportCounts?.North ?? 0)} more needed`}
            </span>
          </div>
          {/* Ayawaso West Zone Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-3xl p-8 shadow flex flex-col gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-300 mb-1">Ayawaso West</span>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
              Reports: {mlRecommendation?.reportCounts?.South ?? '--'}
            </span>
            <span className="text-base text-gray-700 dark:text-gray-200">
              Threshold: {thresholdStatus ? thresholdStatus.threshold : '--'}
            </span>
            <span className={
              mlRecommendation?.reportCounts?.South >= (thresholdStatus?.threshold ?? 0)
                ? 'text-green-700 dark:text-green-300 font-semibold'
                : 'text-yellow-700 dark:text-yellow-300 font-semibold'
            }>
              {mlRecommendation?.reportCounts?.South >= (thresholdStatus?.threshold ?? 0)
                ? `Threshold reached${mlRecommendation?.allocation?.South ? `, Trucks Assigned: ${mlRecommendation.allocation.South}` : ''}`
                : `${(thresholdStatus?.threshold ?? 0) - (mlRecommendation?.reportCounts?.South ?? 0)} more needed`}
            </span>
          </div>
          {/* Available Trucks Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 shadow flex flex-col gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-300 mb-1">Available Trucks</span>
            <span className="text-3xl font-bold text-gray-700 dark:text-white mb-1">{availableTrucks}</span>
            <label className="font-medium text-gray-700 dark:text-gray-200 mt-2">Set Trucks:</label>
            <input
              type="number"
              min={1}
              value={availableTrucks}
              onChange={e => setAvailableTrucks(Number(e.target.value) || 1)}
              className="w-20 px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Notifications & ML Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
              <button
                className="btn btn-secondary btn-xs"
                onClick={handleToggleArchived}
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>
            
            {/* Fixed height scrollable container */}
            <div className="h-64 overflow-y-auto space-y-3">
              {showArchived && (
                <div className="pb-3 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Archived</h3>
                  {archivedLoading ? (
                    <p className="text-gray-600 dark:text-gray-400">Loading archived notifications...</p>
                  ) : archivedError ? (
                    <p className="text-red-600">{archivedError}</p>
                  ) : archivedNotifications.length > 0 ? (
                    <ul className="space-y-2">
                      {archivedNotifications.map((n: any) => (
                        <li key={n.id} className="p-3 rounded bg-gray-100 dark:bg-gray-800 shadow-sm">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">{n.title}</div>
                          <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">{n.message}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No archived notifications.</p>
                  )}
                </div>
              )}
              
              {/* Current notifications */}
              <div>
                {!showArchived && (
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent</h3>
                )}
                {notificationsLoading ? (
                  <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
                ) : notificationsError ? (
                  <p className="text-red-600">{notificationsError}</p>
                ) : notifications.length > 0 ? (
                  <ul className="space-y-2">
                    {notifications.map((n: any) => (
                      <li key={n.id} className="p-3 rounded bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm">
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{n.title}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">{n.message}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{new Date(n.timestamp).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No new notifications.</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Truck Allocation Recommendation</h2>
            {mlLoading ? (
              <p>Loading recommendation...</p>
            ) : mlError ? (
              <p className="text-red-600">{mlError}</p>
            ) : mlRecommendation ? (
              <div>
                <div className="mb-2">Available Trucks: <span className="font-bold">{mlRecommendation.availableTrucks}</span></div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="p-4 rounded bg-white shadow">
                    <div className="font-semibold text-blue-700">Ablekuma North</div>
                    <div>Reports: <span className="font-bold">{mlRecommendation.reportCounts?.North ?? 0}</span></div>
                    <div>Trucks Assigned: <span className="font-bold">{mlRecommendation.allocation?.North ?? 0}</span></div>
                  </div>
                  <div className="p-4 rounded bg-white shadow">
                    <div className="font-semibold text-green-700">Ayawaso West</div>
                    <div>Reports: <span className="font-bold">{mlRecommendation.reportCounts?.South ?? 0}</span></div>
                    <div>Trucks Assigned: <span className="font-bold">{mlRecommendation.allocation?.South ?? 0}</span></div>
                  </div>
                </div>
                <div className="text-gray-900 font-semibold">{mlRecommendation.recommendation}</div>
                <div className="text-sm text-gray-700">Next Collection: {new Date(mlRecommendation.nextCollectionTime).toLocaleString()}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Waste Detection Section */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Image-based Waste Detection</h2>
          <div className="mb-2 flex items-center space-x-4">
            <label className="font-medium text-gray-700">Detection Method:</label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="detectionMethod"
                value="llm"
                checked={detectionMethod === 'llm'}
                onChange={() => setDetectionMethod('llm')}
              />
              <span className="ml-2">AI (LLM)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="detectionMethod"
                value="yolo"
                checked={detectionMethod === 'yolo'}
                onChange={() => setDetectionMethod('yolo')}
              />
              <span className="ml-2">YOLOv8</span>
            </label>
          </div>
          <form onSubmit={handleWasteImageUpload} className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleWasteImageChange}
              className="mb-2 md:mb-0"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!wasteImage || detectionLoading}
            >
              {detectionLoading ? 'Detecting...' : 'Detect Waste Composition'}
            </button>
          </form>
          {detectionError && <p className="text-red-600 mt-2">{detectionError}</p>}
          {detectionResult && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Detected Composition:</h3>
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={Object.entries(detectionResult.result).map(([type, percent]) => ({ name: type, value: percent }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {Object.keys(WASTE_COLORS).map((type) => (
                        <Cell key={type} fill={WASTE_COLORS[type]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {detectionMethod === 'llm' && detectionResult.result && (
                <div className="mb-4">
                  <ul className="space-y-1">
                    {Object.entries(detectionResult.result).map(([type, percent]) => (
                      <li key={type} className="flex items-center space-x-2">
                        <span className="capitalize font-medium">{type}:</span>
                        <span>{percent}%</span>
                      </li>
                    ))}
                  </ul>
                  {/* Prompt for total weight if missing */}
                  {(!detectionResult.total_weight || detectionResult.total_weight === 0) && (
                    <div className="mt-4">
                      <label className="block font-medium text-gray-700 mb-1">Enter total weight (kg):</label>
                      <input
                        type="number"
                        min={1}
                        value={manualTotalWeight}
                        onChange={e => setManualTotalWeight(e.target.value)}
                        className="w-32 px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
                      />
                    </div>
                  )}
                  {wasteImage && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-1">Uploaded Image:</h4>
                      <img
                        src={URL.createObjectURL(wasteImage)}
                        alt="Uploaded waste pile"
                        className="w-full max-w-md border rounded shadow"
                        style={{ maxHeight: 400, objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>
              )}
              {detectionMethod === 'yolo' && (
                <>
                  <ul className="space-y-1">
                    {Object.entries(detectionResult.result).map(([type, percent]) => (
                      <li key={type} className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <span>{percent}%</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 text-sm text-gray-700 font-medium">
                    Total Weight: <span className="font-bold">{detectionResult.total_weight} kg</span>
                  </div>
                  {detectionResult.annotated_image && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-1">Detected Objects:</h4>
                      <img
                        src={`data:image/jpeg;base64,${detectionResult.annotated_image}`}
                        alt="Annotated waste detection"
                        className="w-full max-w-md border rounded shadow"
                        style={{ maxHeight: 400, objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </>
              )}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Dumping Site</label>
                <select
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={selectedSiteForDetection}
                  onChange={e => setSelectedSiteForDetection(e.target.value)}
                >
                  <option value="">Select a site</option>
                  <option value="WS001">North Dumping Site</option>
                  <option value="WS002">South Dumping Site</option>
                </select>
              </div>
              <button
                className="btn btn-primary mt-4"
                disabled={!selectedSiteForDetection || isSubmitting}
                onClick={handleConfirmDetection}
              >
                {isSubmitting ? 'Updating...' : 'Confirm & Update Site'}
              </button>
            </div>
          )}
        </div>

        {/* Active Reports Table */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Reports</h2>
          {activeReportsLoading ? (
            <p>Loading reports...</p>
          ) : activeReportsError ? (
            <p className="text-red-600">{activeReportsError}</p>
          ) : activeReports.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {activeReports.map((report: any) => (
                  <tr key={report.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{report.zone}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{report.description}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <button
                        className="px-4 py-2 rounded bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
                        disabled={updatingReportId === report.id}
                        onClick={() => handleMarkCollected(report.id)}
                      >
                        {updatingReportId === report.id ? 'Updating...' : 'Mark Collected'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">No active reports.</p>
          )}
          <button
            className="mt-4 px-5 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
            disabled={markAllLoading}
            onClick={handleMarkAllCollected}
          >
            {markAllLoading ? 'Marking...' : 'Mark All as Collected'}
          </button>
          {markAllMessage && <p className="mt-2 text-green-700 font-semibold">{markAllMessage}</p>}
        </div>
      </div>

      {/* Modals */}
      {showCompositionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Waste Composition</h3>
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
                    onChange={(e) => handleCompositionChange(type as keyof CompositionUpdate | 'textile' | 'other', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              ))}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Current Capacity (tons)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={currentCapacity}
                  onChange={e => setCurrentCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
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

      {/* Dumping Site Selection Modal */}
      {showDumpingSiteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 w-full max-w-md shadow-xl animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Dumping Site</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Where are you taking the collected waste?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="dumpingSite"
                      value="WS001"
                      checked={selectedDumpingSite === 'WS001'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDumpingSite(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-gray-900 dark:text-white">North Dumping Site (WS001)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="dumpingSite"
                      value="WS002"
                      checked={selectedDumpingSite === 'WS002'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDumpingSite(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-gray-900 dark:text-white">South Dumping Site (WS002)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Truck ID
                </label>
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="T001">Truck T001</option>
                  <option value="T002">Truck T002</option>
                  <option value="T003">Truck T003</option>
                  <option value="T004">Truck T004</option>
                  <option value="T005">Truck T005</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDumpingSiteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCollection}
                disabled={markAllLoading || !selectedDumpingSite}
                className={`btn ${selectedDumpingSite ? 'btn-primary' : 'btn-disabled'}`}
              >
                {markAllLoading ? 'Creating Delivery...' : 'Confirm Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
              toast.type === 'success' ? 'border-l-4 border-green-500' :
              toast.type === 'error' ? 'border-l-4 border-red-500' :
              toast.type === 'warning' ? 'border-l-4 border-yellow-500' :
              'border-l-4 border-blue-500'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toast.type === 'success' && (
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {toast.type === 'error' && (
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {toast.type === 'warning' && (
                    <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {toast.type === 'info' && (
                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 