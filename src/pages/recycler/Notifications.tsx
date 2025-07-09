import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useWasteSites } from '../../hooks/useWasteSites';
import { useTheme } from '../../context/ThemeContext';

export default function RecyclerNotifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const { sites } = useWasteSites();
  const { isDarkMode } = useTheme();
  const [animationInView, setAnimationInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setAnimationInView(true);
    }
  }, []);

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
    if (title.toLowerCase().includes('capacity')) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    if (title.toLowerCase().includes('collection')) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (title.toLowerCase().includes('waste')) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    }
    if (title.toLowerCase().includes('alert')) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    if (title.toLowerCase().includes('update')) {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-2-6h-2.5A5.5 5.5 0 0 0 .5 16.5 5.5 5.5 0 0 0 6 22h10a2 2 0 0 0 2-2V13a2 2 0 0 0-2-2h-3zm-9 3h2.5a1.5 1.5 0 0 1 1.5 1.5v.5a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5v-.5A1.5 1.5 0 0 1 4 14z" />
      </svg>
    );
  };

  const getNotificationColor = (title: string) => {
    if (title.toLowerCase().includes('capacity')) return 'bg-orange-500';
    if (title.toLowerCase().includes('collection')) return 'bg-blue-500';
    if (title.toLowerCase().includes('waste')) return 'bg-green-500';
    if (title.toLowerCase().includes('alert')) return 'bg-yellow-500';
    if (title.toLowerCase().includes('update')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const fadeInAnimation = {
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
  };

  const slideInAnimation = (delay: number = 0) => ({
    opacity: animationInView ? 1 : 0,
    transform: animationInView ? 'translateY(0)' : 'translateY(30px)',
    transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-green-950 dark:via-gray-900 dark:to-green-900">
      <div className="max-w-4xl mx-auto px-4 py-8" ref={containerRef}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8" style={fadeInAnimation}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-2-6h-2.5A5.5 5.5 0 0 0 .5 16.5 5.5 5.5 0 0 0 6 22h10a2 2 0 0 0 2-2V13a2 2 0 0 0-2-2h-3zm-9 3h2.5a1.5 1.5 0 0 1 1.5 1.5v.5a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5v-.5A1.5 1.5 0 0 1 4 14z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Stay updated with waste management activities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-medium">{unreadCount} unread</span>
                </div>
              )}
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {notifications.length} total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Content */}
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([date, dateNotifications], index) => (
            <div key={date} className="space-y-4" style={slideInAnimation(index * 0.1)}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{date}</h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Notifications for this date */}
              <div className="space-y-4">
                {dateNotifications.map((notification, notificationIndex) => {
                  const site = sites.find(s => s.id === notification.metadata?.siteId);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
                        notification.read 
                          ? 'border-gray-200 dark:border-gray-700' 
                          : 'border-blue-200 dark:border-blue-700 ring-1 ring-blue-500/20'
                      }`}
                      style={slideInAnimation((index * 0.1) + (notificationIndex * 0.05))}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Notification Icon */}
                          <div className={`w-10 h-10 ${getNotificationColor(notification.title)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            {getNotificationIcon(notification.title)}
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                                  New
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                              {notification.message}
                            </p>

                            {/* Site Details */}
                            {site && (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h4a1 1 0 011 1v5m-6 0h6" />
                                  </svg>
                                  Site Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {site.currentCapacity}/{site.maxCapacity} tons
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {site.location}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center" style={fadeInAnimation}>
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.5a2.5 2.5 0 00-2.5 2.5v1a2.5 2.5 0 01-2.5 2.5H5.5a2.5 2.5 0 00-2.5 2.5v2.5a2.5 2.5 0 01-2.5 2.5H5.5a2.5 2.5 0 00-2.5 2.5v1a2.5 2.5 0 01-2.5 2.5H2.5a2.5 2.5 0 00-2.5 2.5v2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Notifications Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You'll receive notifications about waste collection updates, site capacity alerts, and important announcements here.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
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