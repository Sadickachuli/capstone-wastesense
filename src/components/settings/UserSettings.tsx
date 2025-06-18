import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface UserSettingsProps {
  role: 'resident' | 'dispatcher' | 'recycler';
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultNotifications: Record<string, NotificationSetting[]> = {
  resident: [
    {
      id: 'collection',
      label: 'Collection Reminders',
      description: 'Get notified about upcoming waste collections',
      enabled: true,
    },
    {
      id: 'reports',
      label: 'Report Updates',
      description: 'Receive updates about your submitted reports',
      enabled: true,
    },
  ],
  dispatcher: [
    {
      id: 'route_alerts',
      label: 'Route Alerts',
      description: 'Receive notifications for route changes and delays',
      enabled: true,
    },
    {
      id: 'daily_reports',
      label: 'Daily Reports',
      description: 'Receive daily summary reports of all routes',
      enabled: true,
    },
  ],
  recycler: [
    {
      id: 'delivery_alerts',
      label: 'Delivery Notifications',
      description: 'Get notified about incoming waste deliveries',
      enabled: true,
    },
    {
      id: 'weekly_reports',
      label: 'Weekly Reports',
      description: 'Receive weekly recycling performance reports',
      enabled: true,
    },
  ],
};

export default function UserSettings({ role }: UserSettingsProps) {
  const { user, setUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(defaultNotifications[role]);

  const handleThemeToggle = () => {
    toggleDarkMode();
  };

  const handleNotificationToggle = (notificationId: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, enabled: !notification.enabled }
          : notification
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Theme Settings
          </h3>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="flex-grow flex flex-col">
                <span className="text-sm font-medium text-gray-900">Dark Mode</span>
                <span className="text-sm text-gray-500">
                  Enable dark mode for a better viewing experience at night
                </span>
              </span>
              <button
                type="button"
                onClick={handleThemeToggle}
                className={`${
                  isDarkMode ? 'bg-primary-600' : 'bg-gray-200'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                role="switch"
                aria-checked={isDarkMode}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Notification Settings
          </h3>
          <div className="mt-4 space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between"
              >
                <div className="flex items-center h-5">
                  <input
                    id={notification.id}
                    name={notification.id}
                    type="checkbox"
                    checked={notification.enabled}
                    onChange={() => handleNotificationToggle(notification.id)}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 flex-grow">
                  <label
                    htmlFor={notification.id}
                    className="text-sm font-medium text-gray-700"
                  >
                    {notification.label}
                  </label>
                  <p className="text-sm text-gray-500">{notification.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            // In a real app, you would save all settings to your backend here
            console.log('Saving settings:', {
              darkMode: isDarkMode,
              notifications,
            });
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
} 