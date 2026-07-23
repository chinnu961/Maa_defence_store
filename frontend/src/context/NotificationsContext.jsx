import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { fetchNotifications, markNotificationRead as apiMarkAsRead } from '../api/notifications.js';
import { getToken } from '../api/client.js';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchNotifications();
      // Backend returns them sorted, but let's ensure they are set in state
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll notifications every 8 seconds if token exists
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      const token = getToken();
      if (token) {
        loadNotifications();
      } else {
        setNotifications([]);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const addNotification = useCallback((userId, message, { forAdmin = false } = {}) => {
    // Over the network, the backend triggers notifications when relevant actions occur.
    // In frontend, calling this can trigger a refresh to get the latest.
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiMarkAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const getNotificationsForUser = useCallback(
    (userId, isAdmin = false) => {
      // In the new backend-driven flow, notifications returned by GET /api/notifications
      // are already filtered correctly for the logged-in user.
      return notifications;
    },
    [notifications]
  );

  const value = {
    notifications,
    loading,
    addNotification,
    markAsRead,
    getNotificationsForUser,
    refreshNotifications: loadNotifications
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
