import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  type: 'general' | 'recyclable' | 'organic';
  status: 'scheduled' | 'completed' | 'missed';
}

// Mock data for demonstration
const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    date: '2024-03-21',
    time: '09:00',
    type: 'general',
    status: 'scheduled',
  },
  {
    id: '2',
    date: '2024-03-23',
    time: '10:30',
    type: 'recyclable',
    status: 'scheduled',
  },
  {
    id: '3',
    date: '2024-03-20',
    time: '08:00',
    type: 'organic',
    status: 'completed',
  },
];

export default function Schedule() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Collection Schedule</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Upcoming Collections
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your waste collection schedule for {user?.zone}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {mockSchedule.map((item) => (
              <li key={item.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-4 ${
                        item.type === 'general'
                          ? 'bg-gray-500'
                          : item.type === 'recyclable'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.time} - {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Waste
                      </p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'missed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-black dark:text-black'
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg card dark:shadow-white dark:border-white">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Collection Guidelines
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">General Waste</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Place bins outside by 7 AM on collection day
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Recyclables</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Clean and sort items before disposal
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Organic Waste</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Use compostable bags for food waste
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Special Items</dt>
              <dd className="mt-1 text-sm text-gray-900">
                Contact dispatcher for bulk item pickup
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 