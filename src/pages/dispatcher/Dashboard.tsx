import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
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
        type: 'error',
        title: 'Update Failed',
        message: `Failed to update waste site: ${error instanceof Error ? error.message : 'Unknown error'}`
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

  return (
    <div className="min-h-screen bg-gray-50 p-0 md:p-0 font-sans">
      {/* Topbar (optional, for user info/notifications) */}
      <div className="flex justify-between items-center px-4 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Dispatcher Dashboard</h1>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-base">Create New Route</button>
          <button 
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 rounded bg-gray-600 text-white font-semibold shadow hover:bg-gray-700 transition text-base"
          >
            Configure System
          </button>
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
              Reports: {mlRecommendation?.reportCounts?.North ?? 0}/{configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145}
            </span>
            <span className="text-base text-gray-700 dark:text-gray-200">
              Customers Served: {configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145}
            </span>
            <span className={
              (mlRecommendation?.reportCounts?.North ?? 0) >= (configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145)
                ? 'text-green-700 dark:text-green-300 font-semibold'
                : 'text-yellow-700 dark:text-yellow-300 font-semibold'
            }>
              {(mlRecommendation?.reportCounts?.North ?? 0) >= (configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145)
                ? `✓ Threshold reached - Dispatch trucks${mlRecommendation?.allocation?.North ? ` (${mlRecommendation.allocation.North} trucks)` : ''}`
                : `${(configData.zoneCustomers['Ablekuma North']?.totalCustomers ?? 145) - (mlRecommendation?.reportCounts?.North ?? 0)} more reports needed`}
            </span>
          </div>
          {/* Ayawaso West Zone Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-3xl p-8 shadow flex flex-col gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-300 mb-1">Ayawaso West</span>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
              Reports: {mlRecommendation?.reportCounts?.South ?? 0}/{configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82}
            </span>
            <span className="text-base text-gray-700 dark:text-gray-200">
              Customers Served: {configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82}
            </span>
            <span className={
              (mlRecommendation?.reportCounts?.South ?? 0) >= (configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82)
                ? 'text-green-700 dark:text-green-300 font-semibold'
                : 'text-yellow-700 dark:text-yellow-300 font-semibold'
            }>
              {(mlRecommendation?.reportCounts?.South ?? 0) >= (configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82)
                ? `✓ Threshold reached - Dispatch trucks${mlRecommendation?.allocation?.South ? ` (${mlRecommendation.allocation.South} trucks)` : ''}`
                : `${(configData.zoneCustomers['Ayawaso West']?.totalCustomers ?? 82) - (mlRecommendation?.reportCounts?.South ?? 0)} more reports needed`}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Collection Scheduler</h2>
            {mlLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading recommendation...</p>
            ) : mlError ? (
              <p className="text-red-600">{mlError}</p>
            ) : mlRecommendation ? (
              <div>
                <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Available Vehicles:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{mlRecommendation.availableVehicles}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{mlRecommendation.reason}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="font-semibold text-blue-700 dark:text-blue-400">Ablekuma North</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reports: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.reportCounts?.North ?? 0}</span></div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trucks Assigned: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.allocation?.North ?? 0}</span></div>
                  </div>
                  <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
                    <div className="font-semibold text-green-700 dark:text-green-400">Ayawaso West</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reports: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.reportCounts?.South ?? 0}</span></div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trucks Assigned: <span className="font-bold text-gray-900 dark:text-white">{mlRecommendation.allocation?.South ?? 0}</span></div>
                  </div>
                </div>
                
                <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">{mlRecommendation.recommendation}</div>
                </div>

                {/* Collection Schedules */}
                {mlRecommendation.schedules && mlRecommendation.schedules.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Scheduled Collections:</h3>
                    {mlRecommendation.schedules.map((schedule: any, index: number) => (
                      <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 border-blue-500">
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
                      data={Object.entries(detectionResult.result).map(([type, percent]) => ({ name: type, value: percent as number }))}
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
                        <span>{percent as number}%</span>
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
                        <span>{percent as number}%</span>
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
  );
} 