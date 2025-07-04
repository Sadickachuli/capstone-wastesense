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
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const ML_SERVICE_URL = environment.getMlServiceUrl();
        const res = await axios.get(`${ML_SERVICE_URL}/forecast/next-day`);
        setForecast(res.data);
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  // Theme-aware colors
  const axisColor = isDarkMode ? '#E5E7EB' : '#374151';
  const tooltipBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const tooltipTextColor = isDarkMode ? '#F9FAFB' : '#111827';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Forecast for Tomorrow</h1>
      {loading && (
        <div className="card bg-white dark:bg-gray-900 shadow dark:shadow-white animate-pulse mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Forecast for Tomorrow</h2>
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