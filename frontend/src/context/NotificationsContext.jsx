import { createContext, useCallback, useContext, useState } from 'react';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((userId, message, { forAdmin = false } = {}) => {
    setNotifications((prev) => [
      { id: Date.now().toString() + Math.random().toString().slice(2, 6), userId, message, forAdmin, read: false, date: new Date().toISOString() },
      ...prev
    ]);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const getNotificationsForUser = useCallback(
    (userId, isAdmin = false) => {
      return notifications.filter((n) => n.userId === userId || (isAdmin && n.forAdmin));
    },
    [notifications]
  );

  const value = {
    notifications,
    addNotification,
    markAsRead,
    getNotificationsForUser
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
