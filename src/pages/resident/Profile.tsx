import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserSettings from '../../components/settings/UserSettings';
import { environment } from '../../config/environment';
import axios from 'axios';

type TabType = 'profile' | 'settings';

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const tabs: { id: TabType; name: string }[] = [
    { id: 'profile', name: 'Profile' },
    { id: 'settings', name: 'Settings' },
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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* Tabs */}
      <div className="flex justify-center">
        <nav className="flex rounded-full bg-gray-100 dark:bg-gray-800 shadow-inner p-1 w-fit" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)]'
                  : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'profile' ? (
        <div className="flex flex-col items-center">
          <div className="w-full bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 shadow-[0_4px_24px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_24px_0_rgba(34,197,94,0.25)] rounded-3xl p-8 flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-400 dark:from-green-700 dark:to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">{user?.name}</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-6">Resident Account</p>
            <div className="w-full border-t border-gray-200 dark:border-gray-700 mb-6"></div>
            {/* Details */}
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 w-full">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Email address</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white font-semibold">{user?.email}</dd>
                </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Phone number</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white font-semibold">{user?.phone}</dd>
                </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Zone</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white font-semibold">{user?.zone}</dd>
                </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Member since</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white font-semibold">
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
                  </dd>
                </div>
              </dl>
            
            {/* Account Actions */}
            <div className="w-full border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
              <div className="flex justify-center">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <UserSettings role="resident" />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete Account
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                ⚠️ All your reports and data will be permanently removed.
              </p>
              
              <div className="mb-4">
                <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your password"
                />
              </div>
              
              {deleteError && (
                <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                  {deleteError}
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 