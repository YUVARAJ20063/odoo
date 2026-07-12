import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Fetch notifications from the backend
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('https://heavy-cars-bake.loca.lt/api/system/notifications', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = async (id) => {
    if (!user) return;
    try {
      const response = await fetch(`https://heavy-cars-bake.loca.lt/api/system/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  // Add a toast notification dynamically
  const showToast = useCallback((title, message, type = 'Info') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch notifications on user sign-in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30s to keep it fresh
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      toasts,
      showToast,
      dismissToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
