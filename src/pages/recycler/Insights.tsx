import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const WASTE_COLORS: Record<string, string> = {
  plastic: '#2563eb', // blue
  metal: '#6b7280',   // gray
  organic: '#22c55e', // green
  paper: '#eab308',   // yellow
  glass: '#10b981',   // teal
  textile: '#a21caf', // purple
  other: '#f43f5e',   // pink/red
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

  // Fetch detection history to get available dates
  useEffect(() => {
    async function fetchDetectionHistory() {
      try {
        const res = await axios.get('/api/auth/waste-compositions/history');
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

  const fetchCompositionForDate = async () => {
    try {
      const dateStr = selectedDate!.toISOString().slice(0, 10);
      
      if (selectedSite === 'all') {
        // Aggregate all sites for the selected date
        const allSiteData = await Promise.all(
          sites.map(async (site) => {
            try {
              const res = await axios.get(`/api/auth/waste-compositions/history?site_id=${site.id}`);
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
              siteImages[site.id] = record.annotated_image;
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
          const res = await axios.get(`/api/auth/waste-compositions/history?site_id=${selectedSite}`);
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
              const res = await axios.get(`/api/auth/waste-compositions/history?site_id=${site.id}`);
              return res.data.history || [];
            } catch {
              return [];
            }
          })
        );

        // Flatten and group by date
        const allRecords = allSiteData.flat();
        const groupedByDate: Record<string, any[]> = {};
        
        allRecords.forEach(record => {
          if (!groupedByDate[record.date]) {
            groupedByDate[record.date] = [];
          }
          groupedByDate[record.date].push(record);
        });

        // Calculate aggregate composition for each date
        const trendPoints = Object.entries(groupedByDate).map(([date, records]) => {
          let totalCapacity = 0;
          const aggregateComp: Record<string, number> = {
            plastic: 0, paper: 0, glass: 0, metal: 0, organic: 0, textile: 0, other: 0
          };

          records.forEach(record => {
            const capacity = record.current_capacity || 0;
            totalCapacity += capacity;
            
            Object.keys(aggregateComp).forEach(type => {
              const percent = record[`${type}_percent`] || 0;
              aggregateComp[type] += (percent * capacity) / 100;
            });
          });

          if (totalCapacity > 0) {
            Object.keys(aggregateComp).forEach(type => {
              aggregateComp[type] = Math.round((aggregateComp[type] / totalCapacity) * 100);
            });
          }

          return {
            date,
            displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            plastic: aggregateComp.plastic,
            paper: aggregateComp.paper,
            glass: aggregateComp.glass,
            metal: aggregateComp.metal,
            organic: aggregateComp.organic,
            textile: aggregateComp.textile,
            other: aggregateComp.other,
            totalWeight: totalCapacity
          };
        }).sort((a, b) => a.date.localeCompare(b.date));

        setTrendData(trendPoints);
      } else {
        // Single site trend
        try {
          const res = await axios.get(`/api/auth/waste-compositions/history?site_id=${selectedSite}`);
          const history = res.data.history || [];
          
          const trendPoints = history.map((record: any) => ({
            date: record.date,
            displayDate: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            plastic: record.plastic_percent || 0,
            paper: record.paper_percent || 0,
            glass: record.glass_percent || 0,
            metal: record.metal_percent || 0,
            organic: record.organic_percent || 0,
            textile: record.textile_percent || 0,
            other: record.other_percent || 0,
            totalWeight: record.current_capacity || 0
          })).sort((a, b) => a.date.localeCompare(b.date));

          setTrendData(trendPoints);
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

  // Get site name for display
  const getSiteName = (siteId: string) => {
    if (siteId === 'all') return 'All Sites';
    const site = sites.find(s => s.id === siteId);
    return site?.name || siteId;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Waste Composition Insights</h1>
      </div>

      {/* Date and Site Selection */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date)}
              includeDates={availableDates}
              placeholderText="Choose a date"
              className={`form-input rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200/50 shadow-sm text-center bg-white hover:bg-gray-50 transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400' : ''
              } cursor-pointer px-4 py-2`}
              calendarClassName={`rounded-lg shadow-lg p-2 border-2 ${
                isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-blue-200'
              }`}
              dayClassName={date => 'rounded-full hover:bg-blue-200 cursor-pointer'}
              popperPlacement="bottom"
              dateFormat="yyyy-MM-dd"
              popperClassName={isDarkMode ? 'dark-datepicker-popper' : ''}
              disabled={availableDates.length === 0}
            />
            {availableDates.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                No composition data available
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Site
            </label>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              className={`form-select rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200/50 shadow-sm ${
                isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900'
              } cursor-pointer px-4 py-2`}
            >
              <option value="all">All Sites (Aggregate)</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedDate && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              📅 Viewing composition data for <strong>{getSiteName(selectedSite)}</strong> on{' '}
              <strong>{selectedDate.toLocaleDateString()}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading composition data...</div>
        </div>
      )}

      {/* Composition Display */}
      {!loading && selectedDate && composition && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Waste Composition - {getSiteName(selectedSite)}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Composition Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Composition Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                {selectedSite === 'all' ? (
                  <PieChart>
                    <Pie
                      data={Object.entries(composition).map(([type, percent]) => ({ 
                        name: type.charAt(0).toUpperCase() + type.slice(1), 
                        value: percent 
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {Object.keys(composition).map((type) => (
                        <Cell key={type} fill={WASTE_COLORS[type] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <BarChart data={Object.entries(composition).map(([type, percent]) => ({ 
                    type: type.charAt(0).toUpperCase() + type.slice(1), 
                    percent 
                  }))}>
                    <XAxis dataKey="type" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percent" fill="#3B82F6" />
                  </BarChart>
                )}
              </ResponsiveContainer>
              
              {/* Composition Details */}
              <div className="mt-4 space-y-2">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Weight: {totalWeight ? `${totalWeight.toFixed(1)} kg` : 'N/A'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(composition).map(([type, percent]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{type}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Annotated Image */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Detection Image{selectedSite === 'all' ? 's' : ''}
              </h3>
              {selectedSite === 'all' ? (
                // Show both images when All Sites is selected
                <div className="space-y-4">
                  {sites.map(site => {
                    const siteImage = allSiteImages[site.id];
                    return siteImage ? (
                      <div key={site.id} className="text-center">
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {site.name}
                        </h4>
                        <img
                          src={`data:image/jpeg;base64,${siteImage}`}
                          alt={`Annotated waste detection for ${site.name}`}
                          className="w-full max-w-sm border rounded-lg shadow-lg mx-auto"
                          style={{ maxHeight: 300, objectFit: 'contain' }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {site.name} - {selectedDate.toLocaleDateString()}
                        </p>
                      </div>
                    ) : null;
                  })}
                  {!sites.some(site => allSiteImages[site.id]) && (
                    <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-gray-600 dark:text-gray-400">No images available for this date</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Show single image for specific site
                annotatedImage ? (
                  <div className="text-center">
                    <img
                      src={`data:image/jpeg;base64,${annotatedImage}`}
                      alt="Annotated waste detection"
                      className="w-full max-w-md border rounded-lg shadow-lg mx-auto"
                      style={{ maxHeight: 400, objectFit: 'contain' }}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Waste composition analysis from {selectedDate.toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-gray-600 dark:text-gray-400">No image available for this date</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && selectedDate && !composition && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No composition data found for <strong>{getSiteName(selectedSite)}</strong> on{' '}
            <strong>{selectedDate.toLocaleDateString()}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Try selecting a different date or site.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!selectedDate && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a Date to View Insights
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a date from the date picker above to view waste composition data and images.
          </p>
        </div>
      )}

      {/* Trend Analysis Charts - Real Composition Changes Over Time */}
      {!trendLoading && trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Composition Trends - {getSiteName(selectedSite)}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Real composition changes based on your actual updates ({trendData.length} data points)
          </p>
          
          <div className="space-y-8">
            {/* Composition Percentages Trend */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Waste Type Percentages Over Time
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="displayDate" 
                    stroke={isDarkMode ? '#fff' : '#000'} 
                    tick={{ fill: isDarkMode ? '#fff' : '#000', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    stroke={isDarkMode ? '#fff' : '#000'} 
                    tick={{ fill: isDarkMode ? '#fff' : '#000', fontSize: 11 }}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return new Date(payload[0].payload.date).toLocaleDateString();
                      }
                      return label;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="plastic" stroke={WASTE_COLORS.plastic} name="Plastic" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="paper" stroke={WASTE_COLORS.paper} name="Paper" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="glass" stroke={WASTE_COLORS.glass} name="Glass" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="metal" stroke={WASTE_COLORS.metal} name="Metal" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="organic" stroke={WASTE_COLORS.organic} name="Organic" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="textile" stroke={WASTE_COLORS.textile} name="Textile" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="other" stroke={WASTE_COLORS.other} name="Other" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Total Weight Trend */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Total Waste Weight Over Time
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="displayDate" 
                    stroke={isDarkMode ? '#fff' : '#000'} 
                    tick={{ fill: isDarkMode ? '#fff' : '#000', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    stroke={isDarkMode ? '#fff' : '#000'} 
                    tick={{ fill: isDarkMode ? '#fff' : '#000', fontSize: 11 }}
                    label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                    formatter={(value) => [`${value} kg`, 'Total Weight']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return new Date(payload[0].payload.date).toLocaleDateString();
                      }
                      return label;
                    }}
                  />
                  <Line type="monotone" dataKey="totalWeight" stroke="#3B82F6" name="Total Weight" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Trend Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Updates</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{trendData.length}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Latest Weight</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {trendData[trendData.length - 1]?.totalWeight?.toFixed(1) || '0'} kg
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-purple-600 dark:text-purple-400">Date Range</div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                  {trendData.length > 0 ? `${trendData.length} day${trendData.length > 1 ? 's' : ''}` : 'N/A'}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">Avg Weight</div>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                  {trendData.length > 0 ? 
                    (trendData.reduce((sum, point) => sum + (point.totalWeight || 0), 0) / trendData.length).toFixed(1) 
                    : '0'} kg
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Loading State */}
      {trendLoading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading trend data...</div>
        </div>
      )}

      {/* No Trend Data */}
      {!trendLoading && trendData.length === 0 && selectedSite !== 'all' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Trend Data Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start updating compositions for <strong>{getSiteName(selectedSite)}</strong> to see trends appear here.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Trends will show how composition changes with each update you make.
          </p>
        </div>
      )}
    </div>
  );
} 