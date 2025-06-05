import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useNotifications } from '../../hooks/useNotifications';
import { WasteSite } from '../../types';
import { api } from '../../api/mockApi';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface Delivery {
  id: string;
  truckId: string;
  estimatedArrival: string;
  status: 'pending' | 'in-transit' | 'completed';
  weight: number;
  composition: {
    plastic: number;
    paper: number;
    glass: number;
    metal: number;
    organic: number;
  };
}

interface WasteUpdateNotification {
  id: string;
  siteId: string;
  siteName: string;
  timestamp: string;
  isRead: boolean;
}

// Mock data for demonstration
const mockDeliveries: Delivery[] = [
  {
    id: 'D001',
    truckId: 'T001',
    estimatedArrival: '2024-03-20T14:30:00Z',
    status: 'in-transit',
    weight: 500,
    composition: {
      plastic: 30,
      paper: 25,
      glass: 15,
      metal: 20,
      organic: 10,
    },
  },
  {
    id: 'D002',
    truckId: 'T003',
    estimatedArrival: '2024-03-20T16:00:00Z',
    status: 'pending',
    weight: 450,
    composition: {
      plastic: 35,
      paper: 20,
      glass: 20,
      metal: 15,
      organic: 10,
    },
  },
];

const WASTE_COLORS: Record<string, string> = {
  plastic: '#2563eb', // blue
  metal: '#6b7280',   // gray
  organic: '#22c55e', // green
  paper: '#eab308',   // yellow
  glass: '#10b981',   // teal
};

