import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Collection Schedule</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Zone: <span className="font-semibold">{user?.zone || 'Not assigned'}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <p className="text-gray-500 dark:text-gray-400 text-center">Loading collection schedules...</p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      ) : schedules.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Collection Schedule
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Upcoming and current waste collections for {user?.zone}
            </p>
          </div>
          
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const startDateTime = formatDateTime(schedule.scheduledStart);
              const endDateTime = formatDateTime(schedule.estimatedCompletion);
              
              return (
                <div
                  key={schedule.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🚛</span>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {startDateTime.date}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {schedule.zone} Collection
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400">🕐</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Collection Time</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {startDateTime.time} - {endDateTime.time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">🚚</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Vehicle</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {schedule.vehicle.make} {schedule.vehicle.model} ({schedule.vehicle.registrationNumber || schedule.vehicle.id})
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {getVehicleTypeDisplay(schedule.vehicle.type)}
                          </div>
                        </div>
                      </div>

                      {schedule.driverName && (
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600 dark:text-purple-400">👤</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Driver</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {schedule.driverName}
                              {schedule.driverContact && (
                                <span className="ml-2 text-xs">({schedule.driverContact})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600 dark:text-orange-400">📊</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Collection Details</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {schedule.reportsCount} reports • {schedule.estimatedDistance}km route
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Est. fuel: {schedule.estimatedFuelConsumption}L
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400">⏰</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Expected Completion</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {endDateTime.time} on {endDateTime.date}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preparation tip based on schedule time */}
                  {schedule.status === 'scheduled' && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 <strong>Tip:</strong> Please have your bins ready outside by{' '}
                        {new Date(new Date(schedule.scheduledStart).getTime() - 30 * 60 * 1000).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        (30 minutes before collection)
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">📅</span>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Collections Scheduled
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Collections will be automatically scheduled when enough reports are received in your zone.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Keep reporting when your bin is full to help optimize collection routes!
            </p>
          </div>
        </div>
      )}

      {/* Collection Guidelines */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-3xl p-8 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]">
        <div className="mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Collection Guidelines
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Important information for waste collection day
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <span>🗑️</span> General Waste
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Place bins outside by 30 minutes before scheduled collection time
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <span>♻️</span> Recyclables
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Clean and sort items before disposal. Remove caps and labels when possible
              </dd>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <span>🍎</span> Organic Waste
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Use compostable bags for food waste. No meat or dairy products
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <span>📦</span> Special Items
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Contact dispatcher for bulk item pickup or hazardous waste disposal
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 