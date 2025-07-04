import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { environment } from '../../config/environment';

const WASTE_COLORS: Record<string, string> = {
  plastic: '#60A5FA',
  paper: '#FBBF24',
  glass: '#34D399',
  metal: '#F87171',
  organic: '#A78BFA',
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forecast for Tomorrow</h1>
        <button
          onClick={fetchForecast}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {loading && (
        <div className="card bg-white dark:bg-gray-900 shadow dark:shadow-white animate-pulse mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Loading Forecast...</h2>
          <div className="mb-4 text-gray-700 dark:text-gray-300">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          </div>
          <div className="flex items-end space-x-2 h-48 mb-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-8 bg-gray-200 dark:bg-gray-700 rounded-t" style={{ height: `${40 + i*20}px` }} />
                <div className="h-4 w-8 bg-gray-100 dark:bg-gray-600 rounded mt-2" />
              </div>
            ))}
          </div>
          <div className="flex flex-row space-x-4 mt-4">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-32 bg-gray-100 dark:bg-gray-600 rounded" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            ⏳ The ML service may take up to 60 seconds to wake up if it's been idle...
          </p>
        </div>
      )}
      
      {error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
          <div className="flex items-center p-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Forecast Unavailable
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
              <button
                onClick={fetchForecast}
                className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-sm rounded hover:bg-red-200 dark:hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {forecast && (
        <div className="card bg-white dark:bg-gray-900 shadow dark:shadow-white mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Forecast for Tomorrow</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            Tomorrow's waste: <span className="font-semibold">{forecast.total_waste_tonnes.toFixed(1)} tonnes</span> from Ablekuma North and Ayawaso West. <br />
            Composition: {Object.entries(forecast.composition_percent).map(([type, percent]) => `${percent}% ${type}`).join(', ')}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecast.districts.map((d: any) => ({
              name: d.district,
              ...d.composition_percent
            }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
              <YAxis unit="%" stroke={axisColor} tick={{ fill: axisColor }} />
              <Tooltip 
                contentStyle={{ 
                  color: tooltipTextColor, 
                  backgroundColor: tooltipBg,
                  border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }} 
                labelStyle={{ color: tooltipTextColor }} 
                itemStyle={{ color: tooltipTextColor }} 
              />
              <Legend wrapperStyle={{ color: axisColor }} />
              {Object.keys(WASTE_COLORS).map(type => (
                <Line 
                  key={type} 
                  type="monotone" 
                  dataKey={type} 
                  stroke={WASTE_COLORS[type]} 
                  name={type.charAt(0).toUpperCase() + type.slice(1)} 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: WASTE_COLORS[type] }} 
                  activeDot={{ r: 8, fill: WASTE_COLORS[type] }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:space-x-8">
            <div className="flex-1 min-w-[320px]" style={{ height: 200 }}>
              <PieChart width={320} height={200}>
                <Pie
                  data={Object.entries(forecast.composition_percent).map(([type, percent]) => ({ name: type, value: percent }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={40}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {Object.keys(WASTE_COLORS).map((type) => (
                    <Cell key={type} fill={WASTE_COLORS[type]} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 text-gray-600 dark:text-gray-300 text-sm">
              <ul>
                {forecast.districts.map((d: any) => (
                  <li key={d.district} className="mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{d.district}:</span> {d.total_waste_tonnes.toFixed(1)} tonnes. Composition: {Object.entries(d.composition_percent).map(([type, percent]) => `${percent}% ${type}`).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 