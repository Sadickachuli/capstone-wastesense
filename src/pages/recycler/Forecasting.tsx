import React, { useEffect, useState } from 'react';
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
  const { isDarkMode } = useTheme();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🔮</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    ML Waste Forecasting
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    AI-powered predictions for tomorrow's waste composition
                  </p>
                </div>
              </div>
              <button
                onClick={fetchForecast}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2"
              >
                <span className="text-lg">{loading ? '⏳' : '🔄'}</span>
                {loading ? 'Analyzing...' : 'Refresh Forecast'}
              </button>
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-white text-sm">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">ML Analysis in Progress</h2>
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
                <div key={i} className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4 text-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-3" style={{ height: `${60 + i*10}px` }}></div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300">Please Wait</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    The ML service may take up to 60 seconds to wake up if it's been idle...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-red-200 dark:border-red-800 p-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                  Forecast Unavailable
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {error}
                </p>
                <button
                  onClick={fetchForecast}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <span>🔄</span>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
        
        {forecast && (
          <div className="space-y-8">
            {/* Forecast Overview */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Tomorrow's Forecast</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">📈</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Total Waste Volume</h3>
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

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🧪</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Composition Breakdown</h3>
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
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* District Comparison Chart */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📍</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">District Comparison</h2>
              </div>
              
              <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6">
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
                      gridLine={{ stroke: isDarkMode ? '#374151' : '#E5E7EB' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        color: tooltipTextColor, 
                        backgroundColor: tooltipBg,
                        border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🥧</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Overall Composition</h3>
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
                          borderRadius: '12px',
                          color: tooltipTextColor
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* District Details */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🏘️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">District Breakdown</h3>
                </div>
                
                <div className="space-y-4">
                  {forecast.districts.map((d: any) => (
                    <div key={d.district} className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">{d.district}</h4>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {d.total_waste_tonnes.toFixed(1)}t
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(d.composition_percent).map(([type, percent]) => (
                            <div key={type} className="flex items-center justify-between">
                              <span className="capitalize">{type}:</span>
                              <span className="font-medium">{percent}%</span>
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