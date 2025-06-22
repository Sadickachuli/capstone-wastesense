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
  textile: '#a21caf', // purple
  other: '#f43f5e',   // pink/red
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
  const [annotatedImages, setAnnotatedImages] = useState<Record<string, string>>({});
  const [siteCompositions, setSiteCompositions] = useState<Record<string, any>>({});
  const [siteImages, setSiteImages] = useState<Record<string, string>>({});
  const [allSitesImage, setAllSitesImage] = useState<string | null>(null);

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

  // Fetch annotated images for each site on mount or when sites change
  useEffect(() => {
    async function fetchAnnotatedImages() {
      const images: Record<string, string> = {};
      for (const site of sites) {
        try {
          const res = await axios.get(`/api/auth/waste-compositions/history?site_id=${site.id}`);
          if (res.data.history && res.data.history[0] && res.data.history[0].annotated_image) {
            images[site.id] = res.data.history[0].annotated_image;
          }
        } catch {}
      }
      setAnnotatedImages(images);
    }
    if (sites.length > 0) fetchAnnotatedImages();
  }, [sites]);

  // Fetch latest composition and image for each site from backend
  useEffect(() => {
    async function fetchCompositions() {
      const compositions: Record<string, any> = {};
      const images: Record<string, string> = {};
      let latestImage: { date: string, img: string } | null = null;
      for (const site of sites) {
        try {
          const res = await axios.get(`/api/auth/waste-compositions/history?site_id=${site.id}`);
          if (res.data.history && res.data.history.length > 0) {
            const latest = res.data.history[0];
            compositions[site.id] = latest;
            if (latest.annotated_image) {
              images[site.id] = latest.annotated_image;
              if (!latestImage || latest.date > latestImage.date) {
                latestImage = { date: latest.date, img: latest.annotated_image };
              }
            }
          }
        } catch {}
      }
      setSiteCompositions(compositions);
      setSiteImages(images);
      setAllSitesImage(latestImage ? latestImage.img : null);
    }
    if (sites.length > 0) fetchCompositions();
  }, [sites]);

  const totalProcessed = 1250; // kg
  const recyclingRate = 85; // %
  const energySaved = 750; // kWh

  // Utility to get all present types from backend data
  function getAllTypes(siteCompositions: Record<string, any>) {
    const types = new Set<string>();
    Object.values(siteCompositions).forEach(comp => {
      if (comp) {
        Object.keys(comp).forEach(key => {
          if (key.endsWith('_percent')) {
            types.add(key.replace('_percent', ''));
          }
        });
      }
    });
    return Array.from(types);
  }

  const allTypes = getAllTypes(siteCompositions);

  // Aggregate total composition from backend data (all types)
  let totalWeight = 0;
  const totalComposition: Record<string, number> = {};
  sites.forEach(site => {
    const comp = siteCompositions[site.id];
    if (comp) {
      const siteWeight = comp.current_capacity || 0;
      totalWeight += siteWeight;
      allTypes.forEach(type => {
        const percent = comp[`${type}_percent`] ?? 0;
        totalComposition[type] = (totalComposition[type] || 0) + (Number(percent) / 100) * siteWeight;
      });
    }
  });
  let aggregateComposition: Record<string, number> = {};
  if (totalWeight > 0) {
    allTypes.forEach(type => {
      aggregateComposition[type] = Math.round(((totalComposition[type] || 0) / totalWeight) * 100);
    });
  }
  // Get North and South sites from backend data
  const northSite = sites.find(s => s.name.toLowerCase().includes('north'));
  const southSite = sites.find(s => s.name.toLowerCase().includes('south'));
  const northComp = northSite ? siteCompositions[northSite.id] : null;
  const southComp = southSite ? siteCompositions[southSite.id] : null;

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
    <div className="space-y-8 max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Recycling Facility Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 dark:from-green-700 dark:to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
          </span>
        </div>
      </div>
      {/* Aggregate Pie Chart */}
      <div className="card bg-white shadow mb-6 dark:shadow-white">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Total Waste Composition (All Sites)</h2>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
          <div className="flex-1 min-w-[220px] p-8">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={allTypes.map(type => ({ name: type, value: aggregateComposition[type] || 0 }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {allTypes.map((type) => (
                    <Cell key={type} fill={WASTE_COLORS[type] || '#8884d8'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {allSitesImage && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">Latest Annotated Image (All Sites):</h4>
                <img
                  src={`data:image/jpeg;base64,${allSitesImage}`}
                  alt="Annotated waste detection"
                  className="w-full max-w-md border rounded shadow"
                  style={{ maxHeight: 400, objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
          <div className="flex-1 text-gray-600 text-sm">
            <div className="mb-2">
              <span className="font-semibold text-gray-900">
                {totalWeight ? `${totalWeight} kg` : ''} of waste was generated across all sites
              </span>
            </div>
            <ul>
              {allTypes.map((type) => (
                <li key={type} className="mb-1">
                  <span className="font-semibold text-gray-900 capitalize">{type}:</span> {aggregateComposition[type]}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Per-Site Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {northSite && northComp && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">North Dumping Site Composition</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={allTypes.map(type => ({ type, percent: northComp[`${type}_percent`] ?? 0 }))}>
                <XAxis dataKey="type" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip />
                {allTypes.map(type => (
                  <Bar key={type} dataKey={d => d.type === type ? d.percent : 0} name={type} fill={WASTE_COLORS[type] || '#8884d8'} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {siteImages[northSite.id] && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">Latest Annotated Image:</h4>
                <img
                  src={`data:image/jpeg;base64,${siteImages[northSite.id]}`}
                  alt="Annotated waste detection"
                  className="w-full max-w-md border rounded shadow"
                  style={{ maxHeight: 400, objectFit: 'contain' }}
                />
              </div>
            )}
            <div className="mt-2 text-gray-600 text-sm">
              <span className="font-semibold text-gray-900">{Math.round(northComp.current_capacity)} kg</span> of waste{' '}
              {(() => {
                if (!northSite.lastUpdated) return '';
                const last = new Date(northSite.lastUpdated);
                const now = new Date();
                const isToday = last.toDateString() === now.toDateString();
                return isToday
                  ? 'today'
                  : `last updated on ${last.toLocaleDateString()} at ${last.toLocaleTimeString()}`;
              })()}
            </div>
          </div>
        )}
        {southSite && southComp && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">South Dumping Site Composition</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={allTypes.map(type => ({ type, percent: southComp[`${type}_percent`] ?? 0 }))}>
                <XAxis dataKey="type" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip />
                {allTypes.map(type => (
                  <Bar key={type} dataKey={d => d.type === type ? d.percent : 0} name={type} fill={WASTE_COLORS[type] || '#8884d8'} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {siteImages[southSite.id] && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">Latest Annotated Image:</h4>
                <img
                  src={`data:image/jpeg;base64,${siteImages[southSite.id]}`}
                  alt="Annotated waste detection"
                  className="w-full max-w-md border rounded shadow"
                  style={{ maxHeight: 400, objectFit: 'contain' }}
                />
              </div>
            )}
            <div className="mt-2 text-gray-600 text-sm">
              <span className="font-semibold text-gray-900">{Math.round(southComp.current_capacity)} kg</span> of waste{' '}
              {(() => {
                if (!southSite.lastUpdated) return '';
                const last = new Date(southSite.lastUpdated);
                const now = new Date();
                const isToday = last.toDateString() === now.toDateString();
                return isToday
                  ? 'today'
                  : `last updated on ${last.toLocaleDateString()} at ${last.toLocaleTimeString()}`;
              })()}
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] flex flex-col items-center">
          <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">Total Processed Today</h3>
          <p className="text-3xl font-extrabold text-green-600 dark:text-green-300">{Math.round(totalWeight)} kg</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] flex flex-col items-center">
          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">Recycling Rate</h3>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-300">{Math.round(recyclingRate)}%</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] flex flex-col items-center">
          <h3 className="text-lg font-bold text-purple-800 dark:text-purple-300 mb-2">Energy Saved</h3>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-300">{Math.round(energySaved)} kWh</p>
        </div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] mb-8">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2"><span>🚚</span> Incoming Deliveries</h2>
        <div className="space-y-4">
          {mockDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="flex justify-between items-center p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 shadow-none border border-gray-100 dark:border-gray-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Delivery {delivery.id}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Truck: {delivery.truckId}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">ETA: {new Date(delivery.estimatedArrival).toLocaleTimeString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Weight: {Math.round(delivery.weight)} kg</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  delivery.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : delivery.status === 'in-transit'
                    ? 'bg-yellow-100 text-black dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-blue-100 text-black dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  {delivery.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
                <button className="px-4 py-2 rounded-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold shadow-md hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Environmental Impact */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Environmental Impact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-300">2.5</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Tons CO₂ Avoided</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-300">1,200</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Trees Saved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-300">45,000</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Liters Water Saved</p>
          </div>
        </div>
      </div>
    </div>
  );
} 