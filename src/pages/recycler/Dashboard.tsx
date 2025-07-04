import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useNotifications } from '../../hooks/useNotifications';
import { WasteSite } from '../../types';
import { api } from '../../api/mockApi';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';
const ML_SERVICE_URL = (import.meta as any).env.VITE_ML_SERVICE_URL || 'http://localhost:8000';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTheme } from '../../context/ThemeContext';

interface WasteUpdateNotification {
  id: string;
  siteId: string;
  siteName: string;
  timestamp: string;
  isRead: boolean;
}

// Mock data for demonstration
const WASTE_COLORS: Record<string, string> = {
  plastic: '#2563eb', // blue
  metal: '#6b7280',   // gray
  organic: '#22c55e', // green
  paper: '#eab308',   // yellow
  glass: '#10b981',   // teal
  textile: '#a21caf', // purple
  other: '#f43f5e',   // pink/red
};

// Environmental impact calculation factors (based on EPA and recycling industry data)
const ENVIRONMENTAL_FACTORS = {
  // CO₂ emissions avoided (kg CO₂ per kg material recycled)
  co2Avoided: {
    paper: 3.3,     // Saves tree harvesting, pulping energy
    plastic: 2.0,   // Avoids oil extraction, manufacturing
    glass: 0.5,     // Energy savings from melting recycled vs raw materials
    metal: 6.0,     // Aluminum/steel recycling hugely energy-efficient
    organic: 0.3,   // Composting vs methane from landfills
    textile: 1.8,   // Textile manufacturing energy savings
    other: 1.0      // Average estimate
  },
  // Water savings (liters per kg recycled)
  waterSaved: {
    paper: 60,      // Paper production is water-intensive
    plastic: 40,    // Oil refining and plastic production
    glass: 20,      // Glass manufacturing process
    metal: 95,      // Metal extraction and processing
    organic: 5,     // Minimal water impact
    textile: 70,    // Textile dyeing and processing
    other: 30       // Average estimate
  },
  // Trees saved (trees per kg recycled) - mainly for paper
  treesSaved: {
    paper: 0.024,   // 1 tree ≈ 42kg paper
    other: 0.002    // Indirect benefits for other materials
  }
};

// Calculate environmental impact based on actual waste composition and weight
const calculateEnvironmentalImpact = (compositions: Record<string, any>) => {
  let totalCO2Avoided = 0;
  let totalWaterSaved = 0;
  let totalTreesSaved = 0;

  Object.values(compositions).forEach((comp: any) => {
    if (!comp) return;
    
    const weight = comp.current_capacity || 0;
    
    // Calculate impact for each waste type
    Object.keys(ENVIRONMENTAL_FACTORS.co2Avoided).forEach(type => {
      const percentage = comp[`${type}_percent`] || 0;
      const typeWeight = (weight * percentage) / 100;
      
      // CO₂ avoided
      totalCO2Avoided += typeWeight * ENVIRONMENTAL_FACTORS.co2Avoided[type as keyof typeof ENVIRONMENTAL_FACTORS.co2Avoided];
      
      // Water saved
      totalWaterSaved += typeWeight * ENVIRONMENTAL_FACTORS.waterSaved[type as keyof typeof ENVIRONMENTAL_FACTORS.waterSaved];
      
      // Trees saved (mainly paper, small contribution from others)
      if (type === 'paper') {
        totalTreesSaved += typeWeight * ENVIRONMENTAL_FACTORS.treesSaved.paper;
      } else {
        totalTreesSaved += typeWeight * ENVIRONMENTAL_FACTORS.treesSaved.other;
      }
    });
  });

  return {
    co2Avoided: totalCO2Avoided / 1000, // Convert to tons
    waterSaved: totalWaterSaved,
    treesSaved: Math.round(totalTreesSaved)
  };
};

// Calculate recycling rate based on actual composition (excluding organic waste)
const calculateRecyclingRate = (compositions: Record<string, any>) => {
  let totalWeight = 0;
  let recyclableWeight = 0;
  
  Object.values(compositions).forEach((comp: any) => {
    if (!comp) return;
    
    const weight = comp.current_capacity || 0;
    totalWeight += weight;
    
    // Calculate recyclable materials (excluding organic which goes to composting)
    const recyclableTypes = ['plastic', 'paper', 'glass', 'metal', 'textile'];
    recyclableTypes.forEach(type => {
      const percentage = comp[`${type}_percent`] || 0;
      recyclableWeight += (weight * percentage) / 100;
    });
  });
  
  return totalWeight > 0 ? Math.round((recyclableWeight / totalWeight) * 100) : 0;
};

