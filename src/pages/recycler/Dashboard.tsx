import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useNotifications } from '../../hooks/useNotifications';
import { WasteSite } from '../../types';
import { api } from '../../api/mockApi';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { environment } from '../../config/environment';

// Get API base URL from environment configuration
const API_BASE_URL = environment.getApiUrl();
const ML_SERVICE_URL = environment.getMlServiceUrl();
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

  // Removed test notification creation - backend now handles this automatically

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (sitesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg font-medium text-red-600 dark:text-red-400">{sitesError}</p>
          </div>
        </div>
      </div>
    );
  }

  const wasteUpdateNotifications = unreadNotifications.filter(
    n => n.metadata?.updateType === 'composition'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'RC'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-white text-xs">♻️</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Recycling Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Welcome back, {user?.name || 'Recycler'} • Real-time waste composition analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    🌱 {sites.length} Sites Active
                  </span>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    📊 Live Analytics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚖️</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{Math.round(totalWeight)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">kg</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Total Processed Today</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Across all waste sites</p>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">♻️</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.round(recyclingRate)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">%</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Recycling Rate</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Recyclable materials</p>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{Math.round(energySaved)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">kWh</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Energy Saved</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Through recycling</p>
          </div>
        </div>

        {/* Modernized Aggregate Pie Chart */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Total Waste Composition</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">• All Sites Combined</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            <div className="flex-1 min-w-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allTypes.map(type => ({ name: type, value: aggregateComposition[type] || 0 }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {allTypes.map((type) => (
                      <Cell key={type} fill={WASTE_COLORS[type] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
              <div className="mb-4">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  📈 {totalWeight ? `${totalWeight} kg` : 'No data'} total waste processed
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Breakdown by material type</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {allTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: WASTE_COLORS[type] || '#8884d8' }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{type}:</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{aggregateComposition[type] || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Per-Site Bar Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {northSite && northComp && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🏢</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">North Dumping Site</h2>
              </div>
              <div className="mb-4">
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
              </div>
              {currentImages[northSite.id] && (
                <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">🖼️ Latest Analysis</h4>
                  <img
                    src={`data:image/jpeg;base64,${currentImages[northSite.id]}`}
                    alt="Annotated waste detection"
                    className="w-full rounded-lg shadow-sm"
                    style={{ maxHeight: 200, objectFit: 'contain' }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Updated: {northComp.created_at ? (() => {
                      const date = new Date(northComp.created_at);
                      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                    })() : 'Unknown time'}
                  </p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{Math.round(northComp.current_capacity)} kg</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">processed today</span>
              </div>
            </div>
          )}

          {southSite && southComp && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🏢</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">South Dumping Site</h2>
              </div>
              <div className="mb-4">
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
              </div>
              {currentImages[southSite.id] && (
                <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">🖼️ Latest Analysis</h4>
                  <img
                    src={`data:image/jpeg;base64,${currentImages[southSite.id]}`}
                    alt="Annotated waste detection"
                    className="w-full rounded-lg shadow-sm"
                    style={{ maxHeight: 200, objectFit: 'contain' }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Updated: {southComp.created_at ? (() => {
                      const date = new Date(southComp.created_at);
                      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                    })() : 'Unknown time'}
                  </p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{Math.round(southComp.current_capacity)} kg</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">processed today</span>
              </div>
            </div>
          )}
        </div>
        {/* Enhanced Environmental Impact */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🌍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Environmental Impact Today</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {Object.keys(currentCompositions).length > 0 ? calculateEnvironmentalImpact(currentCompositions).co2Avoided.toFixed(1) : '0.0'}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tons CO₂ Avoided</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                = {Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).co2Avoided * 2174) : 0} miles driving
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">🌳</div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {Object.keys(currentCompositions).length > 0 ? calculateEnvironmentalImpact(currentCompositions).treesSaved : 0}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Trees Saved</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Through paper recycling
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">💧</div>
              <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                {Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).waterSaved).toLocaleString() : '0'}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Liters Water Saved</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                = {Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).waterSaved / 150) : 0} people/day
              </p>
            </div>
          </div>
          
          {/* Impact Calculation Details */}
          <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">💡</span>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Impact Calculation Methodology</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-white/60 dark:bg-gray-600/60 rounded-xl p-3">
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Paper</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">3.3kg CO₂/kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">60L H₂O/kg</div>
              </div>
              <div className="text-center bg-white/60 dark:bg-gray-600/60 rounded-xl p-3">
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-1">Plastic</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">2.0kg CO₂/kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">40L H₂O/kg</div>
              </div>
              <div className="text-center bg-white/60 dark:bg-gray-600/60 rounded-xl p-3">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Metal</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">6.0kg CO₂/kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">95L H₂O/kg</div>
              </div>
              <div className="text-center bg-white/60 dark:bg-gray-600/60 rounded-xl p-3">
                <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Glass</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">0.5kg CO₂/kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">20L H₂O/kg</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              * Based on EPA and recycling industry research data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 