import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import UserSettings from '../../components/settings/UserSettings';
import { environment } from '../../config/environment';
import axios from 'axios';

type TabType = 'profile' | 'settings';

export default function Profile() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const tabs: { id: TabType; name: string; icon: string }[] = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const API_BASE_URL = environment.getApiUrl();
      await axios.delete(`${API_BASE_URL}/auth/account/${user?.id}`, {
        data: { password: deletePassword }
      });

      // Account deleted successfully, logout user
      logout();
      alert('Your account has been deleted successfully. Thank you for using WasteSense!');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      if (error.response?.data?.message) {
        setDeleteError(error.response.data.message);
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteError('');
  };

  const formatMemberSince = () => {
    const date = new Date(user?.createdAt || '');
    if (user?.role === 'recycler' || user?.role === 'dispatcher') {
      return '28th May 2025';
    }
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Unknown';
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-green-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            My Account
          </h1>
          <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your profile information and account settings
          </p>
        </div>

      {/* Tabs */}
        <div className="mb-8">
      <div className="flex justify-center">
            <nav className={`flex rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg p-1 shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-white/20'}`} aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center space-x-2
                ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg transform scale-105'
                      : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} hover:scale-102`}`}
            >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
            </button>
          ))}
        </nav>
          </div>
      </div>

      {activeTab === 'profile' ? (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-8 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
              <div className="flex flex-col items-center text-center">
            {/* Avatar */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <span className="text-white font-bold text-4xl">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">🏠</span>
                  </div>
                </div>

                {/* User Info */}
                <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name}
                </h2>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className={`text-lg font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Resident Account
                  </span>
                </div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
                  Thank you for being part of the WasteSense community and helping make Ghana cleaner!
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-8 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Account Information
                </h3>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📋</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📧</span>
                    </div>
                    <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Email Address
                    </dt>
                  </div>
                  <dd className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.email}
                  </dd>
                </div>

                {/* Phone */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📱</span>
                    </div>
                    <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Phone Number
                    </dt>
                  </div>
                  <dd className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.phone || 'Not provided'}
                  </dd>
                </div>

                {/* Zone */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📍</span>
                    </div>
                    <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Zone
                    </dt>
                  </div>
                  <dd className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.zone}
                  </dd>
                </div>

                {/* Member Since */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🗓️</span>
                    </div>
                    <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Member Since
                    </dt>
                  </div>
                  <dd className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatMemberSince()}
                  </dd>
                </div>
              </div>
            </div>
            
            {/* Account Actions */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-red-900/50 to-pink-900/50' : 'bg-gradient-to-r from-red-50 to-pink-50'} backdrop-blur-lg rounded-2xl p-8 border ${isDarkMode ? 'border-red-800' : 'border-red-200'} shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Danger Zone
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚠️</span>
                </div>
              </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Delete Account
                </button>
              </div>
            </div>
        ) : (
          <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-lg rounded-2xl p-8 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} shadow-2xl`}>
            <UserSettings role="resident" />
          </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">⚠️</span>
                  </div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Delete Account
            </h2>
                </div>
                <button
                  onClick={handleCancelDelete}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'} mb-2`}>
                    This action cannot be undone!
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    All your reports and data will be permanently removed from our system.
                  </p>
                </div>

                <div>
                  <label htmlFor="deletePassword" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  placeholder="Enter your password"
                />
              </div>
              
              {deleteError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">❌</span>
                      <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                    className={`flex-1 py-3 px-4 border rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2">⏳</span>
                        Deleting...
                      </span>
                    ) : (
                      'Delete Account'
                    )}
              </button>
                </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 