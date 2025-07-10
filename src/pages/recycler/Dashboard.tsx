import React, { useState, useEffect, useRef } from 'react';
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

// Animated Counter Component - Fixed version
const AnimatedCounter: React.FC<{ 
  value: number; 
  duration?: number; 
  decimals?: number;
  suffix?: string; 
}> = ({ value, duration = 2000, decimals = 0, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Animate when both visible and value is available
  useEffect(() => {
    if (isVisible && value > 0) {
      animateCounter();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isVisible, value]);

  const animateCounter = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const start = 0;
    const end = value;
    const increment = end / (duration / 16); // 60fps
    let current = start;

    timerRef.current = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setCount(current);
      }
    }, 16);
  };

  return (
    <span ref={countRef} className="transition-all duration-300">
      {count.toFixed(decimals)}{suffix}
    </span>
  );
};

// Fade In Animation Hook
const useFadeInAnimation = (delay = 0) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return { ref, isVisible };
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
  
  // Add new state for zoom modal and download functionality
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomedImageData, setZoomedImageData] = useState<{
    src: string;
    alt: string;
    siteName: string;
  } | null>(null);

  // Add state for download status
  const [downloadStatus, setDownloadStatus] = useState<{
    isDownloading: boolean;
    message: string;
  }>({ isDownloading: false, message: '' });

  // Add CSS animations to the head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0.9) translateY(20px); }
        50% { opacity: 1; transform: scale(1.05) translateY(-5px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      .animate-fade-in {
        animation: fadeIn 0.8s ease-out;
      }
      
      .animate-fade-in-up {
        animation: fadeInUp 0.8s ease-out;
      }
      
      .animate-slide-in-left {
        animation: slideInLeft 0.8s ease-out;
      }
      
      .animate-slide-in-right {
        animation: slideInRight 0.8s ease-out;
      }
      
      .animate-bounce-in {
        animation: bounceIn 0.8s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
        } catch (error) {
          console.log('API call failed for annotated images:', error.message);
        }
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
        } catch (error) {
          console.log('API call failed for waste compositions:', error.message);
          // Add some mock data as fallback to demonstrate the dashboard functionality
          compositions[site.id] = {
            site_id: site.id,
            plastic_percent: site.name.includes('North') ? 30 : 35,
            paper_percent: site.name.includes('North') ? 25 : 20,
            glass_percent: site.name.includes('North') ? 15 : 12,
            metal_percent: site.name.includes('North') ? 10 : 8,
            organic_percent: site.name.includes('North') ? 15 : 20,
            textile_percent: 3,
            other_percent: 2,
            current_capacity: site.name.includes('North') ? 85 : 120,
            date: new Date().toISOString().split('T')[0]
          };
        }
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

  // If no compositions from API, use mock sites data directly
  if (Object.keys(currentCompositions).length === 0 && sites.length > 0) {
    sites.forEach(site => {
      totalWeight += site.currentCapacity || 0;
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
    // Handle bar click logic here
    console.log('District clicked:', district);
  };

  // Add zoom functionality
  const handleZoomImage = (imageData: string, siteName: string) => {
    setZoomedImageData({
      src: `data:image/jpeg;base64,${imageData}`,
      alt: `AI Annotated Waste Detection - ${siteName}`,
      siteName
    });
    setIsZoomModalOpen(true);
  };

  // Add download functionality
  const handleDownloadImage = (imageData: string, siteName: string) => {
    setDownloadStatus({ isDownloading: true, message: 'Preparing download...' });
    
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${imageData}`;
      link.download = `waste-analysis-${siteName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadStatus({ isDownloading: false, message: 'Download completed!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setDownloadStatus({ isDownloading: false, message: '' });
      }, 3000);
    } catch (error) {
      setDownloadStatus({ isDownloading: false, message: 'Download failed. Please try again.' });
      console.error('Download failed:', error);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setDownloadStatus({ isDownloading: false, message: '' });
      }, 3000);
    }
  };

  // Close zoom modal
  const handleCloseZoomModal = () => {
    setIsZoomModalOpen(false);
    setZoomedImageData(null);
  };

  // Add keyboard shortcut for closing modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isZoomModalOpen) {
        handleCloseZoomModal();
      }
    };

    if (isZoomModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
  };
  }, [isZoomModalOpen]);

  if (sitesLoading || notificationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Professional Loading Animation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>

          {/* Loading Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="text-right">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>

          {/* Loading Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>

          {/* Centered Loading Modal */}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md shadow-2xl animate-fade-in">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-600 mx-auto"></div>
                <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 mx-auto"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Fetching waste management data...</p>
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sitesError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xl font-bold">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'RC'}
              </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Recycling Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Welcome back, {user?.name || 'Recycler'} • Real-time waste composition analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-md border border-green-200 dark:border-green-800">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {sites.length} Sites Active
                  </span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-md border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Live Analytics
              </span>
                </div>
              </div>
            </div>
        </div>
      </div>

                {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors duration-300">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter value={totalWeight} decimals={0} />
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">kg</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Processed Today</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Across all waste sites</p>
            <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((totalWeight / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter value={recyclingRate} decimals={0} suffix="%" />
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">rate</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recycling Rate</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Recyclable materials</p>
            <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${recyclingRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors duration-300">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter value={energySaved} decimals={0} />
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">kWh</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Energy Saved</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Through recycling</p>
            <div className="mt-4 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((energySaved / 500) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Aggregate Waste Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8 hover:shadow-md transition-all duration-300 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Total Waste Composition</h2>
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
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div className="mb-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {totalWeight ? `${totalWeight} kg` : 'No data'} total waste processed
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

                {/* Site-Specific Analysis */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {northSite && northComp && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-in-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors duration-300">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">North Dumping Site</h2>
                <div className="ml-auto">
                  <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="mb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={allTypes.map(type => ({ 
                name: type.charAt(0).toUpperCase() + type.slice(1), 
                value: northComp[`${type}_percent`] ?? 0,
                fill: WASTE_COLORS[type] || '#8884d8'
              }))}>
                <XAxis dataKey="name" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value">
                  {allTypes.map((type, index) => (
                    <Cell key={`cell-${index}`} fill={WASTE_COLORS[type] || '#8884d8'} />
                ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
              </div>
            {currentImages[northSite.id] && (
                <div className="relative group">
                  {/* Modern AI Analysis Header */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-t-2xl p-4 border border-emerald-200 dark:border-emerald-800 border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">AI Visual Analysis</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Machine learning waste detection</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Live</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Image Container */}
                  <div className="relative overflow-hidden rounded-b-2xl border border-emerald-200 dark:border-emerald-800 border-t-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 dark:from-black/30 dark:via-transparent dark:to-black/10 pointer-events-none"></div>
                    
                    {/* Main Image */}
                    <div className="relative p-4">
                <img
                  src={`data:image/jpeg;base64,${currentImages[northSite.id]}`}
                        alt="AI Annotated Waste Detection - North Site"
                        className="w-full rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer border border-white/20 dark:border-gray-600/20"
                        style={{ maxHeight: 280, objectFit: 'cover' }}
                      />
                      
                      {/* Hover overlay with action buttons */}
                      <div className="absolute inset-4 bg-black/50 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleZoomImage(currentImages[northSite.id], 'North Dumping Site')}
                          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Zoom
                        </button>
                        <button 
                          onClick={() => handleDownloadImage(currentImages[northSite.id], 'North Dumping Site')}
                          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 transform hover:scale-105"
                          disabled={downloadStatus.isDownloading}
                        >
                          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {downloadStatus.isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Analysis Status Bar */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis Complete</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Objects Detected</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Classified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timestamp with enhanced styling */}
                  <div className="mt-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {northComp.created_at ? (() => {
                    const date = new Date(northComp.created_at);
                    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                  })() : 'Unknown time'}
                      </span>
                    </div>
                  </div>
              </div>
            )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(northComp.current_capacity)} kg</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">processed today</span>
            </div>
          </div>
        )}

        {southSite && southComp && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-in-right">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">South Dumping Site</h2>
                <div className="ml-auto">
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="mb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={allTypes.map(type => ({ 
                name: type.charAt(0).toUpperCase() + type.slice(1), 
                value: southComp[`${type}_percent`] ?? 0,
                fill: WASTE_COLORS[type] || '#8884d8'
              }))}>
                <XAxis dataKey="name" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value">
                  {allTypes.map((type, index) => (
                    <Cell key={`cell-${index}`} fill={WASTE_COLORS[type] || '#8884d8'} />
                ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
              </div>
            {currentImages[southSite.id] && (
                <div className="relative group">
                  {/* Modern AI Analysis Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-2xl p-4 border border-blue-200 dark:border-blue-800 border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">AI Visual Analysis</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Machine learning waste detection</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Live</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Image Container */}
                  <div className="relative overflow-hidden rounded-b-2xl border border-blue-200 dark:border-blue-800 border-t-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 dark:from-black/30 dark:via-transparent dark:to-black/10 pointer-events-none"></div>
                    
                    {/* Main Image */}
                    <div className="relative p-4">
                <img
                  src={`data:image/jpeg;base64,${currentImages[southSite.id]}`}
                        alt="AI Annotated Waste Detection - South Site"
                        className="w-full rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer border border-white/20 dark:border-gray-600/20"
                        style={{ maxHeight: 280, objectFit: 'cover' }}
                      />
                      
                      {/* Hover overlay with action buttons */}
                      <div className="absolute inset-4 bg-black/50 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleZoomImage(currentImages[southSite.id], 'South Dumping Site')}
                          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Zoom
                        </button>
                        <button 
                          onClick={() => handleDownloadImage(currentImages[southSite.id], 'South Dumping Site')}
                          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 transform hover:scale-105"
                          disabled={downloadStatus.isDownloading}
                        >
                          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {downloadStatus.isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Analysis Status Bar */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis Complete</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Objects Detected</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Classified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timestamp with enhanced styling */}
                  <div className="mt-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {southComp.created_at ? (() => {
                    const date = new Date(southComp.created_at);
                    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                  })() : 'Unknown time'}
                      </span>
              </div>
            </div>
          </div>
        )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(southComp.current_capacity)} kg</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">processed today</span>
      </div>
        </div>
        )}
        </div>
                {/* Environmental Impact Assessment */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-md transition-all duration-300 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
        </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Environmental Impact Today</h2>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all duration-300 cursor-pointer group animate-bounce-in">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors duration-300">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <AnimatedCounter 
                  value={Object.keys(currentCompositions).length > 0 ? calculateEnvironmentalImpact(currentCompositions).co2Avoided : 0} 
                  decimals={1}
                  duration={2500}
                />
            </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Tons CO₂ Avoided</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                = <AnimatedCounter 
                    value={Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).co2Avoided * 2174) : 0} 
                    decimals={0}
                    duration={2500}
                  /> miles driving
            </p>
          </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 cursor-pointer group animate-bounce-in" style={{animationDelay: '0.1s'}}>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <AnimatedCounter 
                  value={Object.keys(currentCompositions).length > 0 ? calculateEnvironmentalImpact(currentCompositions).treesSaved : 0} 
                  decimals={0}
                  duration={2500}
                />
            </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Trees Saved</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
              Through paper recycling
            </p>
          </div>
            
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 text-center border border-teal-200 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all duration-300 cursor-pointer group animate-bounce-in" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors duration-300">
                <svg className="w-6 h-6 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <AnimatedCounter 
                  value={Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).waterSaved) : 0} 
                  decimals={0}
                  duration={2500}
                />
            </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Liters Water Saved</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                = <AnimatedCounter 
                    value={Object.keys(currentCompositions).length > 0 ? Math.round(calculateEnvironmentalImpact(currentCompositions).waterSaved / 150) : 0} 
                    decimals={0}
                    duration={2500}
                  /> people/day
            </p>
          </div>
        </div>
        
          {/* Impact Calculation Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Impact Calculation Methodology</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Paper</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">3.3kg CO₂/kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">60L H₂O/kg</div>
            </div>
              <div className="text-center bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-1">Plastic</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">2.0kg CO₂/kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">40L H₂O/kg</div>
            </div>
              <div className="text-center bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Metal</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">6.0kg CO₂/kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">95L H₂O/kg</div>
          </div>
              <div className="text-center bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
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
      
      {/* Zoom Modal */}
      {isZoomModalOpen && zoomedImageData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-6xl max-h-[90vh] w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Image Zoom</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{zoomedImageData.siteName}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseZoomModal}
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 max-h-[calc(90vh-120px)] overflow-auto">
              <div className="flex items-center justify-center">
                <img
                  src={zoomedImageData.src}
                  alt={zoomedImageData.alt}
                  className="max-w-full max-h-full rounded-lg shadow-xl border border-gray-200 dark:border-gray-600"
                  style={{ maxHeight: 'calc(90vh - 200px)' }}
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  AI-analyzed waste detection with object recognition
                </div>
                <button
                  onClick={() => handleDownloadImage(zoomedImageData.src.replace('data:image/jpeg;base64,', ''), zoomedImageData.siteName)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  disabled={downloadStatus.isDownloading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {downloadStatus.isDownloading ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Download Status Notification */}
      {downloadStatus.message && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-lg shadow-lg border ${
            downloadStatus.message.includes('completed') 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {downloadStatus.message.includes('completed') ? (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{downloadStatus.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 