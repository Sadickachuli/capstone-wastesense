import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import UserSettings from '../../components/settings/UserSettings';

type TabType = 'profile' | 'settings';

export default function Profile() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs: { id: TabType; name: string; icon: string }[] = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Account Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your profile and system preferences
          </p>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex justify-center mb-8">
          <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-2" aria-label="Tabs">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-3 min-w-[140px] justify-center
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg transform scale-105'
                      : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-102'}`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-8">
            {/* Main Profile Card */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
                {/* Avatar Section */}
                <div className="flex flex-col items-center lg:items-start mb-8 lg:mb-0">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'RC'}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                      <span className="text-white text-lg">♻️</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-4 mb-2 text-center lg:text-left">
                    {user?.name || 'Recycler'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 px-4 py-2 rounded-full">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        🌱 Recycler Account
                      </span>
                    </span>
                  </div>
                </div>

                {/* Account Details */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg">📧</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Email Address</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Primary contact</p>
                        </div>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium break-all">
                        {user?.email || 'Not provided'}
                      </p>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg">📱</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Phone Number</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Contact number</p>
                        </div>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {user?.phone || 'Not provided'}
                      </p>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg">🎭</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Account Role</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">System access level</p>
                        </div>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium capitalize">
                        {user?.role || 'Recycler'}
                      </p>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg">📅</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Member Since</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Account creation</p>
                        </div>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">
                        {(() => {
                          const date = new Date(user?.createdAt || '');
                          if (user?.role === 'recycler' || user?.role === 'dispatcher') {
                            return '28th May 2025';
                          }
                          if (!isNaN(date.getTime())) {
                            return date.toLocaleDateString();
                          }
                          return 'Unknown';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🏆</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Active Recycler</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contributing to environmental sustainability
                </p>
              </div>

              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Analytics Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full dashboard and reporting capabilities
                </p>
              </div>

              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🔔</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Real-time Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Instant notifications for waste updates
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8">
            <UserSettings role="recycler" />
          </div>
        )}
      </div>
    </div>
  );
} 