export default function RecyclerDashboard() {
  const { user } = useAuth();
  const { sites, loading: sitesLoading, error: sitesError } = useWasteSites();
  const { 
    unreadNotifications, 
    markAsRead,
    loading: notificationsLoading 
  } = useNotifications();
  const [selectedSite, setSelectedSite] = useState<WasteSite | null>(null);
  const [hasCreatedTestNotification, setHasCreatedTestNotification] = useState(false);
  const navigate = useNavigate();
  const [forecast, setForecast] = useState<any>(null);
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; district?: string }>({ open: false });
  const [details, setDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Set initial selected site when data loads
  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0]);
    }
  }, [sites, selectedSite]);

  // Create a test notification only once
  useEffect(() => {
    const createTestNotification = async () => {
      if (hasCreatedTestNotification) return;
      
      try {
        await api.notifications.create({
          type: 'info',
          title: 'New Waste Composition Update',
          message: 'Waste composition updated at North Dumping Site',
          forRole: 'recycler',
          metadata: {
            siteId: 'WS001',
            updateType: 'composition'
          }
        });
        setHasCreatedTestNotification(true);
      } catch (error) {
        console.error('Failed to create test notification:', error);
      }
    };

    createTestNotification();
  }, [hasCreatedTestNotification]);

  useEffect(() => {
    axios.get('/api/forecast/next-day').then(res => setForecast(res.data));
  }, []);

  const totalProcessed = 1250; // kg
  const recyclingRate = 85; // %
  const energySaved = 750; // kWh

  const handleSiteSelect = (site: WasteSite) => {
    setSelectedSite(site);
    // Mark related notifications as read
    const relatedNotifications = unreadNotifications.filter(
      n => n.metadata?.siteId === site.id
    );
    relatedNotifications.forEach(n => markAsRead(n.id));
  };

  const handleNotificationClick = (notificationId: string, siteId?: string) => {
    if (siteId) {
      navigate(`/recycler/sites/${siteId}`);
    }
  };

  const handleBarClick = (district: string) => {
    setLoadingDetails(true);
    // For demo, use today's date (synthetic data is for past days, but forecast is for tomorrow)
    // In real use, would use the forecasted date
    axios.get('/api/forecast/history', { params: { district } })
      .then(res => {
        setDetails(res.data.slice(-1)); // last day
        setDetailsModal({ open: true, district });
      })
      .finally(() => setLoadingDetails(false));
  };

  if (sitesLoading || notificationsLoading) {
    return <div className="text-center py-4">Loading dashboard data...</div>;
  }

  if (sitesError) {
    return <div className="text-red-600 text-center py-4">{sitesError}</div>;
  }

  const wasteUpdateNotifications = unreadNotifications.filter(
    n => n.metadata?.updateType === 'composition'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Recycling Facility Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <Link
            to="/recycler/notifications"
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <span>Notifications</span>
            {wasteUpdateNotifications.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {wasteUpdateNotifications.length}
              </span>
            )}
          </Link>
          <div className="text-sm text-gray-600">
            Facility: {user?.facility || 'Not assigned'}
          </div>
        </div>
      </div>

      {forecast && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Forecast for Tomorrow</h2>
          <p className="mb-4 text-gray-700">
            Tomorrow's waste: <span className="font-semibold">{forecast.total_waste_tonnes.toFixed(1)} tonnes</span> from Ablekuma North and Ayawaso West. <br />
            Composition: {Object.entries(forecast.composition_percent).map(([type, percent]) => `${percent}% ${type}`).join(', ')}
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={forecast.districts.map((d: any) => ({
              name: d.district,
              ...d.composition_percent
            }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip />
              <Legend />
              {Object.keys(WASTE_COLORS).map(type => (
                <Bar key={type} dataKey={type} stackId="a" fill={WASTE_COLORS[type]} onClick={(_, idx) => handleBarClick(forecast.districts[idx].district)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:space-x-8">
            <div className="flex-1">
              <PieChart width={220} height={180}>
                <Pie
                  data={Object.entries(forecast.composition_percent).map(([type, percent]) => ({ name: type, value: percent }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.keys(WASTE_COLORS).map((type, idx) => (
                    <Cell key={type} fill={WASTE_COLORS[type]} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 text-gray-600 text-sm">
              <ul>
                {forecast.districts.map((d: any) => (
                  <li key={d.district} className="mb-1">
                    <span className="font-semibold text-gray-900">{d.district}:</span> {d.total_waste_tonnes.toFixed(1)} tonnes. Composition: {Object.entries(d.composition_percent).map(([type, percent]) => `${percent}% ${type}`).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Preview */}
      {wasteUpdateNotifications.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium text-blue-900">New Waste Updates</h2>
            <Link
              to="/recycler/notifications"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {wasteUpdateNotifications.slice(0, 3).map(notification => (
              <div 
                key={notification.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationClick(notification.id, notification.metadata?.siteId)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details →
                </button>
              </div>
            ))}
            {wasteUpdateNotifications.length > 3 && (
              <p className="text-sm text-blue-600 text-center">
                +{wasteUpdateNotifications.length - 3} more updates
              </p>
            )}
          </div>
        </div>
      )}

      {/* Waste Site Composition */}
      {selectedSite && (
        <div className={`bg-white shadow rounded-lg p-6 ${
          wasteUpdateNotifications.some(n => n.metadata?.siteId === selectedSite.id)
            ? 'ring-2 ring-blue-500'
            : ''
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Waste Site Composition</h2>
            <select 
              className="form-select"
              value={selectedSite.id}
              onChange={(e) => {
                const site = sites.find(s => s.id === e.target.value);
                if (site) handleSiteSelect(site);
              }}
            >
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                  {wasteUpdateNotifications.some(n => n.metadata?.siteId === site.id) ? ' (New Update)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{selectedSite.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Capacity</p>
              <p className="font-medium">{selectedSite.currentCapacity} / {selectedSite.maxCapacity} tons</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900">Current Waste Composition</h3>
            <p className="text-sm text-gray-500">
              Last updated: {new Date(selectedSite.lastUpdated || '').toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-4">
            {Object.entries(selectedSite.composition).map(([type, percentage]) => (
              <div key={type} className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                  <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      type === 'plastic' ? 'bg-blue-600' :
                      type === 'paper' ? 'bg-yellow-600' :
                      type === 'glass' ? 'bg-green-600' :
                      type === 'metal' ? 'bg-gray-600' :
                      'bg-brown-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-green-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Total Processed Today
          </h3>
          <p className="text-3xl font-bold text-green-600">{totalProcessed} kg</p>
        </div>
        <div className="card bg-blue-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Recycling Rate
          </h3>
          <p className="text-3xl font-bold text-blue-600">{recyclingRate}%</p>
        </div>
        <div className="card bg-purple-50">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Energy Saved</h3>
          <p className="text-3xl font-bold text-purple-600">{energySaved} kWh</p>
        </div>
      </div>

      {/* Incoming Deliveries */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Incoming Deliveries
        </h2>
        <div className="space-y-4">
          {mockDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  Delivery {delivery.id}
                </p>
                <p className="text-sm text-gray-600">
                  Truck: {delivery.truckId}
                </p>
                <p className="text-sm text-gray-600">
                  ETA:{' '}
                  {new Date(delivery.estimatedArrival).toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-600">
                  Weight: {delivery.weight} kg
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    delivery.status === 'in-transit'
                      ? 'bg-blue-100 text-blue-800'
                      : delivery.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {delivery.status}
                </span>
                <button className="btn btn-secondary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waste Composition Chart */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Today's Waste Composition
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(mockDeliveries[0].composition).map(([type, value]) => (
            <div key={type} className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {type}
              </p>
              <p className="text-xs text-gray-600">{value}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="card bg-green-50">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Environmental Impact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">2.5</p>
            <p className="text-sm text-gray-600">Tons CO₂ Avoided</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">1,200</p>
            <p className="text-sm text-gray-600">Trees Saved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">45,000</p>
            <p className="text-sm text-gray-600">Liters Water Saved</p>
          </div>
        </div>
      </div>
    </div>
  );
} 