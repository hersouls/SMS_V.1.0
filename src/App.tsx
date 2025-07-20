import React, { useState, useEffect } from 'react';
import {
  Search, Check, Calendar, DollarSign, Tag, Bell, User, Home, Menu, Plus, Edit2, Trash2, Upload, Image,
  Settings, ChevronLeft, ChevronRight, CreditCard, Globe, Banknote, CalendarRange
} from 'lucide-react';
import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon, XMarkIcon, CheckIcon, HandThumbUpIcon, UserIcon, PhotoIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import { useSupabase } from './contexts/SupabaseContext';
import { LoginScreen } from './components/LoginScreen';
import { SupabaseTest } from './components/SupabaseTest';

// --- 타입 정의(생략 가능) ---
/* ...Subscription, AlarmHistory, Notification, CustomService, Profile... */

// --- 컴포넌트 시작 ---
const SubscriptionApp = () => {
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase } = useSupabase();

  // 1. 빈 값으로 모든 상태 선언
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [alarmHistory, setAlarmHistory] = useState<AlarmHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'add' | 'manage' | 'detail' | 'notifications' | 'alarm-history' | 'profile' | 'supabase-test'>('main');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile>({
    username: '',
    firstName: '',
    lastName: '',
    email: ''
  });

  // 기타 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exchangeRate, setExchangeRate] = useState<number>(1300);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);

  const [customService, setCustomService] = useState<CustomService>({
    name: '',
    price: '',
    currency: 'KRW',
    renewalDate: '',
    startDate: '',
    paymentDate: '',
    paymentCard: '',
    url: '',
    category: '',
    notifications: true,
    iconImage: ''
  });

  // 2. 인증 상태 변화 감지
  useEffect(() => {
    if (user && !authLoading) {
      setIsLoggedIn(true);
      loadUserData();

      // 프로필 동기화
      if (supabaseProfile) {
        setProfile({
          username: supabaseProfile.username || '',
          firstName: supabaseProfile.first_name || '',
          lastName: supabaseProfile.last_name || '',
          email: supabaseProfile.email || user.email || '',
          photo: supabaseProfile.photo_url || '',
          coverPhoto: supabaseProfile.cover_photo_url || ''
        });
      } else if (user.user_metadata) {
        const fullName = user.user_metadata.full_name || user.user_metadata.name || '';
        const nameParts = fullName.split(' ');
        setProfile({
          username: user.user_metadata.preferred_username || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          photo: user.user_metadata.avatar_url || user.user_metadata.picture || '',
          coverPhoto: ''
        });
      }
    } else if (!user && !authLoading) {
      // 로그아웃 시 모든 데이터 완전 초기화
      setIsLoggedIn(false);
      setSubscriptions([]);
      setNotifications([]);
      setAlarmHistory([]);
      setProfile({
        username: '',
        firstName: '',
        lastName: '',
        email: ''
      });
    }
  }, [user, authLoading, supabaseProfile]);

  // 3. 환율 정보 가져오기
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. 사용자 전체 데이터 불러오기
  const loadUserData = async () => {
    if (!user) return;
    try {
      await Promise.all([
        loadUserSubscriptions(),
        loadUserNotifications(),
        loadUserAlarmHistory()
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // 5. Supabase 구독 데이터 로딩
  const loadUserSubscriptions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading subscriptions:', error);
        await addNotification('error', '구독 로딩 실패', '구독 정보를 불러오지 못했습니다.');
        return;
      }
      const localSubscriptions: Subscription[] = data.map((sub, index) => ({
        id: Date.now() + index,
        databaseId: sub.id,
        name: sub.name,
        icon: sub.icon || '📱',
        iconImage: sub.icon_image_url,
        price: sub.price,
        currency: sub.currency,
        renewDate: sub.renew_date,
        startDate: sub.start_date,
        paymentDate: sub.payment_date?.toString(),
        paymentCard: sub.payment_card,
        url: sub.url,
        color: sub.color,
        category: sub.category
      }));
      setSubscriptions(localSubscriptions);
    } catch (error) {
      console.error('Unexpected error loading subscriptions:', error);
      await addNotification('error', '구독 로딩 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  // 6. Supabase 알림 데이터 로딩
  const loadUserNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      const localNotifications: Notification[] = data.map(notif => ({
        id: notif.id,
        type: notif.type as 'success' | 'warning' | 'error' | 'info',
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at)
      }));
      setNotifications(localNotifications);
    } catch (error) {
      console.error('Unexpected error loading notifications:', error);
    }
  };

  // 7. Supabase 알람 히스토리 데이터 로딩
  const loadUserAlarmHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('alarm_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        console.error('Error loading alarm history:', error);
        return;
      }
      const localAlarmHistory: AlarmHistory[] = data.map(alarm => {
        let icon, iconBackground;
        switch (alarm.type) {
          case 'subscription_added':
            icon = CheckIcon;
            iconBackground = 'bg-green-500';
            break;
          case 'subscription_updated':
            icon = HandThumbUpIcon;
            iconBackground = 'bg-blue-500';
            break;
          case 'subscription_deleted':
            icon = UserIcon;
            iconBackground = 'bg-gray-500';
            break;
          case 'renewal_reminder':
            icon = CheckIcon;
            iconBackground = 'bg-yellow-500';
            break;
          case 'payment_due':
            icon = HandThumbUpIcon;
            iconBackground = 'bg-red-500';
            break;
          default:
            icon = CheckIcon;
            iconBackground = 'bg-gray-500';
        }
        return {
          id: alarm.id,
          type: alarm.type as AlarmHistory['type'],
          content: alarm.content,
          target: alarm.target,
          date: new Date(alarm.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          datetime: alarm.created_at,
          icon,
          iconBackground,
          subscriptionId: parseInt(alarm.subscription_id || '0') || undefined,
          subscriptionImage: alarm.subscription_image_url || undefined
        };
      });
      setAlarmHistory(localAlarmHistory);
    } catch (error) {
      console.error('Unexpected error loading alarm history:', error);
    }
  };

  // 8. 알림 추가 함수
  const addNotification = async (type: Notification['type'], title: string, message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
    setShowNotification(true);
    if (user) {
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
          console.error('Error saving notification:', error);
        }
      } catch (error) {
        console.error('Unexpected error saving notification:', error);
      }
    }
    setTimeout(() => setShowNotification(false), 5000);
  };

  // 9. 알람 히스토리 추가 함수
  const addAlarmHistory = async (type: AlarmHistory['type'], content: string, target: string, subscriptionId?: number) => {
    if (!user) return;
    const subscription = subscriptionId ? subscriptions.find(sub => sub.id === subscriptionId) : null;
    let icon, iconBackground;
    switch (type) {
      case 'subscription_added':
        icon = CheckIcon;
        iconBackground = 'bg-green-500';
        break;
      case 'subscription_updated':
        icon = HandThumbUpIcon;
        iconBackground = 'bg-blue-500';
        break;
      case 'subscription_deleted':
        icon = UserIcon;
        iconBackground = 'bg-gray-500';
        break;
      case 'renewal_reminder':
        icon = CheckIcon;
        iconBackground = 'bg-yellow-500';
        break;
      case 'payment_due':
        icon = HandThumbUpIcon;
        iconBackground = 'bg-red-500';
        break;
      default:
        icon = CheckIcon;
        iconBackground = 'bg-gray-500';
    }
    const now = new Date();
    const newAlarm: AlarmHistory = {
      id: Date.now().toString(),
      type,
      content,
      target,
      date: now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      datetime: now.toISOString(),
      icon,
      iconBackground,
      subscriptionId,
      subscriptionImage: subscription?.iconImage
    };
    setAlarmHistory(prev => [newAlarm, ...prev]);
    try {
      const { error } = await supabase
        .from('alarm_history')
        .insert({
          user_id: user.id,
          type,
          content,
          target,
          subscription_id: subscription?.databaseId || null,
          subscription_image_url: subscription?.iconImage || null,
        });
      if (error) {
        console.error('Error saving alarm history:', error);
      }
    } catch (error) {
      console.error('Unexpected error saving alarm history:', error);
    }
  };

  // --- 이하 나머지 UI/핸들러/렌더링 분기 기존과 동일 ---
  // ... 기존 코드 활용 (구독 추가/수정/달력/프로필 등)

};

export default SubscriptionApp;

// 본문 종료
