import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { AlarmHistory, Notification } from '../types/subscription';
import { useErrorHandler } from '../lib/errorHandlingSystem';
import { 
  CheckCircleIcon, XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon,
  PlusIcon, PencilIcon, TrashIcon, BellIcon, CreditCardIcon
} from '@heroicons/react/24/outline';

export const useNotificationManager = () => {
  const { supabase, user } = useSupabase();
  const { setError } = useErrorHandler();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alarmHistory, setAlarmHistory] = useState<AlarmHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user notifications
  const loadUserNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      await Promise.all([
        loadUserAlarmHistory(),
        loadUserNotificationsFromDB()
      ]);
    } catch (error) {
      setError('알림 데이터 로딩 중 오류가 발생했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load alarm history
  const loadUserAlarmHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alarm_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedAlarms = data?.map(alarm => ({
        id: alarm.id,
        type: alarm.type,
        content: alarm.content,
        target: alarm.target,
        date: alarm.created_at,
        datetime: alarm.created_at,
        icon: getAlarmIcon(alarm.type),
        iconBackground: getAlarmIconBackground(alarm.type),
        subscriptionId: alarm.subscription_id,
        subscriptionImage: alarm.subscription_image
      })) || [];

      setAlarmHistory(formattedAlarms);
    } catch (error) {
      setError('알람 히스토리를 불러오는 중 오류가 발생했습니다.', error);
    }
  }, [user, supabase, setError]);

  // Load notifications from DB (if stored)
  const loadUserNotificationsFromDB = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = data?.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at)
      })) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      console.warn('알림 데이터를 불러오는 중 오류가 발생했습니다:', error);
      // 알림 로딩 실패는 치명적이지 않으므로 에러로 처리하지 않음
    }
  }, [user, supabase]);

  // Get alarm icon
  const getAlarmIcon = useCallback((type: string) => {
    switch (type) {
      case 'subscription_added':
        return PlusIcon;
      case 'subscription_updated':
        return PencilIcon;
      case 'subscription_deleted':
        return TrashIcon;
      case 'renewal_reminder':
        return BellIcon;
      case 'payment_due':
        return CreditCardIcon;
      default:
        return BellIcon;
    }
  }, []);

  // Get alarm icon background
  const getAlarmIconBackground = useCallback((type: string): string => {
    switch (type) {
      case 'subscription_added':
        return 'bg-green-500';
      case 'subscription_updated':
        return 'bg-blue-500';
      case 'subscription_deleted':
        return 'bg-red-500';
      case 'renewal_reminder':
        return 'bg-yellow-500';
      case 'payment_due':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  }, []);

  // Add notification
  const addNotification = useCallback(async (type: Notification['type'], title: string, message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Store in database
    if (user) {
      try {
        await supabase
          .from('notifications')
          .insert([{
            user_id: user.id,
            type,
            title,
            message,
            is_read: false
          }]);
      } catch (error) {
        console.warn('알림 저장 중 오류가 발생했습니다:', error);
      }
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  }, [user, supabase]);

  // Add alarm history
  const addAlarmHistory = useCallback(async (type: AlarmHistory['type'], content: string, target: string, subscriptionId?: string) => {
    const newAlarm: AlarmHistory = {
      id: Date.now().toString(),
      type,
      content,
      target,
      date: new Date().toISOString(),
      datetime: new Date().toISOString(),
      icon: getAlarmIcon(type),
      iconBackground: getAlarmIconBackground(type),
      subscriptionId,
      subscriptionImage: undefined
    };

    setAlarmHistory(prev => [newAlarm, ...prev]);

    // Store in database
    if (user) {
      try {
        await supabase
          .from('alarm_history')
          .insert([{
            user_id: user.id,
            type,
            content,
            target,
            subscription_id: subscriptionId
          }]);
      } catch (error) {
        console.warn('알람 히스토리 저장 중 오류가 발생했습니다:', error);
      }
    }
  }, [user, supabase, getAlarmIcon, getAlarmIconBackground]);

  // Remove notification
  const removeNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));

    // Mark as read in database
    if (user) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (error) {
        console.warn('알림 상태 업데이트 중 오류가 발생했습니다:', error);
      }
    }
  }, [user, supabase]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);

    // Mark all as read in database
    if (user) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
      } catch (error) {
        console.warn('모든 알림 상태 업데이트 중 오류가 발생했습니다:', error);
      }
    }
  }, [user, supabase]);

  // Get notification icon
  const getNotificationIcon = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'error':
        return XMarkIcon;
      case 'info':
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  }, []);

  // Toast Container Component
  const ToastContainer = useCallback(() => {
    return React.createElement('div', { className: 'fixed top-4 right-4 z-50 space-y-2' },
      notifications.map(notification => 
        React.createElement('div', {
          key: notification.id,
          className: `max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            notification.type === 'success' ? 'ring-green-500' :
            notification.type === 'warning' ? 'ring-yellow-500' :
            notification.type === 'error' ? 'ring-red-500' :
            'ring-blue-500'
          }`
        },
          React.createElement('div', { className: 'p-4' },
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('div', { className: 'flex-shrink-0' },
                React.createElement(getNotificationIcon(notification.type), {
                  className: `h-6 w-6 ${
                    notification.type === 'success' ? 'text-green-400' :
                    notification.type === 'warning' ? 'text-yellow-400' :
                    notification.type === 'error' ? 'text-red-400' :
                    'text-blue-400'
                  }`
                })
              ),
              React.createElement('div', { className: 'ml-3 w-0 flex-1 pt-0.5' },
                React.createElement('p', { className: 'text-sm font-medium text-gray-900' },
                  notification.title
                ),
                React.createElement('p', { className: 'mt-1 text-sm text-gray-500' },
                  notification.message
                )
              ),
              React.createElement('div', { className: 'ml-4 flex-shrink-0 flex' },
                React.createElement('button', {
                  className: 'bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                  onClick: () => removeNotification(notification.id)
                },
                  React.createElement('span', { className: 'sr-only' }, '닫기'),
                  React.createElement(XMarkIcon, { className: 'h-5 w-5' })
                )
              )
            )
          )
        )
      )
    );
  }, [notifications, getNotificationIcon, removeNotification]);

  return {
    notifications,
    alarmHistory,
    loading,
    loadUserNotifications,
    loadUserAlarmHistory,
    addNotification,
    addAlarmHistory,
    removeNotification,
    clearAllNotifications,
    getNotificationIcon,
    getAlarmIcon,
    getAlarmIconBackground,
    ToastContainer
  };
};