import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { api } from '../../api/mockApi';
import { Delivery } from '../../types';

const WASTE_COLORS: Record<string, string> = {
  plastic: '#2563eb', // blue
  metal: '#6b7280',   // gray
  organic: '#22c55e', // green
  paper: '#eab308',   // yellow
  glass: '#10b981',   // teal
};

// Hardcoded mapping of site/zone name to image path
const ZONE_IMAGES: Record<string, string> = {
  'Ablekuma North': '/backend/public/images/street-garbage-pile1.jpg',
  'Ayawaso West': '/backend/public/images/street-g2.jpg',
  // Add more mappings as needed
};

// List of main zones/districts
const MAIN_ZONES = [
  { name: 'Ablekuma North', image: ZONE_IMAGES['Ablekuma North'] },
  { name: 'Ayawaso West', image: ZONE_IMAGES['Ayawaso West'] },
];

export default function Insights() {
  const { sites } = useWasteSites();
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSite, setSelectedSite] = useState('all');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [composition, setComposition] = useState<Record<string, number> | null>(null);
  const [totalWeight, setTotalWeight] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [detectionHistory, setDetectionHistory] = useState<any[]>([]);
  const [detectionTrend, setDetectionTrend] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [annotatedImages, setAnnotatedImages] = useState<Record<string, string>>({});

  // Fetch history for all sites or a specific site/zone
  useEffect(() => {
    setLoading(true);
    let url = '/api/forecast/history';
    let params: any = {};
    if (selectedSite !== 'all') {
      if (selectedSite.startsWith('zone:')) {
        params.district = selectedSite.replace('zone:', '');
      } else {
        const siteObj = sites.find(s => s.id === selectedSite);
        if (siteObj) params.district = siteObj.name;
      }
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
    const dayRows = history.filter(row => row.date === selectedDate?.toISOString().slice(0, 10));
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

  // Fetch detection history for selected site/zone
  useEffect(() => {
    let url = '/api/auth/waste-compositions/history';
    let params: any = {};
    if (selectedSite !== 'all') {
      if (!selectedSite.startsWith('zone:')) params.site_id = selectedSite;
    }
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

  // Fetch deliveries for selected site/zone and filter by selected date
  useEffect(() => {
    setDeliveriesLoading(true);
    api.deliveries.list().then((allDeliveries: Delivery[]) => {
      let filtered = allDeliveries;
      if (selectedSite === 'all') {
        // no site filter
      } else if (selectedSite.startsWith('zone:')) {
        // Filter by zone/district name
        const zoneName = selectedSite.replace('zone:', '');
        filtered = filtered.filter(d => d.zone === zoneName);
      } else {
        filtered = filtered.filter(d => d.facilityId === selectedSite);
      }
      // Filter by selected date if set
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().slice(0, 10);
        filtered = filtered.filter(d => d.estimatedArrival && d.estimatedArrival.slice(0, 10) === dateStr);
      }
      setDeliveries(filtered);
      setDeliveriesLoading(false);
    });
  }, [selectedSite, selectedDate]);

  // Fetch annotated images for all sites and dates
  useEffect(() => {
    async function fetchAnnotatedImages() {
      let images: Record<string, string> = {};
      for (const site of sites) {
        try {
          const res = await axios.get(`/api/auth/waste-compositions/history?site_id=${site.id}`);
          if (res.data.history && res.data.history.length > 0) {
            for (const row of res.data.history) {
              if (row.annotated_image) {
                images[`${site.id}_${row.date}`] = row.annotated_image;
              }
            }
          }
        } catch {}
      }
      setAnnotatedImages(images);
    }
    if (sites.length > 0) fetchAnnotatedImages();
  }, [sites]);

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

  // Get all available dates as Date objects
  const allDates = Array.from(new Set(history.map(row => row.date))).sort().reverse().map(date => new Date(date));

  return (
    <div className="space-y-6">
      {/* GLOBAL DEBUG INFO */}
      <div className="mb-2 p-2 bg-yellow-100 text-xs text-yellow-900 rounded">
        DEBUG: selectedSite={selectedSite}, selectedDate={selectedDate ? selectedDate.toISOString() : 'null'}, composition={JSON.stringify(composition)}
      </div>
      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        {/* All Sites Card */}
        <div
          className={`rounded-2xl shadow-lg cursor-pointer relative overflow-hidden border-4 ${selectedSite === 'all' ? 'border-blue-500' : 'border-transparent'} bg-white dark:bg-gray-900 transition-all duration-200`}
          style={{ minHeight: selectedSite === 'all' ? 350 : 180, background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdf4 100%)' }}
          onClick={() => setSelectedSite('all')}
        >
          <div className="flex items-end p-4 h-24">
            <span className="text-xl font-bold text-white drop-shadow">All Sites</span>
          </div>
          {selectedSite === 'all' && selectedDate && composition && (
            <div className="p-4">
              {/* DEBUG INFO */}
              <div className="mb-2 p-2 bg-yellow-100 text-xs text-yellow-900 rounded">DEBUG: selectedSite={selectedSite}, deliveries={JSON.stringify(deliveries)}</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Aggregate Composition for {selectedDate.toISOString().slice(0, 10)}</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={Object.entries(composition).map(([type, percent]) => ({ name: type, value: percent }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {Object.keys(WASTE_COLORS).map((type) => (
                      <Cell key={type} fill={WASTE_COLORS[type]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 text-gray-700 dark:text-gray-200 text-sm">
                <span className="font-semibold">{totalWeight ? `${totalWeight} kg` : ''} of waste generated across all sites</span>
              </div>
              <div className="mt-4 w-full">
                <h3 className="text-md font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><span>🚚</span> Deliveries (All Zones)</h3>
                {deliveriesLoading ? (
                  <div>Loading deliveries...</div>
                ) : deliveries.length === 0 ? (
                  <div className="text-gray-600 dark:text-gray-300">No deliveries for all zones.</div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {deliveries.map((delivery) => (
                      <div key={delivery.id} className="flex justify-between items-center p-2 rounded bg-white/90 dark:bg-gray-900/90 border border-gray-100 dark:border-gray-800">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Delivery {delivery.id}</span>
                          <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">Truck: {delivery.truckId}</span>
                          <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">ETA: {new Date(delivery.estimatedArrival).toLocaleTimeString()}</span>
                          <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">Weight: {Math.round(delivery.weight)} kg</span>
                        </div>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          delivery.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : delivery.status === 'in-transit'
                            ? 'bg-yellow-100 text-black dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-blue-100 text-black dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {delivery.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Main zones/districts */}
        {MAIN_ZONES.map(zone => (
          <div
            key={zone.name}
            className={`rounded-2xl shadow-lg cursor-pointer relative overflow-hidden border-4 ${selectedSite === `zone:${zone.name}` ? 'border-blue-500' : 'border-transparent'} bg-white dark:bg-gray-900 transition-all duration-200`}
            style={{ minHeight: selectedSite === `zone:${zone.name}` ? 350 : 180, background: `url(${zone.image}) center/cover no-repeat` }}
            onClick={() => setSelectedSite(`zone:${zone.name}`)}
          >
            <div className="flex items-end p-4 h-24">
              <span className="text-xl font-bold text-white drop-shadow">{zone.name}</span>
            </div>
            {selectedSite === `zone:${zone.name}` && selectedDate && composition && (
              <div className="p-4">
                {/* DEBUG INFO */}
                <div className="mb-2 p-2 bg-yellow-100 text-xs text-yellow-900 rounded">DEBUG: selectedSite={selectedSite}, deliveries={JSON.stringify(deliveries)}</div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Composition for {zone.name} ({selectedDate.toISOString().slice(0, 10)})</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(composition).map(([type, percent]) => ({ type, percent }))}>
                    <XAxis dataKey="type" />
                    <YAxis unit="%" />
                    <Tooltip />
                    {Object.keys(WASTE_COLORS).map(type => (
                      <Bar key={type} dataKey={d => d.type === type ? d.percent : 0} name={type} fill={WASTE_COLORS[type]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-gray-700 dark:text-gray-200 text-sm">
                  <span className="font-semibold">{totalWeight ? `${totalWeight} kg` : ''} of waste generated in {zone.name}</span>
                </div>
                <div className="mt-4 w-full">
                  <h3 className="text-md font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><span>🚚</span> Deliveries ({zone.name})</h3>
                  {deliveriesLoading ? (
                    <div>Loading deliveries...</div>
                  ) : deliveries.length === 0 ? (
                    <div className="text-gray-600 dark:text-gray-300">No deliveries for this zone.</div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {deliveries.map((delivery) => (
                        <div key={delivery.id} className="flex justify-between items-center p-2 rounded bg-white/90 dark:bg-gray-900/90 border border-gray-100 dark:border-gray-800">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Delivery {delivery.id}</span>
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">Truck: {delivery.truckId}</span>
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">ETA: {new Date(delivery.estimatedArrival).toLocaleTimeString()}</span>
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">Weight: {Math.round(delivery.weight)} kg</span>
                          </div>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            delivery.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : delivery.status === 'in-transit'
                              ? 'bg-yellow-100 text-black dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-blue-100 text-black dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {delivery.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {/* Dumping sites */}
        {sites.map(site => (
          <div
            key={site.id}
            className={`rounded-2xl shadow-lg cursor-pointer relative overflow-hidden border-4 ${selectedSite === site.id ? 'border-blue-500' : 'border-transparent'} bg-white dark:bg-gray-900 transition-all duration-200`}
            style={{ minHeight: selectedSite === site.id ? 350 : 180, background: `url(${ZONE_IMAGES[site.name] || '/backend/public/images/street-garbage-pile1.jpg'}) center/cover no-repeat` }}
            onClick={() => setSelectedSite(site.id)}
          >
            <div className="flex items-end p-4 h-24">
              <span className="text-xl font-bold text-white drop-shadow">{site.name}</span>
            </div>
            {selectedSite === site.id && selectedDate && composition && (
              <div className="p-4">
                {/* DEBUG INFO */}
                <div className="mb-2 p-2 bg-yellow-100 text-xs text-yellow-900 rounded">DEBUG: selectedSite={selectedSite}, deliveries={JSON.stringify(deliveries)}</div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Composition for {site.name} ({selectedDate.toISOString().slice(0, 10)})</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(composition).map(([type, percent]) => ({ type, percent }))}>
                    <XAxis dataKey="type" />
                    <YAxis unit="%" />
                    <Tooltip />
                    {Object.keys(WASTE_COLORS).map(type => (
                      <Bar key={type} dataKey={d => d.type === type ? d.percent : 0} name={type} fill={WASTE_COLORS[type]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                {annotatedImages[`${site.id}_${selectedDate.toISOString().slice(0, 10)}`] && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-1">Annotated Image for this date:</h4>
                    <img
                      src={`data:image/jpeg;base64,${annotatedImages[`${site.id}_${selectedDate.toISOString().slice(0, 10)}`]}`}
                      alt="Annotated waste detection"
                      className="w-full max-w-md border rounded shadow"
                      style={{ maxHeight: 400, objectFit: 'contain' }}
                    />
                  </div>
                )}
                <div className="mt-2 text-gray-700 dark:text-gray-200 text-sm">
                  <span className="font-semibold">{totalWeight ? `${totalWeight} kg` : ''} of waste generated at {site.name}</span>
                </div>
                <div className="mt-4 w-full">
                  <h3 className="text-md font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><span>🚚</span> Deliveries ({site.name})</h3>
                  {deliveriesLoading ? (
                    <div>Loading deliveries...</div>
                  ) : deliveries.length === 0 ? (
                    <div className="text-gray-600 dark:text-gray-300">No deliveries for this site.</div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {deliveries.map((delivery) => (
                        <div key={delivery.id} className="flex justify-between items-center p-2 rounded bg-white/90 dark:bg-gray-900/90 border border-gray-100 dark:border-gray-800">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Delivery {delivery.id}</span>
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">Truck: {delivery.truckId}</span>
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">ETA: {new Date(delivery.estimatedArrival).toLocaleTimeString()}</span>
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">Weight: {Math.round(delivery.weight)} kg</span>
                          </div>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            delivery.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : delivery.status === 'in-transit'
                              ? 'bg-yellow-100 text-black dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-blue-100 text-black dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {delivery.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Date and (optional) site dropdown */}
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            includeDates={allDates}
            placeholderText="Select a date"
            className={`form-input rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200/50 shadow-sm text-center text-lg bg-pink-50 hover:bg-pink-100 transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700 placeholder-gray-400' : ''} cursor-pointer`}
            calendarClassName={`rounded-lg shadow-lg p-2 border-2 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-blue-200'}`}
            dayClassName={date => 'rounded-full hover:bg-blue-200 cursor-pointer'}
            popperPlacement="bottom"
            dateFormat="yyyy-MM-dd"
            popperClassName={isDarkMode ? 'dark-datepicker-popper' : ''}
          />
        </div>
        {/* Optionally keep the dropdown for fallback */}
        {/*
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dumping Site</label>
          <select
            className={`form-select ${isDarkMode ? 'bg-white text-black' : ''}`}
            style={{ backgroundColor: isDarkMode ? '#fff' : undefined, color: isDarkMode ? '#000' : undefined, cursor: 'pointer' }}
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
          >
            <option value="all" className="dark:text-black">All Sites (Aggregate)</option>
            {sites.map(site => (
              <option key={site.id} value={site.id} className="dark:text-black">{site.name}</option>
            ))}
          </select>
        </div>
        */}
      </div>
      {/* Trend Line Chart below selection */}
      {trendData.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
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
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
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
      {/* Show composition for selected day/site or no data message */}
      {selectedDate && !composition && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <h2 className="text-lg font-bold text-gray-900 mb-2">No data available for this date and site.</h2>
          <p>Please select another date or site.</p>
        </div>
      )}
    </div>
  );
} 