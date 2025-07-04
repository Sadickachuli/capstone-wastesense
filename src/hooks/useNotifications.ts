import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { api } from '../api/mockApi';
import { useAuth } from '../context/AuthContext';
import { environment } from '../config/environment';
import axios from 'axios';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        let data;
        if (user.role === 'recycler') {
          // Fetch from real backend for recyclers
          const API_BASE_URL = environment.getApiUrl();
          const res = await axios.get(`${API_BASE_URL}/auth/notifications/recycler`);
          data = res.data.notifications;
          // Ensure metadata is always an object
          data = data.map(n => ({
            ...n,
            metadata: typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata,
            timestamp: n.timestamp || n.created_at || '', // Map created_at to timestamp
          }));
          console.log('Fetched recycler notifications:', data);
        } else {
          // Use mock API for other roles
          data = await api.notifications.list(user.id);
        }
        setNotifications(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch notifications');
        console.error('Notification fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // You could add real-time updates here using WebSocket
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return {
    notifications,
    unreadNotifications: notifications.filter(n => !n.read),
    loading,
    error,
    markAsRead,
  };
} 