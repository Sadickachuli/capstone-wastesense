import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import UserSettings from '../../components/settings/UserSettings';

type TabType = 'profile' | 'settings';

export default function Profile() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs: { id: TabType; name: string; icon: string }[] = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  const formatMemberSince = (date: string | undefined) => {
    if (!date) return 'Unknown';
    if (user?.role === 'recycler' || user?.role === 'dispatcher') {
      return '28th May 2025';
    }
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dispatcher Profile
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your account and system preferences
          </p>
        </div>

        {/* Enhanced Tabs */}
      <div className="flex justify-center">
          <nav className="flex rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-lg p-1.5 w-fit border border-white/20 dark:border-gray-700/20" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm
                ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg transform scale-105'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
            >
                <span className="text-lg">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'profile' ? (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/20">
              
              {/* Profile Header */}
              <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-400 to-blue-400 dark:from-green-700 dark:to-blue-700 flex items-center justify-center text-white text-5xl font-bold shadow-xl mb-6">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'D'}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {user?.name || 'Dispatcher'}
                </h2>
                <div className="inline-block">
                  <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    🚛 Dispatcher Account
                  </span>
            </div>
                <p className="text-gray-600 dark:text-gray-300 mt-4 text-lg">
                  Managing waste collection operations across zones
                </p>
              </div>

              {/* Account Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                
                {/* Email Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📧</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user?.email || 'No email provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl p-6 border border-green-200/30 dark:border-green-700/30 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📱</span>
                    </div>
              <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user?.phone || 'No phone provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl p-6 border border-purple-200/30 dark:border-purple-700/30 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">👨‍💼</span>
              </div>
              <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Dispatcher'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Member Since Card */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/50 dark:to-yellow-900/50 rounded-2xl p-6 border border-orange-200/30 dark:border-orange-700/30 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📅</span>
              </div>
              <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatMemberSince(user?.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* System Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-800/50 dark:to-blue-800/50 rounded-xl p-4 text-center border border-green-200/30 dark:border-green-700/30">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">2</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Active Zones</div>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-800/50 dark:to-indigo-800/50 rounded-xl p-4 text-center border border-blue-200/30 dark:border-blue-700/30">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">5</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Fleet Vehicles</div>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800/50 dark:to-pink-800/50 rounded-xl p-4 text-center border border-purple-200/30 dark:border-purple-700/30">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">98%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Efficiency Rate</div>
                </div>
              </div>

          </div>
        </div>
      ) : (
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/20 dark:border-gray-700/20 overflow-hidden">
        <UserSettings role="dispatcher" />
            </div>
          </div>
      )}
      </div>
    </div>
  );
} 