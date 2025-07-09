import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useTheme } from '../../context/ThemeContext';

export default function RecyclerNotifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const { sites } = useWasteSites();
  const { isDarkMode } = useTheme();

  const handleNotificationClick = async (notificationId: string, siteId?: string) => {
    await markAsRead(notificationId);
    if (siteId) {
      navigate(`/recycler/sites/${siteId}`);
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (title: string) => {
    if (title.toLowerCase().includes('capacity')) return '📊';
    if (title.toLowerCase().includes('collection')) return '🚛';
    if (title.toLowerCase().includes('waste')) return '🗑️';
    if (title.toLowerCase().includes('alert')) return '⚠️';
    if (title.toLowerCase().includes('update')) return '📝';
    return '🔔';
  };

  const getNotificationColor = (title: string) => {
    if (title.toLowerCase().includes('capacity')) return 'from-orange-400 to-red-500';
    if (title.toLowerCase().includes('collection')) return 'from-blue-400 to-blue-600';
    if (title.toLowerCase().includes('waste')) return 'from-green-400 to-green-600';
    if (title.toLowerCase().includes('alert')) return 'from-yellow-400 to-orange-500';
    if (title.toLowerCase().includes('update')) return 'from-purple-400 to-purple-600';
    return 'from-gray-400 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🔔</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Stay updated with waste management activities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="font-semibold">{unreadCount} unread</span>
                </div>
              )}
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {notifications.length} total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Content */}
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm">📅</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{date}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600"></div>
              </div>

              {/* Notifications for this date */}
              <div className="space-y-4">
                {dateNotifications.map(notification => {
                  const site = sites.find(s => s.id === notification.metadata?.siteId);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                        notification.read 
                          ? 'border-white/20 dark:border-gray-700/20' 
                          : 'border-blue-200 dark:border-blue-400/30 ring-2 ring-blue-500/20'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Notification Icon */}
                          <div className={`w-12 h-12 bg-gradient-to-br ${getNotificationColor(notification.title)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-lg">
                              {getNotificationIcon(notification.title)}
                            </span>
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                  <span>✨</span>
                                  New
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                              {notification.message}
                            </p>

                            {/* Site Details */}
                            {site && (
                              <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-4 mb-4">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                  <span className="text-sm">🏢</span>
                                  Site Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">📊</span>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {site.currentCapacity}/{site.maxCapacity} tons
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">📍</span>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {site.location}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">🕐</span>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {new Date(site.lastUpdated || '').toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Button */}
                            <button
                              onClick={() => handleNotificationClick(notification.id, notification.metadata?.siteId)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                            >
                              <span>👁️</span>
                              View Full Details
                            </button>
                          </div>

                          {/* Timestamp */}
                          <div className="text-right">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {Object.keys(groupedNotifications).length === 0 && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl">📭</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                No Notifications Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You'll receive notifications about waste collection updates, site capacity alerts, and important announcements here.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  💡 Tip: Notifications will appear automatically when there are updates to waste sites or collection schedules.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 