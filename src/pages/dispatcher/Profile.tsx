import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserSettings from '../../components/settings/UserSettings';

type TabType = 'profile' | 'settings';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs: { id: TabType; name: string }[] = [
    { id: 'profile', name: 'Profile' },
    { id: 'settings', name: 'Settings' },
  ];

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
            <p className="text-gray-500 dark:text-gray-300 mb-6">Dispatcher Account</p>
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
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Role</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white font-semibold">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Member since</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white font-semibold">{new Date(user?.createdAt || '').toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <UserSettings role="dispatcher" />
      )}
    </div>
  );
} 