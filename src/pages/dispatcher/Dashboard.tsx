import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/mockApi';
import { useWasteSites } from '../../hooks/useWasteSites';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useReports } from '../../hooks/useReports';
import { environment } from '../../config/environment';
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

interface Vehicle {
  id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  fuel_efficiency_kmpl: number;
  tank_capacity_liters: number;
  current_fuel_level: number;
  total_distance_km: number;
  status: string;
  fuel_percentage: number;
  estimated_range_km: number;
  needs_refuel: boolean;
}

interface FuelAnalytics {
  total_distance: number;
  total_fuel_consumed: number;
  total_cost: number;
  avg_cost_per_km: number;
  total_trips: number;
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
  const { isDarkMode } = useTheme();
  const { reports, loading: reportsLoading, error: reportsError } = useReports();
  const { sites, loading: sitesLoading, error: sitesError } = useWasteSites();
  const { updateSiteComposition } = useWasteSites();
  
  // Animation states
  const [animationInView, setAnimationInView] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Dashboard states
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
  const [manualTotalWeight, setManualTotalWeight] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showDumpingSiteModal, setShowDumpingSiteModal] = useState(false);
  const [selectedDumpingSite, setSelectedDumpingSite] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('T001');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Fuel tracking state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState('');
  const [fuelAnalytics, setFuelAnalytics] = useState<FuelAnalytics | null>(null);
  const [fuelAnalyticsLoading, setFuelAnalyticsLoading] = useState(true);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [selectedVehicleForFuel, setSelectedVehicleForFuel] = useState('');
  const [tripData, setTripData] = useState({
    distance_km: '',
    trip_start: '',
    trip_end: '',
    fuel_cost: '',
    route_description: ''
  });

  // Add vehicle management state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleFormData, setVehicleFormData] = useState({
    id: '',
    type: 'compressed_truck',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_efficiency_kmpl: '',
    tank_capacity_liters: '',
    current_fuel_level: '',
    registration_number: '',
    driver_name: '',
    driver_contact: ''
  });
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add configuration state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configData, setConfigData] = useState({
    dumpingSites: [
      { id: '', name: '', location: '', coordinates: { lat: '', lng: '' } }
    ],
    zoneDistances: {
      'Ablekuma North': {},
      'Ayawaso West': {}
    },
    zoneCustomers: {
      'Ablekuma North': {
        totalCustomers: 145
      },
      'Ayawaso West': {
        totalCustomers: 82
      }
    },
    fuelPricePerLiter: 10.0
  });

  // Calculate available trucks dynamically from fleet management
  const availableTrucks = vehicles.filter(v => v.status === 'available').length;

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
        const API_BASE_URL = environment.getApiUrl();
        const res = await axios.get(`${API_BASE_URL}/auth/reports/threshold-status`);
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
        const API_BASE_URL = environment.getApiUrl();
        const res = await axios.get(`${API_BASE_URL}/auth/notifications/dispatcher`);
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
        const API_BASE_URL = environment.getApiUrl();
        const res = await axios.get(`${API_BASE_URL}/auth/reports/active`);
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
      const API_BASE_URL = environment.getApiUrl();
      const res = await axios.get(`${API_BASE_URL}/auth/notifications/dispatcher/archived`);
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
    // Show dumping site modal for individual report
    setSelectedReportId(reportId);
    setShowDumpingSiteModal(true);
  };

  // Handler to mark all reports as collected
  const handleMarkAllCollected = async () => {
    // Set default truck to first available vehicle
    const availableVehicle = vehicles.find(v => v.status === 'available' || v.status === 'scheduled');
    if (availableVehicle) {
      setSelectedTruckId(availableVehicle.id);
    }
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
      const API_BASE_URL = environment.getApiUrl();
      if (selectedReportId) {
        // Handle individual report
        setUpdatingReportId(selectedReportId);
        await axios.patch(`${API_BASE_URL}/auth/reports/${selectedReportId}/status`, { 
          status: 'collected',
          dumpingSiteId: selectedDumpingSite 
        });
        setMarkAllMessage(`Report marked as collected and delivered to ${selectedDumpingSite === 'WS001' ? 'North Dumping Site' : 'South Dumping Site'}.`);
      } else {
        // Handle mark all reports
        const res = await axios.patch(`${API_BASE_URL}/auth/reports/mark-all-collected`, {
          dumpingSiteId: selectedDumpingSite,
          truckId: selectedTruckId
        });
        setMarkAllMessage(`Marked ${res.data.updatedCount} reports as collected and created delivery to ${selectedDumpingSite === 'WS001' ? 'North Dumping Site' : 'South Dumping Site'}.`);
      }
      
      // Update any active schedules to completed status
      try {
        await axios.patch(`${API_BASE_URL}/auth/schedules/complete-by-reports`);
      } catch (scheduleErr) {
        console.warn('Failed to update schedules:', scheduleErr);
      }
      
      // Refresh vehicles to show updated status
      await fetchVehicles();
      
      // Refresh active reports
      const refreshed = await axios.get(`${API_BASE_URL}/auth/reports/active`);
      setActiveReports(refreshed.data.reports);
      setShowDumpingSiteModal(false);
      setSelectedDumpingSite('');
      setSelectedReportId(null);
    } catch (err) {
      setMarkAllMessage(selectedReportId ? 'Failed to mark report as collected' : 'Failed to mark all as collected');
    } finally {
      setMarkAllLoading(false);
      setUpdatingReportId(null);
    }
  };

  // Fetch ML dispatch recommendation with polling
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchRecommendation = async () => {
      setMlLoading(true);
      setMlError('');
      try {
        // Use actual vehicle count instead of arbitrary number
        const availableVehicleCount = vehicles.filter(v => v.status === 'available' && !v.needs_refuel).length;
        const API_BASE_URL = environment.getApiUrl();
        const res = await axios.get(`${API_BASE_URL}/auth/dispatch/recommendation?trucks=${availableVehicleCount}`);
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
  }, [vehicles]); // Depend on vehicles instead of availableTrucks

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
      const API_BASE_URL = environment.getApiUrl();
      let res;
      if (detectionMethod === 'llm') {
        res = await axios.post(`${API_BASE_URL}/auth/detect-waste-llm`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDetectionResult({ 
          result: res.data.composition, 
          total_weight: 0, 
          annotated_image: res.data.annotated_image || '', // Now using the actual image from LLM
          raw: res.data.raw 
        });
      } else {
        res = await axios.post(`${API_BASE_URL}/auth/detect-waste-image`, formData, {
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
        type: 'success',
        title: 'Success!',
        message: 'Waste composition and weight updated successfully! Delivery created.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vehicle management functions
  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleFormData({
      id: '',
      type: 'compressed_truck',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      fuel_efficiency_kmpl: '',
      tank_capacity_liters: '',
      current_fuel_level: '',
      registration_number: '',
      driver_name: '',
      driver_contact: ''
    });
    setShowVehicleModal(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle.id);
    setVehicleFormData({
      id: vehicle.id,
      type: vehicle.type,
      make: (vehicle as any).make || '',
      model: (vehicle as any).model || '',
      year: (vehicle as any).year || new Date().getFullYear(),
      fuel_efficiency_kmpl: (vehicle as any).fuel_efficiency_kmpl?.toString() || '',
      tank_capacity_liters: (vehicle as any).tank_capacity_liters?.toString() || '',
      current_fuel_level: (vehicle as any).current_fuel_level?.toString() || '',
      registration_number: (vehicle as any).registration_number || '',
      driver_name: (vehicle as any).driver_name || '',
      driver_contact: (vehicle as any).driver_contact || ''
    });
    setShowVehicleModal(true);
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicleData = {
        ...vehicleFormData,
        fuel_efficiency_kmpl: parseFloat(vehicleFormData.fuel_efficiency_kmpl),
        tank_capacity_liters: parseFloat(vehicleFormData.tank_capacity_liters),
        current_fuel_level: parseFloat(vehicleFormData.current_fuel_level),
        status: 'available'
      };

      const API_BASE_URL = environment.getApiUrl();
      if (editingVehicle) {
        // Update existing vehicle
        await axios.put(`${API_BASE_URL}/fuel/vehicles/${editingVehicle}`, vehicleData);
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Vehicle updated successfully'
        });
      } else {
        // Add new vehicle
        await axios.post(`${API_BASE_URL}/fuel/vehicles`, vehicleData);
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Vehicle added successfully'
        });
      }

      setShowVehicleModal(false);
      await fetchVehicles(); // Refresh vehicle list
    } catch (error) {
      console.error('Vehicle operation failed:', error);
      let errorMessage = 'Failed to save vehicle information';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'No response from server. Check if backend is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      addToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setDeletingVehicle(vehicleId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingVehicle) return;
    
    try {
      const API_BASE_URL = environment.getApiUrl();
      await axios.delete(`${API_BASE_URL}/fuel/vehicles/${deletingVehicle}`);
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Vehicle deleted successfully'
      });
      setShowDeleteConfirm(false);
      setDeletingVehicle(null);
      await fetchVehicles(); // Refresh vehicle list
    } catch (error) {
      console.error('Vehicle deletion failed:', error);
      let errorMessage = 'Failed to delete vehicle';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'No response from server. Check if backend is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      addToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingVehicle(null);
  };

  // Configuration functions
  const handleAddDumpingSite = () => {
    setConfigData(prev => ({
      ...prev,
      dumpingSites: [
        ...prev.dumpingSites,
        { id: '', name: '', location: '', coordinates: { lat: '', lng: '' } }
      ]
    }));
  };

  const handleRemoveDumpingSite = (index: number) => {
    setConfigData(prev => ({
      ...prev,
      dumpingSites: prev.dumpingSites.filter((_, i) => i !== index)
    }));
  };

  const handleDumpingSiteChange = (index: number, field: string, value: string) => {
    setConfigData(prev => ({
      ...prev,
      dumpingSites: prev.dumpingSites.map((site, i) => 
        i === index 
          ? field.includes('.') 
            ? { ...site, coordinates: { ...site.coordinates, [field.split('.')[1]]: value } }
            : { ...site, [field]: value }
          : site
      )
    }));
  };

  const handleSaveConfiguration = async () => {
    try {
      // Map frontend structure to backend structure
      const backendConfig = {
        zone_customers: configData.zoneCustomers,
        dumping_sites: configData.dumpingSites,
        fuel_prices: {
          diesel: configData.fuelPricePerLiter,
          petrol: configData.fuelPricePerLiter + 2.5 // Petrol is typically more expensive
        }
      };
      
      // Save to backend API
      const API_BASE_URL = environment.getApiUrl();
      await axios.post(`${API_BASE_URL}/auth/config`, { config: backendConfig });
      
      // Also save to localStorage as backup
      localStorage.setItem('wastesense_config', JSON.stringify(configData));
      
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Configuration saved successfully'
      });
      setShowConfigModal(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save configuration'
      });
    }
  };

  // Load configuration on component mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Try to load from backend first
        const API_BASE_URL = environment.getApiUrl();
        const response = await axios.get(`${API_BASE_URL}/auth/config`);
        const backendConfig = response.data.config;
        
        // Map backend structure to frontend structure
        const mappedConfig = {
          dumpingSites: backendConfig.dumping_sites || configData.dumpingSites,
          zoneDistances: configData.zoneDistances, // Keep existing structure
          zoneCustomers: backendConfig.zone_customers || configData.zoneCustomers,
          fuelPricePerLiter: backendConfig.fuel_prices?.diesel || configData.fuelPricePerLiter
        };
        
        setConfigData(mappedConfig);
      } catch (error) {
        console.error('Failed to load configuration from backend:', error);
        
        // Fallback to localStorage
        const savedConfig = localStorage.getItem('wastesense_config');
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            setConfigData(config);
          } catch (parseError) {
            console.error('Failed to parse localStorage configuration:', parseError);
          }
        }
      }
    };

    loadConfiguration();
  }, []);

  // Fetch vehicles function
  const fetchVehicles = async () => {
    setVehiclesLoading(true);
    setVehiclesError('');
    try {
      const API_BASE_URL = environment.getApiUrl();
      const response = await axios.get(`${API_BASE_URL}/fuel/vehicles`);
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      setVehiclesError('Failed to load vehicles');
    } finally {
      setVehiclesLoading(false);
    }
  };

  // Fetch fuel analytics
  const fetchFuelAnalytics = async () => {
    setFuelAnalyticsLoading(true);
    try {
      const API_BASE_URL = environment.getApiUrl();
      const response = await axios.get(`${API_BASE_URL}/fuel/analytics?period=7`);
      setFuelAnalytics(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch fuel analytics:', error);
    } finally {
      setFuelAnalyticsLoading(false);
    }
  };

  // Load vehicles and fuel analytics on component mount
  useEffect(() => {
    fetchVehicles();
    fetchFuelAnalytics();
    
    // Refresh vehicles every 30 seconds to catch status updates
    const vehicleInterval = setInterval(fetchVehicles, 30000);
    
    return () => {
      clearInterval(vehicleInterval);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimationInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (dashboardRef.current) {
      observer.observe(dashboardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={dashboardRef}
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dispatcher Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Operations Management Center</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 transition-all duration-600 ease-out delay-200 ${
              animationInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'
            }`}>
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Route
              </button>
          <button 
            onClick={() => setShowConfigModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
          </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Zone Statistics */}
        <div className={`transition-all duration-600 ease-out delay-300 ${
          animationInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ablekuma North Zone Card */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out group ${
          animationInView ? 'opacity-100' : 'opacity-0'
        } transition-all duration-600 ease-out delay-400`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ablekuma North</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Zone Coverage</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reports</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {mlRecommendation?.reportCounts?.North ?? 0}/{configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145}
            </span>
              </div>
              
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(((mlRecommendation?.reportCounts?.North ?? 0) / (configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145)) * 100, 100)}%` }}
                />
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Customers: </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145}
            </span>
              </div>
              
              <div className={`text-sm font-medium ${
              (mlRecommendation?.reportCounts?.North ?? 0) >= (configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
              {(mlRecommendation?.reportCounts?.North ?? 0) >= (configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145)
                  ? `✅ Ready for dispatch${mlRecommendation?.allocation?.North ? ` (${mlRecommendation.allocation.North} trucks)` : ''}`
                  : (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {(configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145) - (mlRecommendation?.reportCounts?.North ?? 0)} more needed
            </span>
                    )}
          </div>
            </div>
          </div>
          
          {/* Ayawaso West Zone Card */}
        <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out group ${
          animationInView ? 'opacity-100' : 'opacity-0'
        } transition-all duration-600 ease-out delay-500`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ayawaso West</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Zone Coverage</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reports</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {mlRecommendation?.reportCounts?.South ?? 0}/{configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82}
            </span>
              </div>
              
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(((mlRecommendation?.reportCounts?.South ?? 0) / (configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82)) * 100, 100)}%` }}
                />
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Customers: </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82}
            </span>
              </div>
              
              <div className={`text-sm font-medium ${
              (mlRecommendation?.reportCounts?.South ?? 0) >= (configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
              {(mlRecommendation?.reportCounts?.South ?? 0) >= (configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82)
                  ? `✅ Ready for dispatch${mlRecommendation?.allocation?.South ? ` (${mlRecommendation.allocation.South} trucks)` : ''}`
                  : (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {(configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82) - (mlRecommendation?.reportCounts?.South ?? 0)} more needed
            </span>
                    )}
          </div>
            </div>
          </div>
          
          {/* Available Trucks Card */}
          <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out group ${
            animationInView ? 'opacity-100' : 'opacity-0'
          } transition-all duration-600 ease-out delay-600`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12l4 5v6h-3a2 2 0 11-4 0H9a2 2 0 11-4 0H2v-6l4-5z" />
                  <circle cx="7" cy="17" r="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  <circle cx="17" cy="17" r="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Trucks</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fleet Management</p>
          </div>
        </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {availableTrucks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ready for dispatch</div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-200/30 dark:border-indigo-700/30">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Automatically synced from Fleet Management
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Notifications & ML Recommendation */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-1000 delay-800 ${
          animationInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl transition-all duration-1000 delay-900 ${
            animationInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </h2>
              <button
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                onClick={handleToggleArchived}
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>
            
            {/* Fixed height scrollable container */}
            <div className="h-64 overflow-y-auto space-y-3">
              {showArchived && (
                <div className="pb-3 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
                    </svg>
                    Archived
                  </h3>
                  {archivedLoading ? (
                    <p className="text-gray-600 dark:text-gray-400">Loading archived notifications...</p>
                  ) : archivedError ? (
                    <p className="text-red-600">{archivedError}</p>
                  ) : archivedNotifications.length > 0 ? (
                    <ul className="space-y-2">
                      {archivedNotifications.map((n: any) => (
                        <li key={n.id} className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 shadow-sm">
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
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Recent
                </h3>
                )}
                {notificationsLoading ? (
                  <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
                ) : notificationsError ? (
                  <p className="text-red-600">{notificationsError}</p>
                ) : notifications.length > 0 ? (
                  <ul className="space-y-2">
                    {notifications.map((n: any) => (
                      <li key={n.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 border border-blue-200/30 dark:border-blue-700/30 shadow-sm">
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{n.title}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">{n.message}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{new Date(n.timestamp).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📭</div>
                  <p className="text-gray-600 dark:text-gray-400">No new notifications.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl transition-all duration-1000 delay-1000 ${
            animationInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🤖</span> Smart Collection Scheduler
            </h2>
            {mlLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading recommendation...</p>
              </div>
            ) : mlError ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              <p className="text-red-600">{mlError}</p>
              </div>
            ) : mlRecommendation ? (
              <div>
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/30 dark:border-blue-700/30 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Available Vehicles:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{mlRecommendation.availableVehicles}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{mlRecommendation.reason}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/30 dark:border-blue-700/30 shadow-sm">
                    <div className="font-semibold text-blue-700 dark:text-blue-400">Ablekuma North</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reports: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.reportCounts?.North ?? 0}</span></div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trucks Assigned: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.allocation?.North ?? 0}</span></div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/30 dark:border-green-700/30 shadow-sm">
                    <div className="font-semibold text-green-700 dark:text-green-400">Ayawaso West</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reports: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.reportCounts?.South ?? 0}</span></div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trucks Assigned: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.allocation?.South ?? 0}</span></div>
                  </div>
                </div>
                
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/30 dark:border-green-700/30 shadow-sm">
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">{mlRecommendation.recommendation}</div>
                </div>

                {/* Collection Schedules */}
                {mlRecommendation.schedules && mlRecommendation.schedules.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Scheduled Collections:
                </h3>
                    {mlRecommendation.schedules.map((schedule: any, index: number) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-800/80 rounded-xl border-l-4 border-blue-500 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">{schedule.zone}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Vehicle: <span className="font-medium">{schedule.vehicleInfo}</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Driver: <span className="font-medium">{schedule.driverName}</span>
                              {schedule.driverContact && (
                                <span className="ml-2">({schedule.driverContact})</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Fuel: {schedule.fuelLevel}%</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Est. Distance: {schedule.estimatedDistance}km</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Scheduled Start</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {new Date(schedule.scheduledStart).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Est. Completion</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {new Date(schedule.estimatedCompletion).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                            {schedule.reportsCount} reports
                          </span>
                          <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                            {schedule.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-gray-600 dark:text-gray-400">No recommendations available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Waste Detection Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📸</span> Image-based Waste Detection
          </h2>
          
          <div className="mb-6 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Detection Method:</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="detectionMethod"
                value="llm"
                checked={detectionMethod === 'llm'}
                onChange={() => setDetectionMethod('llm')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🤖 AI (LLM)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="detectionMethod"
                value="yolo"
                checked={detectionMethod === 'yolo'}
                onChange={() => setDetectionMethod('yolo')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                YOLOv8
              </span>
            </label>
          </div>
          
          <form onSubmit={handleWasteImageUpload} className="space-y-4">
            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Target Site for Analysis
              </label>
              <select
                value={selectedSiteForDetection}
                onChange={(e) => setSelectedSiteForDetection(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                required
              >
                <option value="">Select site for this waste image...</option>
                <option value="WS001">North Dumping Site (WS001)</option>
                <option value="WS002">South Dumping Site (WS002)</option>
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Waste Image
              </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleWasteImageChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
            </div>
            
            <button
              type="submit"
              disabled={!wasteImage || !selectedSiteForDetection || detectionLoading}
              className={`w-full px-6 py-3 rounded-xl font-medium transform transition-all duration-300 flex items-center justify-center gap-2 ${
                !wasteImage || !selectedSiteForDetection || detectionLoading
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              {detectionLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze Image
                </span>
              )}
            </button>
          </form>
          
          {detectionError && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-800 dark:text-red-200">{detectionError}</span>
              </div>
                    </div>
                  )}
          
          {detectionResult && (
            <div className="mt-6 space-y-6">
              {/* Detection Results Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/30 dark:border-green-700/30 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Detection Results
                </h3>

                {/* Weight Display */}
                {detectionResult.total_weight && (
                  <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Total Weight Detected
                      </h4>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {detectionResult.total_weight.toFixed(2)} kg
                    </p>
                  </div>
                )}

                {/* Composition Breakdown */}
                {detectionResult.result && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Composition Breakdown
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                            data={Object.entries(detectionResult.result)
                              .filter(([_, value]) => value > 0)
                              .map(([name, value]) => ({
                                name: name.charAt(0).toUpperCase() + name.slice(1),
                                value: Number(value),
                                color: WASTE_COLORS[name] || '#8884d8'
                              }))}
                      cx="50%"
                      cy="50%"
                            outerRadius={80}
                            dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                            {Object.entries(detectionResult.result)
                              .filter(([_, value]) => value > 0)
                              .map(([name, _], index) => (
                                <Cell key={index} fill={WASTE_COLORS[name] || '#8884d8'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

                    {/* Composition Details */}
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Detailed Breakdown
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(detectionResult.result)
                          .filter(([_, value]) => value > 0)
                          .sort(([, a], [, b]) => Number(b) - Number(a))
                          .map(([type, percentage]) => (
                            <div key={type} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: WASTE_COLORS[type] || '#8884d8' }}
                                ></div>
                                <span className="capitalize text-gray-700 dark:text-gray-300">
                                  {type}
                                </span>
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {Number(percentage)}%
                              </span>
                            </div>
                          ))}
                    </div>
                    </div>
                </div>
              )}

                {/* Annotated Image */}
                  {detectionResult.annotated_image && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      AI Annotated Detection Image
                    </h4>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                      <img
                        src={`data:image/jpeg;base64,${detectionResult.annotated_image}`}
                        alt="AI Waste Detection Results"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                    </div>
                  )}

                {/* Manual Weight Input Section */}
                <div className="mt-6 p-4 bg-blue-50/60 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Manual Weight Adjustment
                  </h4>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Override Total Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={manualTotalWeight}
                        onChange={(e) => setManualTotalWeight(e.target.value)}
                        placeholder="Enter manual weight..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      />
              </div>
              <button
                onClick={handleConfirmDetection}
                      disabled={!selectedSiteForDetection}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm & Update Site
              </button>
                  </div>
                </div>
              </div>
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

        {/* Vehicle Management Section */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fleet Management</h2>
            <button
              onClick={handleAddVehicle}
              className="btn btn-primary btn-sm"
            >
              Add Vehicle
            </button>
          </div>

          {vehiclesLoading ? (
            <div className="text-center py-4">Loading vehicles...</div>
          ) : vehiclesError ? (
            <div className="text-red-600 text-center py-4">{vehiclesError}</div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No vehicles registered yet</p>
              <button
                onClick={handleAddVehicle}
                className="btn btn-primary"
              >
                Register First Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{vehicle.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {(vehicle as any).make} {(vehicle as any).model} ({(vehicle as any).year})
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditVehicle(vehicle)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Vehicle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`font-medium ${
                        vehicle.status === 'available' ? 'text-green-600 dark:text-green-400' :
                        vehicle.status === 'scheduled' ? 'text-yellow-600 dark:text-yellow-400' :
                        vehicle.status === 'in-transit' ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {vehicle.status === 'available' ? 'Available' :
                         vehicle.status === 'scheduled' ? 'Scheduled' :
                         vehicle.status === 'in-transit' ? 'In Transit to Site' :
                         vehicle.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fuel:</span>
                      <span className="text-gray-900 dark:text-white">
                        {(vehicle as any).fuel_percentage || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Driver:</span>
                      <span className="text-gray-900 dark:text-white">
                        {(vehicle as any).driver_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  {vehicles.filter(v => v.status === 'available' || v.status === 'scheduled' || v.status === 'in-transit').map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.id} - {vehicle.make} {vehicle.model} ({Math.round(vehicle.fuel_percentage)}% fuel, {vehicle.status})
                    </option>
                  ))}
                  {vehicles.filter(v => v.status === 'available' || v.status === 'scheduled' || v.status === 'in-transit').length === 0 && (
                    <option value="">No vehicles available</option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDumpingSiteModal(false);
                  setSelectedReportId(null);
                  setSelectedDumpingSite('');
                }}
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

      {/* Vehicle Management Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle ID *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.id}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g., ZL001, ZL002"
                    required
                    disabled={!!editingVehicle}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Number *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.registration_number}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                    placeholder="e.g., GR 1234-20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Type *</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.type}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="compressed_truck">Compressed Garbage Truck</option>
                    <option value="rear_loader">Rear Loader</option>
                    <option value="side_loader">Side Loader</option>
                    <option value="front_loader">Front Loader</option>
                    <option value="roll_off">Roll-off Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Make *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.make}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="e.g., SINOTRUK, Dongfeng, Zoomlion"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model *</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.model}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., HOWO, DFL1160"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year *</label>
                  <input
                    type="number"
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.year}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fuel Efficiency (km/L) *
                    <span className="text-xs text-gray-500 block">Typical: 3-6 km/L for garbage trucks</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="15"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.fuel_efficiency_kmpl}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, fuel_efficiency_kmpl: e.target.value }))}
                    placeholder="e.g., 4.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tank Capacity (Liters) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="500"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.tank_capacity_liters}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, tank_capacity_liters: e.target.value }))}
                    placeholder="e.g., 200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Fuel Level (Liters) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.current_fuel_level}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, current_fuel_level: e.target.value }))}
                    placeholder="e.g., 150"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.driver_name}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, driver_name: e.target.value }))}
                    placeholder="e.g., Kwame Asante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Contact</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={vehicleFormData.driver_contact}
                    onChange={e => setVehicleFormData(prev => ({ ...prev, driver_contact: e.target.value }))}
                    placeholder="e.g., +233 24 123 4567"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              System Configuration
            </h3>
            
            <div className="space-y-8">
              {/* Dumping Sites Configuration */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Dumping Sites</h4>
                  <button
                    onClick={handleAddDumpingSite}
                    className="btn btn-primary btn-sm"
                  >
                    Add Site
                  </button>
                </div>
                
                <div className="space-y-4">
                  {configData.dumpingSites.map((site, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Site {index + 1}</h5>
                        {configData.dumpingSites.length > 1 && (
                          <button
                            onClick={() => handleRemoveDumpingSite(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site ID *</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={site.id}
                            onChange={e => handleDumpingSiteChange(index, 'id', e.target.value)}
                            placeholder="e.g., BORTEYMAN"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site Name *</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={site.name}
                            onChange={e => handleDumpingSiteChange(index, 'name', e.target.value)}
                            placeholder="e.g., Borteyman Landfill Site"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location *</label>
                          <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={site.location}
                            onChange={e => handleDumpingSiteChange(index, 'location', e.target.value)}
                            placeholder="e.g., Tema, Greater Accra"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={site.coordinates.lat}
                            onChange={e => handleDumpingSiteChange(index, 'coordinates.lat', e.target.value)}
                            placeholder="e.g., 5.7167"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={site.coordinates.lng}
                            onChange={e => handleDumpingSiteChange(index, 'coordinates.lng', e.target.value)}
                            placeholder="e.g., -0.0167"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone Distances Configuration */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Zone to Dumping Site Distances (km)</h4>
                <div className="space-y-4">
                  {Object.keys(configData.zoneDistances).map(zone => (
                    <div key={zone} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">{zone}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {configData.dumpingSites.filter(site => site.id).map(site => (
                          <div key={site.id}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Distance to {site.name} (km) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={(configData.zoneDistances as any)[zone][site.id] || ''}
                              onChange={e => setConfigData(prev => ({
                                ...prev,
                                zoneDistances: {
                                  ...prev.zoneDistances,
                                  [zone]: {
                                    ...prev.zoneDistances[zone as keyof typeof prev.zoneDistances],
                                    [site.id]: parseFloat(e.target.value) || 0
                                  }
                                }
                              }))}
                              placeholder="e.g., 12.5"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone Customer Management */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Zone Customer Management</h4>
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-4">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h5>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Set the number of customers Zoomlion serves in each zone. 
                    When all customers in a zone report bins full, trucks will be dispatched to that zone.
                    <br />
                    <strong>Example:</strong> If you serve 145 customers and 87 have reported, you need 58 more reports to reach the threshold.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setConfigData(prev => ({
                        ...prev,
                        zoneCustomers: {
                          'Ablekuma North': { totalCustomers: 200 },
                          'Ayawaso West': { totalCustomers: 120 }
                        }
                      }))}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Large Scale
                    </button>
                    <button
                      onClick={() => setConfigData(prev => ({
                        ...prev,
                        zoneCustomers: {
                          'Ablekuma North': { totalCustomers: 50 },
                          'Ayawaso West': { totalCustomers: 30 }
                        }
                      }))}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Small Scale
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(configData.zoneCustomers).map(([zone, config]) => (
                    <div key={zone} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">{zone}</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total Customers Served *
                          </label>
                          <input
                            type="number"
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={config.totalCustomers}
                            onChange={e => setConfigData(prev => ({
                              ...prev,
                              zoneCustomers: {
                                ...prev.zoneCustomers,
                                [zone]: {
                                  totalCustomers: parseInt(e.target.value) || 1
                                }
                              }
                            }))}
                            placeholder="e.g., 145"
                          />
                          <small className="text-xs text-gray-500 dark:text-gray-400">
                            Number of customers Zoomlion serves in {zone}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fuel Price Configuration */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Fuel Price</h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Fuel Price (₵ per liter) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={configData.fuelPricePerLiter}
                      onChange={e => setConfigData(prev => ({
                        ...prev,
                        fuelPricePerLiter: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="e.g., 10.50"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This will be used for automatic fuel cost calculations
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfiguration}
                className="btn btn-primary"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Vehicle Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Vehicle Deletion
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete vehicle <strong>{deletingVehicle}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Vehicle
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
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
    </div>
  );
} 