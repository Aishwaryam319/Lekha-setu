import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NotificationItem } from '../types';
import { dbService } from '../services/storage';

interface NotificationInput {
  type: NotificationItem['type'];
  titleEn: string;
  titleKn: string;
  messageEn: string;
  messageKn: string;
  documentId?: string;
  targetRoute?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (input: NotificationInput) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    dbService
      .getAllNotifications()
      .then((items) => setNotifications(items))
      .catch((err) => console.error('Failed to load notifications:', err));
  }, []);

  const addNotification = useCallback(async (input: NotificationInput) => {
    const item: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 100));
    try {
      await dbService.saveNotification(item);
    } catch (err) {
      console.error('Failed to persist notification:', err);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.read) {
          const updated = { ...n, read: true };
          dbService.saveNotification(updated).catch(console.error);
          return updated;
        }
        return n;
      })
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.read) {
          const updated = { ...n, read: true };
          dbService.saveNotification(updated).catch(console.error);
          return updated;
        }
        return n;
      })
    );
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await dbService.clearNotifications();
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