export default function RecyclerDashboard() {
  const { user } = useAuth();
  const { sites, loading: sitesLoading, error: sitesError } = useWasteSites();
  const { 
    unreadNotifications, 
    markAsRead,
    loading: notificationsLoading 
  } = useNotifications();
  const { isDarkMode } = useTheme();
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
    axios.get(`${ML_SERVICE_URL}/forecast/next-day`).then(res => setForecast(res.data));
  }, []);

      // Fetch annotated images for each site on mount or when sites change (updated for production)
    useEffect(() => {
      async function fetchAnnotatedImages() {
      const images: Record<string, string> = {};
      for (const site of sites) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/waste-compositions/history?site_id=${site.id}`);
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
      const allDates = new Set<string>();
      
      for (const site of sites) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/waste-compositions/history?site_id=${site.id}`);
          if (res.data.history && res.data.history.length > 0) {
            const latest = res.data.history[0];
            compositions[site.id] = latest;
            if (latest.annotated_image) {
              images[site.id] = latest.annotated_image;
              if (!latestImage || latest.date > latestImage.date) {
                latestImage = { date: latest.date, img: latest.annotated_image };
              }
            }
            
            // Collect all available dates
            res.data.history.forEach((record: any) => {
              allDates.add(record.date);
            });
          }
        } catch {}
      }
      setSiteCompositions(compositions);
      setSiteImages(images);
      setAllSitesImage(latestImage ? latestImage.img : null);
      
      // Set available dates for historical viewing
      const dates = Array.from(allDates).sort().reverse().map(date => new Date(date));
    }
    if (sites.length > 0) fetchCompositions();
  }, [sites]);

  // Use historical or current compositions based on mode
  const currentCompositions = siteCompositions;
  const currentImages = siteImages;
  const allTypes = getAllTypes(currentCompositions);

  // Calculate real-time metrics based on actual composition data
  const recyclingRate = Object.keys(currentCompositions).length > 0 ? calculateRecyclingRate(currentCompositions) : 0;
  const energySaved = Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).co2Avoided * 500) : 0; // Estimate: 500 kWh per ton CO2 avoided

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

  // Aggregate total composition from backend data (all types)
  let totalWeight = 0;
  const totalComposition: Record<string, number> = {};
  sites.forEach(site => {
    const comp = currentCompositions[site.id];
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
  const northComp = northSite ? currentCompositions[northSite.id] : null;
  const southComp = southSite ? currentCompositions[southSite.id] : null;

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
    axios.get(`${ML_SERVICE_URL}/forecast/history`, { params: { district } })
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
            {currentImages[northSite.id] && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">Latest Annotated Image:</h4>
                <img
                  src={`data:image/jpeg;base64,${currentImages[northSite.id]}`}
                  alt="Annotated waste detection"
                  className="w-full max-w-md border rounded shadow"
                  style={{ maxHeight: 400, objectFit: 'contain' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Updated: {northComp.created_at ? (() => {
                    const date = new Date(northComp.created_at);
                    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                  })() : 'Unknown time'}
                </p>
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
            {currentImages[southSite.id] && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">Latest Annotated Image:</h4>
                <img
                  src={`data:image/jpeg;base64,${currentImages[southSite.id]}`}
                  alt="Annotated waste detection"
                  className="w-full max-w-md border rounded shadow"
                  style={{ maxHeight: 400, objectFit: 'contain' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Updated: {southComp.created_at ? (() => {
                    const date = new Date(southComp.created_at);
                    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                  })() : 'Unknown time'}
                </p>
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

      {/* Environmental Impact */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          🌍 Environmental Impact Today
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center bg-white/80 dark:bg-gray-800/80 rounded-xl p-4">
            <div className="text-3xl mb-2">🌱</div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300">
              {Object.keys(currentCompositions).length > 0 ? calculateEnvironmentalImpact(currentCompositions).co2Avoided.toFixed(1) : '0.0'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Tons CO₂ Avoided</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Equivalent to {Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).co2Avoided * 2174) : 0} miles driven
            </p>
          </div>
          <div className="text-center bg-white/80 dark:bg-gray-800/80 rounded-xl p-4">
            <div className="text-3xl mb-2">🌳</div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300">
              {Object.keys(currentCompositions).length > 0 ? calculateEnvironmentalImpact(currentCompositions).treesSaved : 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Trees Saved</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Through paper recycling
            </p>
          </div>
          <div className="text-center bg-white/80 dark:bg-gray-800/80 rounded-xl p-4">
            <div className="text-3xl mb-2">💧</div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300">
              {Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).waterSaved).toLocaleString() : '0'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Liters Water Saved</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enough for {Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).waterSaved / 150) : 0} people/day
            </p>
          </div>
        </div>
        
        {/* Impact Breakdown */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            💡 Impact Calculation Based on Real Data
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center">
              <div className="font-medium text-blue-600">Paper</div>
              <div className="text-gray-600">3.3kg CO₂/kg</div>
              <div className="text-gray-600">60L H₂O/kg</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">Plastic</div>
              <div className="text-gray-600">2.0kg CO₂/kg</div>
              <div className="text-gray-600">40L H₂O/kg</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-600">Metal</div>
              <div className="text-gray-600">6.0kg CO₂/kg</div>
              <div className="text-gray-600">95L H₂O/kg</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">Glass</div>
              <div className="text-gray-600">0.5kg CO₂/kg</div>
              <div className="text-gray-600">20L H₂O/kg</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            * Based on EPA and recycling industry research data
          </p>
        </div>
      </div>
    </div>
  );
} 