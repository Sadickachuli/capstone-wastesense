import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useTheme } from '../../context/ThemeContext';

const WASTE_COLORS: Record<string, string> = {
  plastic: '#2563eb', // blue
  metal: '#6b7280',   // gray
  organic: '#22c55e', // green
  paper: '#eab308',   // yellow
  glass: '#10b981',   // teal
};

export default function Insights() {
  const { sites } = useWasteSites();
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSite, setSelectedSite] = useState('all');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [composition, setComposition] = useState<Record<string, number> | null>(null);
  const [totalWeight, setTotalWeight] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [detectionHistory, setDetectionHistory] = useState<any[]>([]);
  const [detectionTrend, setDetectionTrend] = useState<any[]>([]);

  // Fetch history for all sites or a specific site
  useEffect(() => {
    setLoading(true);
    let url = '/api/forecast/history';
    let params: any = {};
    if (selectedSite !== 'all') {
      const siteObj = sites.find(s => s.id === selectedSite);
      if (siteObj) params.district = siteObj.name;
    }
    axios.get(url, { params }).then(res => {
      setHistory(res.data);
      setLoading(false);
    });
  }, [selectedSite, sites]);

  // When date or site changes, update composition
  useEffect(() => {
    if (!selectedDate || history.length === 0) {
      setComposition(null);
      setTotalWeight(null);
      return;
    }
    // Filter for the selected date
    const dayRows = history.filter(row => row.date === selectedDate);
    if (selectedSite === 'all') {
      // Aggregate all sites for the day
      let total = 0;
      const comp: Record<string, number> = { plastic: 0, paper: 0, glass: 0, metal: 0, organic: 0 };
      dayRows.forEach(row => {
        total += row.total_waste_tonnes || 0;
        Object.keys(comp).forEach(type => {
          comp[type] += (row[`${type}_percent`] || 0) * (row.total_waste_tonnes || 0) / 100;
        });
      });
      if (total > 0) {
        Object.keys(comp).forEach(type => {
          comp[type] = Math.round((comp[type] / total) * 100);
        });
      }
      setComposition(comp);
      setTotalWeight(total);
    } else {
      // Single site/district
      const row = dayRows[0];
      if (row) {
        setComposition({
          plastic: row.plastic_percent,
          paper: row.paper_percent,
          glass: row.glass_percent,
          metal: row.metal_percent,
          organic: row.organic_percent,
        });
        setTotalWeight(row.total_waste_tonnes);
      } else {
        setComposition(null);
        setTotalWeight(null);
      }
    }
  }, [selectedDate, selectedSite, history]);

  // Prepare trend data (last 30 days) for the chart, always visible if history exists
  useEffect(() => {
    if (history.length === 0) {
      setTrendData([]);
      return;
    }
    const trend = history.slice(-30).map(row => ({
      date: row.date,
      plastic: row.plastic_percent,
      paper: row.paper_percent,
      glass: row.glass_percent,
      metal: row.metal_percent,
      organic: row.organic_percent,
      total: row.total_waste_tonnes,
    }));
    setTrendData(trend);
  }, [history, selectedSite]);

  // Poll for history every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      let url = '/api/forecast/history';
      let params: any = {};
      if (selectedSite !== 'all') {
        const siteObj = sites.find(s => s.id === selectedSite);
        if (siteObj) params.district = siteObj.name;
      }
      axios.get(url, { params }).then(res => {
        setHistory(res.data);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedSite, sites]);

  // Fetch detection history for selected site
  useEffect(() => {
    let url = '/api/auth/waste-compositions/history';
    let params: any = {};
    if (selectedSite !== 'all') params.site_id = selectedSite;
    axios.get(url, { params }).then(res => {
      setDetectionHistory(res.data.history || []);
    });
  }, [selectedSite]);

  // Prepare detection trend data (last 30 days)
  useEffect(() => {
    if (detectionHistory.length === 0) {
      setDetectionTrend([]);
      return;
    }
    // Group by date, average if multiple per day
    const grouped: Record<string, any[]> = {};
    detectionHistory.forEach(row => {
      if (!grouped[row.date]) grouped[row.date] = [];
      grouped[row.date].push(row);
    });
    const trend = Object.entries(grouped)
      .map(([date, rows]) => {
        const avg = (key: string) => Math.round(rows.reduce((a, b) => a + Number(b[key] || 0), 0) / rows.length);
        return {
          date,
          plastic: avg('plastic_percent'),
          paper: avg('paper_percent'),
          glass: avg('glass_percent'),
          metal: avg('metal_percent'),
          organic: avg('organic_percent'),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    setDetectionTrend(trend);
  }, [detectionHistory]);

  // Export CSV
  const handleExport = () => {
    if (!trendData.length) return;
    const header = ['date', 'plastic', 'paper', 'glass', 'metal', 'organic', 'total'];
    const rows = trendData.map(row => header.map(h => row[h] ?? '').join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waste-insights.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get all available dates
  const allDates = Array.from(new Set(history.map(row => row.date))).sort().reverse();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Waste Insights & History</h1>
        <button className="btn btn-secondary" onClick={handleExport}>Export Report</button>
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <select
            className="form-select dark:bg-white dark:text-black"
            style={{ backgroundColor: isDarkMode ? '#fff' : undefined, color: isDarkMode ? '#000' : undefined }}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          >
            <option value="" className="dark:text-black">Select a date</option>
            {allDates.map(date => (
              <option key={date} value={date} className="dark:text-black">{date}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dumping Site</label>
          <select
            className="form-select dark:bg-white dark:text-black"
            style={{ backgroundColor: isDarkMode ? '#fff' : undefined, color: isDarkMode ? '#000' : undefined }}
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
          >
            <option value="all" className="dark:text-black">All Sites (Aggregate)</option>
            {sites.map(site => (
              <option key={site.id} value={site.id} className="dark:text-black">{site.name}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Trend Line Chart below selection */}
      {trendData.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Forecasted Waste Composition Trends (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" stroke={isDarkMode ? '#fff' : '#000'} tick={{ fill: isDarkMode ? '#fff' : '#000' }} />
              <YAxis stroke={isDarkMode ? '#fff' : '#000'} tick={{ fill: isDarkMode ? '#fff' : '#000' }} />
              <Tooltip contentStyle={{ color: isDarkMode ? '#fff' : '#000', background: isDarkMode ? '#222' : '#fff' }} labelStyle={{ color: isDarkMode ? '#fff' : '#000' }} itemStyle={{ color: isDarkMode ? '#fff' : '#000' }} />
              <Legend wrapperStyle={{ color: isDarkMode ? '#fff' : '#000' }} />
              <Line type="monotone" dataKey="plastic" stroke={WASTE_COLORS.plastic} name="Plastic" />
              <Line type="monotone" dataKey="paper" stroke={WASTE_COLORS.paper} name="Paper" />
              <Line type="monotone" dataKey="glass" stroke={WASTE_COLORS.glass} name="Glass" />
              <Line type="monotone" dataKey="metal" stroke={WASTE_COLORS.metal} name="Metal" />
              <Line type="monotone" dataKey="organic" stroke={WASTE_COLORS.organic} name="Organic" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Waste Detection Model Trends */}
      {detectionTrend.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Detected Waste Composition Trends (from Image Analysis)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={detectionTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" stroke={isDarkMode ? '#fff' : '#000'} tick={{ fill: isDarkMode ? '#fff' : '#000' }} />
              <YAxis stroke={isDarkMode ? '#fff' : '#000'} tick={{ fill: isDarkMode ? '#fff' : '#000' }} />
              <Tooltip contentStyle={{ color: isDarkMode ? '#fff' : '#000', background: isDarkMode ? '#222' : '#fff' }} labelStyle={{ color: isDarkMode ? '#fff' : '#000' }} itemStyle={{ color: isDarkMode ? '#fff' : '#000' }} />
              <Legend wrapperStyle={{ color: isDarkMode ? '#fff' : '#000' }} />
              <Line type="monotone" dataKey="plastic" stroke={WASTE_COLORS.plastic} name="Plastic" />
              <Line type="monotone" dataKey="paper" stroke={WASTE_COLORS.paper} name="Paper" />
              <Line type="monotone" dataKey="glass" stroke={WASTE_COLORS.glass} name="Glass" />
              <Line type="monotone" dataKey="metal" stroke={WASTE_COLORS.metal} name="Metal" />
              <Line type="monotone" dataKey="organic" stroke={WASTE_COLORS.organic} name="Organic" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Show composition for selected day/site */}
      {selectedDate && composition && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {selectedSite === 'all' ? 'Aggregate Composition' : 'Site Composition'} for {selectedDate}
          </h2>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
            <div className="flex-1 min-w-[220px] p-8">
              {selectedSite === 'all' ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(composition).map(([type, percent]) => ({ name: type, value: percent }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {Object.keys(WASTE_COLORS).map((type) => (
                        <Cell key={type} fill={WASTE_COLORS[type]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={Object.entries(composition).map(([type, percent]) => ({ type, percent }))}>
                    <XAxis dataKey="type" />
                    <YAxis unit="%" />
                    <Tooltip />
                    {Object.keys(WASTE_COLORS).map(type => (
                      <Bar key={type} dataKey={d => d.type === type ? d.percent : 0} name={type} fill={WASTE_COLORS[type]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex-1 text-gray-600 text-sm">
              <div className="mb-2">
                <span className="font-semibold text-gray-900">
                  {totalWeight ? `${totalWeight} kg` : ''} of waste was generated {selectedSite === 'all' ? 'across all sites' : 'at this site'}
                </span>
              </div>
              <ul>
                {Object.entries(composition).map(([type, percent]) => (
                  <li key={type} className="mb-1">
                    <span className="font-semibold text-gray-900 capitalize">{type}:</span> {percent}%
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