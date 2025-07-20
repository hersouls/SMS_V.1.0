import React, { useState, useEffect, useCallback } from 'react';
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

// --- 타입 정의 ---
interface Subscription {
  id: number;
  databaseId?: number;
  name: string;
  icon: string;
  iconImage?: string;
  price: number;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
  renewDate: string;
  startDate: string;
  paymentDate?: string;
  paymentCard?: string;
  url?: string;
  color?: string;
  category?: string;
}

interface AlarmHistory {
  id: string;
  type: 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'renewal_reminder' | 'payment_due';
  content: string;
  target: string;
  date: string;
  datetime: string;
  icon: React.ComponentType<any>;
  iconBackground: string;
  subscriptionId?: number;
  subscriptionImage?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

interface CustomService {
  name: string;
  price: string;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
  renewalDate: string;
  startDate: string;
  paymentDate: string;
  paymentCard: string;
  url: string;
  category: string;
  notifications: boolean;
  iconImage: string;
}

interface Profile {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  coverPhoto?: string;
}

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

  // 10. 환율 정보 가져오기
  const fetchExchangeRate = async () => {
    setExchangeRateLoading(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRate(data.rates.KRW || 1300);
    } catch (error) {
      console.error('환율 정보를 가져오는데 실패했습니다:', error);
      setExchangeRate(1300); // 기본값 설정
    } finally {
      setExchangeRateLoading(false);
    }
  };

