import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/mockApi';
import { Delivery } from '../../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { environment } from '../../config/environment';

// Get API base URL from environment configuration
const API_BASE_URL = environment.getApiUrl();

const WASTE_COLORS: Record<string, string> = {
  plastic: '#2563eb', // blue
  metal: '#6b7280',   // gray
  organic: '#22c55e', // green
  paper: '#eab308',   // yellow
  glass: '#10b981',   // teal
  textile: '#a21caf', // purple
  other: '#f43f5e',   // pink/red
};

const getWasteIcon = (type: string) => {
  switch (type) {
    case 'plastic': return '🧴';
    case 'paper': return '📄';
    case 'glass': return '🪟';
    case 'metal': return '🔩';
    case 'organic': return '🌱';
    case 'textile': return '🧵';
    case 'other': return '🗑️';
    default: return '📦';
  }
};

export default function Insights() {
  const { sites } = useWasteSites();
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [composition, setComposition] = useState<Record<string, number> | null>(null);
  const [totalWeight, setTotalWeight] = useState<number | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [allSiteImages, setAllSiteImages] = useState<Record<string, string>>({});
  
  // New states for deliveries
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedSiteForDeliveries, setSelectedSiteForDeliveries] = useState<string | null>(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // Fetch detection history to get available dates
  useEffect(() => {
    async function fetchDetectionHistory() {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/waste-compositions/history`);
        const history = res.data.history || [];
        setDetectionHistory(history);
        
        // Get unique dates and sort them
        const dates = Array.from(new Set(history.map((record: any) => record.date)))
          .sort()
          .reverse()
          .map(date => new Date(date as string));
        setAvailableDates(dates);
      } catch (error) {
        console.error('Failed to fetch detection history:', error);
      }
    }
    fetchDetectionHistory();
  }, []);

  // When date or site changes, fetch composition data
  useEffect(() => {
    if (!selectedDate) {
      setComposition(null);
      setTotalWeight(null);
      setAnnotatedImage(null);
      return;
    }

    setLoading(true);
    fetchCompositionForDate();
  }, [selectedDate, selectedSite, sites]);

  // Fetch trend data when site changes
  useEffect(() => {
    fetchTrendData();
  }, [selectedSite, sites]);

  // Fetch deliveries
  useEffect(() => {
    fetchDeliveries();
    // Refresh deliveries every 30 seconds to see new ones
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/deliveries`);
      console.log('DEBUG: Fetched deliveries:', response.data.deliveries);
      setDeliveries(response.data.deliveries);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    }
  };

  const handleSiteCardClick = (siteId: string) => {
    setSelectedSiteForDeliveries(selectedSiteForDeliveries === siteId ? null : siteId);
  };

  const getDeliveriesForSite = (siteId: string) => {
    return deliveries.filter(delivery => delivery.facilityId === siteId);
  };

  const fetchCompositionForDate = async () => {
    try {
      const dateStr = selectedDate!.toISOString().slice(0, 10);
      
      if (selectedSite === 'all') {
        // Aggregate all sites for the selected date
        const allSiteData = await Promise.all(
          sites.map(async (site) => {
            try {
              const res = await axios.get(`${API_BASE_URL}/auth/waste-compositions/history?site_id=${site.id}`);
              const records = res.data.history || [];
              return records.find((record: any) => {
                // Try multiple date comparison methods
                const recordDate = record.date;
                const recordDateStr = new Date(recordDate).toISOString().slice(0, 10);
                return recordDateStr === dateStr || recordDate === dateStr;
              });
            } catch {
              return null;
            }
          })
        );

        const validRecords = allSiteData.filter(record => record !== null);
        
        if (validRecords.length > 0) {
          // Aggregate composition across all sites
          const totalWeight = validRecords.reduce((sum, record) => sum + (record.current_capacity || 0), 0);
          const aggregateComposition: Record<string, number> = {};
          const siteImages: Record<string, string> = {};
          
          // Calculate weighted averages
          validRecords.forEach((record, index) => {
            const weight = record.current_capacity || 0;
            if (weight > 0) {
              ['plastic', 'paper', 'glass', 'metal', 'organic', 'textile', 'other'].forEach(type => {
                const percent = record[`${type}_percent`] || 0;
                aggregateComposition[type] = (aggregateComposition[type] || 0) + (percent * weight);
              });
            }
            
            // Store site images
            const site = sites[index];
            if (site && record.annotated_image) {
              console.log(`🖼️ Image found for ${site.name}:`, {
                siteId: site.id,
                imageLength: record.annotated_image.length,
                imageStart: record.annotated_image.substring(0, 50) + '...'
              });
              siteImages[site.id] = record.annotated_image;
            } else if (site) {
              console.log(`❌ No image for ${site.name}:`, {
                siteId: site.id,
                hasRecord: !!record,
                hasImage: !!record?.annotated_image
              });
            }
          });
          
          // Convert back to percentages
          if (totalWeight > 0) {
            Object.keys(aggregateComposition).forEach(type => {
              aggregateComposition[type] = Math.round((aggregateComposition[type] / totalWeight));
            });
          }
          
          setComposition(aggregateComposition);
          setTotalWeight(totalWeight);
          setAnnotatedImage(null); // Don't show single image for aggregate
          setAllSiteImages(siteImages); // Store all site images
        } else {
          setComposition(null);
          setTotalWeight(0);
          setAnnotatedImage(null);
          setAllSiteImages({}); // Clear all site images when no data found
        }
      } else {
        // Single site
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/waste-compositions/history?site_id=${selectedSite}`);
          const records = res.data.history || [];
          const record = records.find((r: any) => {
            // Try multiple date comparison methods
            const recordDate = r.date;
            const recordDateStr = new Date(recordDate).toISOString().slice(0, 10);
            return recordDateStr === dateStr || recordDate === dateStr;
          });
          
          if (record) {
            const siteComposition = {
              plastic: record.plastic_percent || 0,
              paper: record.paper_percent || 0,
              glass: record.glass_percent || 0,
              metal: record.metal_percent || 0,
              organic: record.organic_percent || 0,
              textile: record.textile_percent || 0,
              other: record.other_percent || 0,
            };
            setComposition(siteComposition);
            setTotalWeight(record.current_capacity || 0);
            
            console.log(`🖼️ Single site image for ${selectedSite}:`, {
              hasImage: !!record.annotated_image,
              imageLength: record.annotated_image?.length || 0,
              imageStart: record.annotated_image?.substring(0, 50) + '...' || 'No image'
            });
            
            setAnnotatedImage(record.annotated_image || null);
            setAllSiteImages({}); // Clear all site images for single site view
          } else {
            setComposition(null);
            setTotalWeight(0);
            setAnnotatedImage(null);
            setAllSiteImages({}); // Clear all site images when no data found
          }
        } catch (error) {
          console.error('Failed to fetch site composition:', error);
          setComposition(null);
          setTotalWeight(0);
          setAnnotatedImage(null);
          setAllSiteImages({}); // Clear all site images when no data found
        }
      }
    } catch (error) {
      console.error('Failed to fetch composition data:', error);
      setComposition(null);
      setTotalWeight(0);
      setAnnotatedImage(null);
      setAllSiteImages({}); // Clear all site images when no data found
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    setTrendLoading(true);
    try {
      if (selectedSite === 'all') {
        // For all sites, get data from all sites and aggregate by date
        const allSiteData = await Promise.all(
          sites.map(async (site) => {
            try {
              const res = await axios.get(`${API_BASE_URL}/auth/waste-compositions/history?site_id=${site.id}`);
              return res.data.history || [];
            } catch {
              return [];
            }
          })
        );

        // Flatten and group by date
        const allRecords = allSiteData.flat();
        const groupedByDate = allRecords.reduce((acc, record) => {
          const date = record.date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(record);
          return acc;
        }, {} as Record<string, any[]>);

        // Aggregate by date
        const trendData = Object.entries(groupedByDate)
          .map(([date, records]) => {
            const totalWeight = records.reduce((sum, record) => sum + (record.current_capacity || 0), 0);
            const aggregateComposition: Record<string, number> = {};
            
            // Calculate weighted averages
            records.forEach(record => {
              const weight = record.current_capacity || 0;
              if (weight > 0) {
                ['plastic', 'paper', 'glass', 'metal', 'organic', 'textile', 'other'].forEach(type => {
                  const percent = record[`${type}_percent`] || 0;
                  aggregateComposition[type] = (aggregateComposition[type] || 0) + (percent * weight);
                });
              }
            });
            
            // Convert back to percentages
            if (totalWeight > 0) {
              Object.keys(aggregateComposition).forEach(type => {
                aggregateComposition[type] = Math.round((aggregateComposition[type] / totalWeight));
              });
            }
            
            return {
              date,
              totalWeight,
              ...aggregateComposition
            };
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-30); // Last 30 days
        
        setTrendData(trendData);
      } else {
        // Single site
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/waste-compositions/history?site_id=${selectedSite}`);
          const records = res.data.history || [];
          const trendData = records
            .map((record: any) => ({
              date: record.date,
              totalWeight: record.current_capacity || 0,
              plastic: record.plastic_percent || 0,
              paper: record.paper_percent || 0,
              glass: record.glass_percent || 0,
              metal: record.metal_percent || 0,
              organic: record.organic_percent || 0,
              textile: record.textile_percent || 0,
              other: record.other_percent || 0,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30); // Last 30 days
          
          setTrendData(trendData);
        } catch (error) {
          console.error('Failed to fetch trend data:', error);
          setTrendData([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : siteId;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCompositionData = () => {
    if (!composition) return [];
    return Object.entries(composition)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  const axisColor = isDarkMode ? '#E5E7EB' : '#374151';
  const tooltipBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const tooltipTextColor = isDarkMode ? '#F9FAFB' : '#111827';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Advanced Insights
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  AI-powered waste analytics and trend analysis
                </p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 lg:ml-auto">
              <div className="bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-2xl p-3 border border-white/20 dark:border-gray-600/20">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Analysis Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  includeDates={availableDates}
                  placeholderText="Select date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  dateFormat="MMM d, yyyy"
                />
              </div>
              
              <div className="bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-2xl p-3 border border-white/20 dark:border-gray-600/20">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🏢 Site Filter
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Sites</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Site Cards with Background Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sites.map((site) => {
            const siteDeliveries = getDeliveriesForSite(site.id);
            const isSelected = selectedSiteForDeliveries === site.id;
            
            return (
              <div key={site.id} className="relative group">
                {/* Site Card with Background Image */}
                <div
                  onClick={() => handleSiteCardClick(site.id)}
                  className={`relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                    isSelected ? 'ring-4 ring-blue-500 shadow-2xl scale-105' : 'shadow-xl'
                  }`}
                  style={{ height: '300px' }}
                >
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: site.id === 'WS001' 
                        ? 'url(/north-ds.webp)' 
                        : 'url(/south-ds.jpg)',
                    }}
                  />
                  
                  {/* Modern Glassmorphism Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60 backdrop-blur-sm" />
                  
                  {/* Card Content */}
                  <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                    <div>
                      <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                        {site.name}
                      </h2>
                      <p className="text-gray-200 mb-4 flex items-center gap-2">
                        <span className="text-sm">📍</span>
                        {site.location}
                      </p>
                      
                      {/* Enhanced Stats with Modern Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                          <div className="text-xs text-gray-200 mb-1">Current Capacity</div>
                          <div className="text-lg font-bold text-blue-200">{site.currentCapacity} kg</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                          <div className="text-xs text-gray-200 mb-1">Incoming Deliveries</div>
                          <div className="text-lg font-bold text-yellow-300">{siteDeliveries.length}</div>
                        </div>
                      </div>
                    </div>

                    {/* Click Indicator */}
                    <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                      <div className="text-sm text-gray-200 flex items-center gap-2">
                        <span className="text-xs">👆</span>
                        Click to view deliveries
                      </div>
                      <div className={`transform transition-transform duration-300 text-white ${isSelected ? 'rotate-180' : ''}`}>
                        ↓
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Deliveries Panel */}
                {isSelected && (
                  <div className="mt-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden animate-fadeIn">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="text-xl">🚚</span> 
                          Incoming Deliveries to {site.name}
                        </h3>
                        <button
                          onClick={() => setSelectedSiteForDeliveries(null)}
                          className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {siteDeliveries.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-2xl">📦</span>
                          </div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">No Deliveries Scheduled</h4>
                          <p className="text-gray-600 dark:text-gray-400">No deliveries currently scheduled for this site</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {siteDeliveries.map((delivery, index) => (
                            <div
                              key={delivery.id}
                              className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-sm">#{index + 1}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      Delivery #{index + 1}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {new Date(delivery.estimatedArrival).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  delivery.status === 'completed' || delivery.status === 'arrived'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : delivery.status === 'in-transit'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                  {delivery.status === 'in-transit' ? 'In Transit' : 
                                   delivery.status === 'arrived' ? 'Arrived' :
                                   delivery.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🚛</span>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Truck:</span>
                                    <div className="font-medium text-gray-900 dark:text-white">{delivery.truckId}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🗺️</span>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Zone:</span>
                                    <div className="font-medium text-gray-900 dark:text-white">{delivery.zone}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Analysis Results */}
        {selectedDate && (
          <div className="space-y-8">
            {/* Composition Analysis */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📊</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Composition Analysis - {formatDate(selectedDate)}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedSite === 'all' ? 'Aggregated across all sites' : `For ${getSiteName(selectedSite)}`}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-white text-2xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Analyzing Waste Composition...
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Running AI analysis on selected date
                  </p>
                </div>
              ) : composition && totalWeight ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Composition Chart */}
                  <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <span className="text-lg">🥧</span>
                      Material Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getCompositionData()}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {getCompositionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={WASTE_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: tooltipBg,
                            border: 'none',
                            borderRadius: '12px',
                            color: tooltipTextColor,
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Composition Details */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-lg">⚖️</span>
                        Total Weight
                      </h3>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {totalWeight.toFixed(1)} tons
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(composition)
                        .filter(([, value]) => value > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, percentage]) => (
                          <div key={type} className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getWasteIcon(type)}</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                                  {type}
                                </span>
                              </div>
                              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                {percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: WASTE_COLORS[type]
                                }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              ≈ {((percentage / 100) * totalWeight).toFixed(1)} tons
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-800/20 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📭</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                    No Data Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No waste composition data found for the selected date and site.
                  </p>
                </div>
              )}
            </div>

            {/* AI Analysis Image */}
            {annotatedImage && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      AI Visual Analysis
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Machine learning detected waste objects
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
                  <img 
                    src={`data:image/jpeg;base64,${annotatedImage}`}
                    alt="AI Annotated Waste Analysis"
                    className="w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              </div>
            )}

            {/* Site Images for All Sites View */}
            {selectedSite === 'all' && Object.keys(allSiteImages).length > 0 && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🏢</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      Site-by-Site Analysis
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      AI analysis for each individual site
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(allSiteImages).map(([siteId, image]) => (
                    <div key={siteId} className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        {getSiteName(siteId)}
                      </h3>
                      <img 
                        src={`data:image/jpeg;base64,${image}`}
                        alt={`AI Analysis for ${getSiteName(siteId)}`}
                        className="w-full h-auto rounded-xl shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trend Analysis */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📈</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Trend Analysis (30 Days)
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedSite === 'all' ? 'Aggregated trends across all sites' : `Trends for ${getSiteName(selectedSite)}`}
              </p>
            </div>
          </div>

          {trendLoading ? (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                Analyzing Trends...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Processing historical data patterns
              </p>
            </div>
          ) : trendData.length > 0 ? (
            <div className="space-y-8">
              {/* Weight Trend */}
              <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <span className="text-lg">⚖️</span>
                  Weight Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <XAxis 
                      dataKey="date" 
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      label={{ value: 'Weight (tons)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: tooltipBg,
                        border: 'none',
                        borderRadius: '12px',
                        color: tooltipTextColor,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalWeight" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Composition Trend */}
              <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <span className="text-lg">🧪</span>
                  Composition Trend
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendData}>
                    <XAxis 
                      dataKey="date" 
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: tooltipBg,
                        border: 'none',
                        borderRadius: '12px',
                        color: tooltipTextColor,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    {Object.keys(WASTE_COLORS).map(type => (
                      <Line
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stroke={WASTE_COLORS[type]}
                        strokeWidth={2}
                        dot={{ fill: WASTE_COLORS[type], strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: WASTE_COLORS[type], strokeWidth: 2 }}
                        name={type.charAt(0).toUpperCase() + type.slice(1)}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-800/20 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                No Trend Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Insufficient historical data to generate trends.
              </p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
} 