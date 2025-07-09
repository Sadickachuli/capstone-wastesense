import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { environment } from '../../config/environment';
import axios from 'axios';

interface CollectionSchedule {
  id: string;
  zone: string;
  scheduledStart: string;
  estimatedCompletion: string;
  status: string;
  reportsCount: number;
  estimatedDistance: number;
  estimatedFuelConsumption: number;
  driverName: string;
  driverContact: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    registrationNumber: string;
    type: string;
  };
}

export default function Schedule() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in-progress' | 'completed'>('all');

  // Fetch collection schedules for the user's zone
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.zone) return;
      
      setLoading(true);
      setError('');
      try {
        const API_BASE_URL = environment.getApiUrl();
        const response = await axios.get(`${API_BASE_URL}/auth/schedules?zone=${encodeURIComponent(user.zone)}`);
        setSchedules(response.data.schedules);
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
        setError('Failed to load collection schedules');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
    // Refresh schedules every 60 seconds
    const interval = setInterval(fetchSchedules, 60000);
    return () => clearInterval(interval);
  }, [user?.zone]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '⏳';
      case 'scheduled':
        return '📅';
      case 'cancelled':
        return '❌';
      default:
        return '⚪';
    }
  };

  const getVehicleTypeDisplay = (type: string) => {
    switch (type) {
      case 'compressed_truck':
        return 'Compressed Truck';
      case 'rear_loader':
        return 'Rear Loader';
      case 'side_loader':
        return 'Side Loader';
      case 'front_loader':
        return 'Front Loader';
      case 'roll_off':
        return 'Roll-off Truck';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      shortDate: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filter === 'all') return true;
    return schedule.status === filter;
  });

  const getFilterCounts = () => {
    return {
      all: schedules.length,
      scheduled: schedules.filter(s => s.status === 'scheduled').length,
      'in-progress': schedules.filter(s => s.status === 'in-progress').length,
      completed: schedules.filter(s => s.status === 'completed').length
    };
  };

  const filterCounts = getFilterCounts();

  if (loading) {
  return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-8 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading collection schedules...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          </div>
        </div>
        </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Collection Schedule
              </h1>
              <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Stay updated with your waste collection timeline
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'} backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-white/20'}`}>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Zone: {user?.zone || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'all', label: 'Total', icon: '📊', color: 'from-blue-500 to-purple-600' },
            { key: 'scheduled', label: 'Scheduled', icon: '📅', color: 'from-blue-500 to-cyan-500' },
            { key: 'in-progress', label: 'In Progress', icon: '⏳', color: 'from-yellow-500 to-orange-500' },
            { key: 'completed', label: 'Completed', icon: '✅', color: 'from-green-500 to-teal-500' }
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key as any)}
              className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-xl p-4 border transition-all duration-200 hover:shadow-lg ${
                filter === stat.key 
                  ? `${isDarkMode ? 'border-blue-600' : 'border-blue-500'} shadow-lg scale-105` 
                  : `${isDarkMode ? 'border-gray-700' : 'border-white/20'} hover:scale-102`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-lg">{stat.icon}</span>
                </div>
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {filterCounts[stat.key as keyof typeof filterCounts]}
                </span>
              </div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {stat.label}
            </p>
            </button>
          ))}
          </div>
          
        {/* Schedule Content */}
        {filteredSchedules.length > 0 ? (
          <div className="space-y-6">
            {filteredSchedules.map((schedule) => {
              const startDateTime = formatDateTime(schedule.scheduledStart);
              const endDateTime = formatDateTime(schedule.estimatedCompletion);
              
              return (
                <div
                  key={schedule.id}
                  className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-6 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl hover:shadow-3xl transition-all duration-200`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl">🚛</span>
                      </div>
                        <div>
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {startDateTime.date}
                        </h3>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {schedule.zone} Collection
                          </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getStatusIcon(schedule.status)}</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Time */}
                      <div className={`flex items-center space-x-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">🕐</span>
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Collection Time
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {startDateTime.time} - {endDateTime.time}
                          </p>
                        </div>
                      </div>

                      {/* Vehicle */}
                      <div className={`flex items-center space-x-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">🚚</span>
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Vehicle
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {schedule.vehicle.make} {schedule.vehicle.model}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {getVehicleTypeDisplay(schedule.vehicle.type)} • {schedule.vehicle.registrationNumber || schedule.vehicle.id}
                          </p>
                        </div>
                      </div>

                      {/* Driver */}
                      {schedule.driverName && (
                        <div className={`flex items-center space-x-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">👤</span>
                          </div>
                          <div>
                            <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              Driver
                            </h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {schedule.driverName}
                            </p>
                              {schedule.driverContact && (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {schedule.driverContact}
                              </p>
                              )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Collection Stats */}
                      <div className={`flex items-center space-x-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📊</span>
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Collection Details
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {schedule.reportsCount} reports • {schedule.estimatedDistance}km route
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Estimated fuel: {schedule.estimatedFuelConsumption}L
                          </p>
                        </div>
                      </div>

                      {/* Completion Time */}
                      <div className={`flex items-center space-x-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">⏰</span>
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Expected Completion
                          </h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {endDateTime.time}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {endDateTime.shortDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preparation Tip */}
                  {schedule.status === 'scheduled' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <span className="text-blue-500 text-lg">💡</span>
                        <div>
                          <h5 className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                            Preparation Tip
                          </h5>
                          <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            Please have your bins ready outside by{' '}
                        {new Date(new Date(schedule.scheduledStart).getTime() - 30 * 60 * 1000).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        (30 minutes before collection)
                      </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-12 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl text-center`}>
            <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">📅</span>
        </div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {filter === 'all' ? 'No Collections Scheduled' :
               filter === 'scheduled' ? 'No Scheduled Collections' :
               filter === 'in-progress' ? 'No Collections In Progress' :
               'No Completed Collections'}
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 max-w-md mx-auto`}>
              {filter === 'all' ? 'Collections will be automatically scheduled when enough reports are received in your zone.' :
               filter === 'scheduled' ? 'No upcoming collections are currently scheduled.' :
               filter === 'in-progress' ? 'No collection activities are currently in progress.' :
               'No collections have been completed yet.'}
            </p>
            {filter === 'all' && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Keep reporting when your bin is full to help optimize collection routes!
            </p>
            )}
        </div>
      )}

      {/* Collection Guidelines */}
        <div className={`mt-8 ${isDarkMode ? 'bg-gradient-to-br from-green-900/50 to-blue-900/50' : 'bg-gradient-to-br from-green-100/80 to-blue-100/80'} backdrop-blur-lg rounded-2xl p-8 border ${isDarkMode ? 'border-green-800' : 'border-green-200'} shadow-2xl`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Collection Guidelines
          </h3>
              <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Important information for waste collection day
          </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📋</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '🗑️',
                title: 'General Waste',
                description: 'Place bins outside by 30 minutes before scheduled collection time',
                color: 'from-gray-500 to-gray-600'
              },
              {
                icon: '♻️',
                title: 'Recyclables',
                description: 'Clean and sort items before disposal. Remove caps and labels when possible',
                color: 'from-green-500 to-teal-500'
              },
              {
                icon: '🍎',
                title: 'Organic Waste',
                description: 'Use compostable bags for food waste. No meat or dairy products',
                color: 'from-orange-500 to-yellow-500'
              },
              {
                icon: '📦',
                title: 'Special Items',
                description: 'Contact dispatcher for bulk item pickup or hazardous waste disposal',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((guideline, index) => (
              <div key={index} className={`flex items-start space-x-4 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/30' : 'bg-white/40'} backdrop-blur-sm`}>
                <div className={`w-12 h-12 bg-gradient-to-br ${guideline.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xl">{guideline.icon}</span>
            </div>
            <div>
                  <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {guideline.title}
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {guideline.description}
                  </p>
                </div>
            </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 