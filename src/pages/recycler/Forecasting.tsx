import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { environment } from '../../config/environment';

const WASTE_COLORS: Record<string, string> = {
  plastic: '#3B82F6',
  paper: '#F59E0B',
  glass: '#10B981',
  metal: '#EF4444',
  organic: '#8B5CF6',
};

export default function Forecasting() {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationInView, setAnimationInView] = useState(false);
  const { isDarkMode } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setAnimationInView(true);
    }
  }, []);

    const fetchForecast = async () => {
      setLoading(true);
    setError(null);
      try {
      const ML_SERVICE_URL = environment.getMlServiceUrl();
      console.log('🔮 Fetching forecast from:', ML_SERVICE_URL);
      
      const res = await axios.get(`${ML_SERVICE_URL}/forecast/next-day`, {
        timeout: 60000 // 60 seconds timeout for ML processing
      });
      
      console.log('✅ Forecast response:', res.data);
        setForecast(res.data);
    } catch (err: any) {
      console.error('❌ Failed to fetch forecast:', err);
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('The ML service is waking up. This may take up to 60 seconds. Please try again.');
      } else if (err.response?.status === 503) {
        setError('ML service is temporarily unavailable. Please try again in a few moments.');
      } else {
        setError('Failed to load forecast. Please check your connection and try again.');
      }
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchForecast();
  }, []);

  // Theme-aware colors
  const axisColor = isDarkMode ? '#E5E7EB' : '#374151';
  const tooltipBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const tooltipTextColor = isDarkMode ? '#F9FAFB' : '#111827';

  const fadeInAnimation = {
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
  };

  const slideInLeftAnimation = {
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateX(0)' : 'translateX(-30px)',
    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
  };

  const slideInRightAnimation = {
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateX(0)' : 'translateX(30px)',
    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
      <div className="max-w-6xl mx-auto px-4 py-8" ref={containerRef}>
        {/* Header */}
        <div className="mb-8" style={fadeInAnimation}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    ML Waste Forecasting
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    AI-powered predictions for tomorrow's waste composition
                  </p>
                </div>
              </div>
        <button
          onClick={fetchForecast}
          disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {loading ? 'Analyzing...' : 'Refresh Forecast'}
        </button>
            </div>
          </div>
      </div>
      
      {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8" style={slideInLeftAnimation}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <div className="animate-pulse w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ML Analysis in Progress</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-3" style={{ height: `${60 + i*10}px` }}></div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mx-auto"></div>
              </div>
            ))}
          </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Please Wait</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    The ML service may take up to 60 seconds to wake up if it's been idle...
                  </p>
                </div>
              </div>
            </div>
        </div>
      )}
      
      {error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-8 mb-8" style={slideInRightAnimation}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                Forecast Unavailable
              </h3>
                <p className="text-red-700 dark:text-red-200 mb-4">
                {error}
              </p>
              <button
                onClick={fetchForecast}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {forecast && (
          <div className="space-y-8">
            {/* Forecast Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8" style={fadeInAnimation}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tomorrow's Forecast</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Waste Volume</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Predicted for tomorrow</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {forecast.total_waste_tonnes.toFixed(1)} tonnes
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Across Ablekuma North and Ayawaso West districts
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0v4l5-5-5-5v4zm8-8V7a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h1" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Composition Breakdown</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Material percentages</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(forecast.composition_percent).map(([type, percent]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: WASTE_COLORS[type] }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{percent as number}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* District Comparison Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8" style={slideInLeftAnimation}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">District Comparison</h2>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecast.districts.map((d: any) => ({
              name: d.district,
              ...d.composition_percent
                  }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke={axisColor} 
                      tick={{ fill: axisColor, fontSize: 12 }}
                      tickLine={{ stroke: axisColor }}
                    />
                    <YAxis 
                      unit="%" 
                      stroke={axisColor} 
                      tick={{ fill: axisColor, fontSize: 12 }}
                      tickLine={{ stroke: axisColor }}
                    />
              <Tooltip 
                contentStyle={{ 
                  color: tooltipTextColor, 
                  backgroundColor: tooltipBg,
                  border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
                      labelStyle={{ color: tooltipTextColor, fontWeight: 'bold' }} 
              />
                    <Legend wrapperStyle={{ color: axisColor, paddingTop: '20px' }} />
              {Object.keys(WASTE_COLORS).map(type => (
                <Line 
                  key={type} 
                  type="monotone" 
                  dataKey={type} 
                  stroke={WASTE_COLORS[type]} 
                  name={type.charAt(0).toUpperCase() + type.slice(1)} 
                  strokeWidth={3} 
                        dot={{ r: 6, fill: WASTE_COLORS[type], strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 8, fill: WASTE_COLORS[type], strokeWidth: 2, stroke: '#fff' }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
              </div>
            </div>

            {/* Composition Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={slideInRightAnimation}>
              {/* Pie Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.945 13a9.001 9.001 0 11-8.89-8.89z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall Composition</h3>
                </div>
                
                <div className="flex justify-center">
                  <ResponsiveContainer width={320} height={320}>
                    <PieChart>
                      <Pie
                        data={Object.entries(forecast.composition_percent).map(([type, percent]) => ({ 
                          name: type.charAt(0).toUpperCase() + type.slice(1), 
                          value: percent 
                        }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                        outerRadius={120}
                        innerRadius={60}
                  label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                >
                  {Object.keys(WASTE_COLORS).map((type) => (
                    <Cell key={type} fill={WASTE_COLORS[type]} />
                  ))}
                </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: tooltipBg,
                          border: 'none',
                          borderRadius: '8px',
                          color: tooltipTextColor,
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
              </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* District Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h4a1 1 0 011 1v5m-6 0h6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">District Breakdown</h3>
            </div>
                
                <div className="space-y-4">
                {forecast.districts.map((d: any) => (
                    <div key={d.district} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{d.district}</h4>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {d.total_waste_tonnes.toFixed(1)}t
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(d.composition_percent).map(([type, percent]) => (
                            <div key={type} className="flex items-center justify-between">
                              <span className="capitalize">{type}:</span>
                              <span className="font-medium">{percent as number}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
} 