  // 11. 구독 추가 함수
  const handleAddSubscription = async () => {
    if (!user) return;
    
    if (!customService.name || !customService.price || !customService.renewalDate) {
      await addNotification('error', '입력 오류', '필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      const newSubscription = {
        user_id: user.id,
        name: customService.name,
        icon: '📱',
        icon_image_url: customService.iconImage || null,
        price: parseFloat(customService.price),
        currency: customService.currency,
        renew_date: customService.renewalDate,
        start_date: customService.startDate,
        payment_date: customService.paymentDate ? parseInt(customService.paymentDate) : null,
        payment_card: customService.paymentCard || null,
        url: customService.url || null,
        category: customService.category || null,
        color: '#3B82F6',
        is_active: true
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(newSubscription)
        .select()
        .single();

      if (error) {
        console.error('Error adding subscription:', error);
        await addNotification('error', '구독 추가 실패', error.message);
        return;
      }

      const localSubscription: Subscription = {
        id: Date.now(),
        databaseId: data.id,
        name: data.name,
        icon: data.icon,
        iconImage: data.icon_image_url,
        price: data.price,
        currency: data.currency,
        renewDate: data.renew_date,
        startDate: data.start_date,
        paymentDate: data.payment_date?.toString(),
        paymentCard: data.payment_card,
        url: data.url,
        color: data.color,
        category: data.category
      };

      setSubscriptions(prev => [localSubscription, ...prev]);
      await addNotification('success', '구독 추가 완료', `${customService.name} 구독이 추가되었습니다.`);
      await addAlarmHistory('subscription_added', `${customService.name} 구독이 추가되었습니다.`, customService.name, localSubscription.id);
      
      // 폼 초기화
      setCustomService({
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
      setCurrentScreen('main');
    } catch (error) {
      console.error('Unexpected error adding subscription:', error);
      await addNotification('error', '구독 추가 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  // 12. 구독 수정 함수
  const handleUpdateSubscription = async () => {
    if (!user || !editingSubscription) return;

    try {
      const updateData = {
        name: customService.name,
        price: parseFloat(customService.price),
        currency: customService.currency,
        renew_date: customService.renewalDate,
        start_date: customService.startDate,
        payment_date: customService.paymentDate ? parseInt(customService.paymentDate) : null,
        payment_card: customService.paymentCard || null,
        url: customService.url || null,
        category: customService.category || null,
        icon_image_url: customService.iconImage || null
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', editingSubscription.databaseId);

      if (error) {
        console.error('Error updating subscription:', error);
        await addNotification('error', '구독 수정 실패', error.message);
        return;
      }

      // 로컬 상태 업데이트
      setSubscriptions(prev => prev.map(sub => 
        sub.id === editingSubscription.id 
          ? {
              ...sub,
              name: customService.name,
              price: parseFloat(customService.price),
              currency: customService.currency,
              renewDate: customService.renewalDate,
              startDate: customService.startDate,
              paymentDate: customService.paymentDate,
              paymentCard: customService.paymentCard,
              url: customService.url,
              category: customService.category,
              iconImage: customService.iconImage
            }
          : sub
      ));

      await addNotification('success', '구독 수정 완료', `${customService.name} 구독이 수정되었습니다.`);
      await addAlarmHistory('subscription_updated', `${customService.name} 구독이 수정되었습니다.`, customService.name, editingSubscription.id);
      
      setEditingSubscription(null);
      setCurrentScreen('main');
    } catch (error) {
      console.error('Unexpected error updating subscription:', error);
      await addNotification('error', '구독 수정 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  // 13. 구독 삭제 함수
  const handleDeleteSubscription = async (subscription: Subscription) => {
    if (!user || !subscription.databaseId) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('id', subscription.databaseId);

      if (error) {
        console.error('Error deleting subscription:', error);
        await addNotification('error', '구독 삭제 실패', error.message);
        return;
      }

      setSubscriptions(prev => prev.filter(sub => sub.id !== subscription.id));
      await addNotification('success', '구독 삭제 완료', `${subscription.name} 구독이 삭제되었습니다.`);
      await addAlarmHistory('subscription_deleted', `${subscription.name} 구독이 삭제되었습니다.`, subscription.name);
    } catch (error) {
      console.error('Unexpected error deleting subscription:', error);
      await addNotification('error', '구독 삭제 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  // 14. 프로필 업데이트 함수
  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username,
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          photo_url: profile.photo || null,
          cover_photo_url: profile.coverPhoto || null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating profile:', error);
        await addNotification('error', '프로필 업데이트 실패', error.message);
        return;
      }

      await addNotification('success', '프로필 업데이트 완료', '프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
      await addNotification('error', '프로필 업데이트 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  // 15. 로그인되지 않은 경우 로그인 화면 표시
  if (!isLoggedIn || authLoading) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  // 16. 메인 UI 렌더링
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 알림 표시 */}
      <Transition
        show={showNotification}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        {notifications.length > 0 && (
          <div className="fixed top-0 inset-x-0 pt-2 sm:top-0 sm:pt-6 z-50">
            <div className="mx-auto max-w-sm px-2 sm:px-6 lg:px-8">
              <div className={`rounded-md p-4 ${
                notifications[0].type === 'success' ? 'bg-green-50' :
                notifications[0].type === 'error' ? 'bg-red-50' :
                notifications[0].type === 'warning' ? 'bg-yellow-50' :
                'bg-blue-50'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {notifications[0].type === 'success' && (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    )}
                    {notifications[0].type === 'error' && (
                      <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      notifications[0].type === 'success' ? 'text-green-800' :
                      notifications[0].type === 'error' ? 'text-red-800' :
                      notifications[0].type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {notifications[0].title}
                    </p>
                    <p className={`mt-1 text-sm ${
                      notifications[0].type === 'success' ? 'text-green-700' :
                      notifications[0].type === 'error' ? 'text-red-700' :
                      notifications[0].type === 'warning' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {notifications[0].message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Transition>

      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">구독 관리</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentScreen('notifications')}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="ml-1 inline-block bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentScreen('profile')}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <User className="h-6 w-6" />
              </button>
              <button
                onClick={() => setCurrentScreen('supabase-test')}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <Settings className="h-6 w-6" />
              </button>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {currentScreen === 'main' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">내 구독</h2>
              <button
                onClick={() => setCurrentScreen('add')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                구독 추가
              </button>
            </div>

            {/* 구독 목록 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedSubscription(subscription);
                    setCurrentScreen('detail');
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {subscription.iconImage ? (
                          <img
                            src={subscription.iconImage}
                            alt={subscription.name}
                            className="h-10 w-10 rounded-lg"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-lg">
                            {subscription.icon}
                          </div>
                        )}
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">{subscription.name}</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {subscription.currency === 'USD' 
                              ? `$${subscription.price}` 
                              : `₩${subscription.price.toLocaleString()}`
                            }
                            <span className="text-sm text-gray-500 ml-1">/ 월</span>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">
                        갱신일: {new Date(subscription.renewDate).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {subscriptions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">아직 등록된 구독이 없습니다</div>
                <button
                  onClick={() => setCurrentScreen('add')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  첫 구독 추가하기
                </button>
              </div>
            )}
          </div>
        )}

        {currentScreen === 'supabase-test' && <SupabaseTest />}

        {/* 다른 화면들은 필요에 따라 추가 */}
        {currentScreen !== 'main' && currentScreen !== 'supabase-test' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                {currentScreen} 화면 (구현 중)
              </div>
              <button
                onClick={() => setCurrentScreen('main')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                메인으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SubscriptionApp;

// 본문 종료
