import { useState, useCallback, useRef, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { handleError } from '../lib/errorHandler';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export const useNotifications = () => {
  const { user, supabase } = useSupabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const addNotification = useCallback(async (
    type: Notification['type'], 
    title: string, 
    message: string
  ): Promise<void> => {
    if (!user || !supabase) return;

    try {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        title,
        message,
        timestamp: new Date()
      };

      // Add to local state
      if (mountedRef.current) {
        setNotifications(prev => [notification, ...prev]);
        setShowNotification(true);
      }

      // Save to database
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.timestamp.toISOString()
        });

      if (error) {
        console.error('Failed to save notification to database:', error);
      }

      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (mountedRef.current) {
          setShowNotification(false);
        }
      }, 5000);

    } catch (error) {
      const { userMessage } = handleError(error, 'addNotification');
      console.error('Error adding notification:', userMessage);
    }
  }, [user, supabase]);

  const removeNotification = useCallback(async (id: string): Promise<void> => {
    if (!user || !supabase) return;

    try {
      // Remove from local state
      if (mountedRef.current) {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      }

      // Remove from database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id);

      if (error) {
        console.error('Failed to remove notification from database:', error);
      }
    } catch (error) {
      const { userMessage } = handleError(error, 'removeNotification');
      console.error('Error removing notification:', userMessage);
    }
  }, [user, supabase]);

  const clearAllNotifications = useCallback(async (): Promise<void> => {
    if (!user || !supabase) return;

    try {
      // Clear local state
      if (mountedRef.current) {
        setNotifications([]);
      }

      // Clear from database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to clear notifications from database:', error);
      }
    } catch (error) {
      const { userMessage } = handleError(error, 'clearAllNotifications');
      console.error('Error clearing notifications:', userMessage);
    }
  }, [user, supabase]);

  const loadNotifications = useCallback(async (): Promise<void> => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (mountedRef.current) {
        const formattedNotifications: Notification[] = (data || []).map(item => ({
          id: item.id,
          type: item.type as Notification['type'],
          title: item.title,
          message: item.message,
          timestamp: new Date(item.timestamp)
        }));

        setNotifications(formattedNotifications);
      }
    } catch (error) {
      const { userMessage } = handleError(error, 'loadNotifications');
      console.error('Error loading notifications:', userMessage);
    }
  }, [user, supabase]);

  const hideNotification = useCallback(() => {
    if (mountedRef.current) {
      setShowNotification(false);
    }
  }, []);

  return {
    notifications,
    showNotification,
    addNotification,
    removeNotification,
    clearAllNotifications,
    loadNotifications,
    hideNotification
  };
};