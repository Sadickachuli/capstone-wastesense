import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useWasteSites } from '../../hooks/useWasteSites';

export default function RecyclerNotifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const { sites } = useWasteSites();

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {notifications.filter(n => !n.read).length} unread
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
          <div key={date} className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700">{date}</h2>
            <div className="space-y-3">
              {dateNotifications.map(notification => {
                const site = sites.find(s => s.id === notification.metadata?.siteId);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.read 
                        ? 'bg-white border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        {site && (
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Site Details:</span>
                            <ul className="mt-1 list-disc list-inside pl-4">
                              <li>Current Capacity: {site.currentCapacity}/{site.maxCapacity} tons</li>
                              <li>Location: {site.location}</li>
                              <li>Last Updated: {new Date(site.lastUpdated || '').toLocaleString()}</li>
                            </ul>
                          </div>
                        )}
                        <div className="mt-3">
                          <button
                            onClick={() => handleNotificationClick(notification.id, notification.metadata?.siteId)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            View Full Details →
                          </button>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedNotifications).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 