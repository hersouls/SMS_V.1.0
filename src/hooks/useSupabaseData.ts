import { useState, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { ERROR_MESSAGES } from '../lib/utils';

interface UseSupabaseDataOptions {
  onError?: (error: string) => void;
}

export const useSupabaseData = (options: UseSupabaseDataOptions = {}) => {
  const { user, supabase } = useSupabase();
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((error: any, fallbackMessage: string) => {
    const errorMessage = error?.message || fallbackMessage;
    console.error(errorMessage, error);
    if (options.onError) {
      options.onError(errorMessage);
    }
  }, [options]);

  const loadSubscriptions = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, ERROR_MESSAGES.SUBSCRIPTION_LOAD_FAILED);
        return [];
      }

      return data || [];
    } catch (error) {
      handleError(error, ERROR_MESSAGES.GENERIC_ERROR);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, supabase, handleError]);

  const loadNotifications = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        handleError(error, 'Error loading notifications');
        return [];
      }

      return data || [];
    } catch (error) {
      handleError(error, ERROR_MESSAGES.GENERIC_ERROR);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, supabase, handleError]);

  const loadAlarmHistory = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alarm_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        handleError(error, 'Error loading alarm history');
        return [];
      }

      return data || [];
    } catch (error) {
      handleError(error, ERROR_MESSAGES.GENERIC_ERROR);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, supabase, handleError]);

  const saveNotification = useCallback(async (
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
        });

      if (error) {
        handleError(error, ERROR_MESSAGES.NOTIFICATION_SAVE_FAILED);
      }
    } catch (error) {
      handleError(error, ERROR_MESSAGES.GENERIC_ERROR);
    }
  }, [user, supabase, handleError]);

  return {
    loading,
    loadSubscriptions,
    loadNotifications,
    loadAlarmHistory,
    saveNotification,
  };
};