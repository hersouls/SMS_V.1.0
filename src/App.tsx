import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, User, Plus, ChevronLeft, Settings
} from 'lucide-react';
import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import { useSupabase } from './contexts/SupabaseContext';
import { LoginScreen } from './components/LoginScreen';

import { 
  formatCurrency, 
  formatDate, 
  splitFullName, 
  generateId, 
  ERROR_MESSAGES
} from './lib/utils';

// --- 타입 정의 ---
interface Subscription {
  id: number;
  databaseId?: string;
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

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
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
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase, updateProfile } = useSupabase();

  // User 상태 모니터링
  useEffect(() => {
    console.log('User state changed:', {
      user: user ? 'logged in' : 'not logged in',
      userId: user?.id,
      email: user?.email,
      authLoading
    });
    console.log('Supabase instance:', supabase);
  }, [user, authLoading, supabase]);

  // 상태 선언
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'add' | 'manage' | 'detail' | 'notifications' | 'alarm-history' | 'profile'>('main');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profile, setProfile] = useState<Profile>({
    username: '',
    firstName: '',
    lastName: '',
    email: ''
  });

  // 구독 추가 폼 상태
  const [customService, setCustomService] = useState({
    name: '',
    price: '',
    currency: 'KRW' as 'KRW' | 'USD' | 'EUR' | 'JPY',
    renewalDate: '',
    startDate: '',
    paymentDate: '',
    paymentCard: '',
    url: '',
    category: '',
    notifications: true,
    iconImage: ''
  });

  // 알림 추가 함수
  const addNotification = useCallback(async (type: Notification['type'], title: string, message: string) => {
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
  }, [user, supabase]);

  // 구독 추가 함수
  const handleAddSubscription = async () => {
    console.log('handleAddSubscription called');
    console.log('customService:', customService);
    console.log('user:', user);
    
    // 유효성 검사
    if (!customService.name?.trim()) {
      console.log('Validation failed: name is empty');
      await addNotification('warning', '입력 확인', '서비스명을 입력해주세요.');
      return;
    }
    
    if (!customService.price?.trim()) {
      console.log('Validation failed: price is empty');
      await addNotification('warning', '입력 확인', '가격을 입력해주세요.');
      return;
    }
    
    if (!user) {
      console.log('Validation failed: user not logged in');
      await addNotification('error', '로그인 필요', '로그인이 필요한 서비스입니다.');
      return;
    }

    // 가격 유효성 검사
    const priceValue = parseFloat(customService.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      console.log('Validation failed: invalid price:', priceValue);
      await addNotification('warning', '입력 확인', '올바른 가격을 입력해주세요.');
      return;
    }
    
    try {
      console.log('Starting subscription addition...');
      console.log('User info:', {
        id: user.id,
        email: user.email,
        role: user.role,
        authenticated: !!user
      });

      // 사용자 세션 상태 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session validation failed:', sessionError);
        await addNotification('error', '인증 오류', '세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }
      console.log('Session validated successfully');
      
      // 날짜 필드 처리: 빈 문자열인 경우 null로 변환
      const renewDate = customService.renewalDate || null;
      const startDate = customService.startDate || null;
      
      // payment_date는 숫자 타입이므로 빈 문자열인 경우 null로 처리
      let paymentDate = null;
      if (customService.paymentDate && customService.paymentDate.trim() !== '') {
        const parsedDate = parseInt(customService.paymentDate);
        if (!isNaN(parsedDate) && parsedDate >= 1 && parsedDate <= 31) {
          paymentDate = parsedDate;
        }
      } else if (renewDate) {
        // renewalDate가 있는 경우 해당 날짜의 일자를 사용
        paymentDate = new Date(renewDate).getDate();
      }

      const insertData = {
        user_id: user.id,
        name: customService.name.trim(),
        icon: '📱',
        icon_image_url: customService.iconImage || null,
        price: priceValue,
        currency: customService.currency,
        renew_date: renewDate,
        start_date: startDate,
        payment_date: paymentDate,
        payment_card: customService.paymentCard || null,
        url: customService.url || null,
        color: '#6C63FF',
        category: customService.category || null,
        is_active: true
      };
      
      console.log('Inserting data:', insertData);

      // 네트워크 연결 상태 확인
      if (!navigator.onLine) {
        await addNotification('error', '네트워크 오류', '인터넷 연결을 확인해주세요.');
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error adding subscription:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          full_error: error
        });
        
        // 에러 타입에 따른 구체적인 메시지
        let errorMessage = '구독 추가 중 오류가 발생했습니다.';
        if (error.code === 'PGRST301') {
          errorMessage = '중복된 구독이 있습니다.';
        } else if (error.code === '23505') {
          errorMessage = '이미 동일한 구독이 존재합니다.';
        } else if (error.message?.includes('JWT') || error.message?.includes('jwt')) {
          errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = '네트워크 연결을 확인해주세요.';
        } else if (error.code === '42501') {
          errorMessage = '권한이 없습니다. 다시 로그인해주세요.';
        } else if (error.code === 'PGRST116') {
          errorMessage = '데이터베이스 연결에 문제가 있습니다.';
        } else {
          errorMessage = `구독 추가 실패: ${error.message || '알 수 없는 오류'}`;
        }
        
        await addNotification('error', '구독 추가 실패', errorMessage);
        return;
      }

      if (!data) {
        console.error('No data returned from insert');
        await addNotification('error', '구독 추가 실패', '데이터 저장에 실패했습니다.');
        return;
      }

      const localSubscription: Subscription = {
        id: Date.now(),
        databaseId: data.id,
        name: data.name,
        icon: data.icon || '📱',
        iconImage: data.icon_image_url || '',
        price: data.price,
        currency: data.currency as 'KRW' | 'USD' | 'EUR' | 'JPY',
        renewDate: data.renew_date || '',
        startDate: data.start_date || '',
        paymentDate: data.payment_date?.toString() || '',
        paymentCard: data.payment_card || '',
        url: data.url || '',
        color: data.color || '#6C63FF',
        category: data.category || ''
      };

      console.log('Adding to local state:', localSubscription);
      setSubscriptions(prev => {
        const newSubscriptions = [localSubscription, ...prev];
        console.log('Updated subscriptions list:', newSubscriptions);
        return newSubscriptions;
      });
      
      console.log('Success! Showing notification and navigating...');
      await addNotification('success', '구독 추가 완료', `${customService.name} 구독이 성공적으로 추가되었습니다.`);
      
      // 폼 리셋
      resetForm();
      
      // 짧은 지연 후 메인 화면으로 이동 (알림을 보여주기 위해)
      setTimeout(() => {
        setCurrentScreen('main');
      }, 1000);
    } catch (error) {
      console.error('Unexpected error adding subscription:', error);
      
      let errorMessage = '구독 추가 중 예상치 못한 오류가 발생했습니다.';
      if (error instanceof Error) {
        if (error.message?.includes('fetch')) {
          errorMessage = '네트워크 연결을 확인해주세요.';
        } else if (error.message?.includes('JSON')) {
          errorMessage = '서버 응답에 문제가 있습니다.';
        }
      }
      
      await addNotification('error', '구독 추가 실패', errorMessage);
    }
  };

  // 폼 리셋 함수
  const resetForm = () => {
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
  };

  // Supabase 구독 데이터 로딩
  const loadUserSubscriptions = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping subscription load');
      return;
    }
    
    try {
      console.log('Loading subscriptions for user:', user.id);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error loading subscriptions:', error);
        await addNotification('error', '구독 로딩 실패', '구독 정보를 불러오는 중 오류가 발생했습니다.');
        return;
      }
      
      console.log('Raw subscription data from Supabase:', data);
      
      const localSubscriptions: Subscription[] = data.map((sub, index) => ({
        id: generateId() + index,
        databaseId: sub.id,
        name: sub.name,
        icon: sub.icon || '📱',
        iconImage: sub.icon_image_url,
        price: sub.price,
        currency: sub.currency,
        renewDate: sub.renew_date ?? '',
        startDate: sub.start_date ?? '',
        paymentDate: sub.payment_date?.toString() ?? '',
        paymentCard: sub.payment_card,
        url: sub.url,
        color: sub.color,
        category: sub.category
      }));
      
      console.log('Converted subscriptions:', localSubscriptions);
      setSubscriptions(localSubscriptions);
    } catch (error) {
      console.error('Unexpected error loading subscriptions:', error);
      await addNotification('error', '구독 로딩 실패', '예상치 못한 오류가 발생했습니다.');
    }
  }, [user, supabase, addNotification]);

  // Supabase 알림 데이터 로딩
  const loadUserNotifications = useCallback(async () => {
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
  }, [user, supabase]);

  // Supabase 알람 히스토리 데이터 로딩
  const loadUserAlarmHistory = useCallback(async () => {
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
      
      console.log('Alarm history loaded:', data.length, 'items');
    } catch (error) {
      console.error('Unexpected error loading alarm history:', error);
    }
  }, [user, supabase]);

  // 프로필 업데이트 함수
  const updateLocalProfile = useCallback(() => {
    if (supabaseProfile) {
      setProfile({
        username: supabaseProfile.username || '',
        firstName: supabaseProfile.first_name || '',
        lastName: supabaseProfile.last_name || '',
        email: supabaseProfile.email || user?.email || '',
        photo: supabaseProfile.photo_url || '',
        coverPhoto: supabaseProfile.cover_photo_url || ''
      });
    } else if (user?.user_metadata) {
      const fullName = user.user_metadata.full_name || user.user_metadata.name || '';
      const { firstName, lastName } = splitFullName(fullName);
      setProfile({
        username: user.user_metadata.preferred_username || '',
        firstName,
        lastName,
        email: user.email || '',
        photo: user.user_metadata.avatar_url || user.user_metadata.picture || '',
        coverPhoto: ''
      });
    }
  }, [supabaseProfile, user]);

  // 프로필 입력 핸들러
  const handleProfileInput = (field: keyof Profile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 프로필 저장 핸들러
  const handleProfileSave = async () => {
    if (!user) {
      await addNotification('error', '로그인 필요', '로그인이 필요한 서비스입니다.');
      return;
    }

    try {
      console.log('Saving profile:', profile);
      
      const updateData = {
        username: profile.username?.trim() || null,
        first_name: profile.firstName?.trim() || null,
        last_name: profile.lastName?.trim() || null,
        email: profile.email?.trim() || user.email,
        photo_url: profile.photo?.trim() || null,
        cover_photo_url: profile.coverPhoto?.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          ...updateData 
        });

      if (error) {
        console.error('Error updating profile:', error);
        await addNotification('error', '프로필 저장 실패', '프로필 저장 중 오류가 발생했습니다.');
        return;
      }

      await addNotification('success', '프로필 저장 완료', '프로필이 성공적으로 저장되었습니다.');
      
      // 프로필 새로고침 - Context의 updateProfile 호출
      try {
        await updateProfile(updateData);
      } catch (error) {
        console.log('Context update failed, but main update succeeded');
      }
      
    } catch (error) {
      console.error('Unexpected error saving profile:', error);
      await addNotification('error', '프로필 저장 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  // 프로필 취소 핸들러
  const handleProfileCancel = () => {
    updateLocalProfile(); // 원래 상태로 복원
    setCurrentScreen('main');
  };

  // 환율 정보 가져오기
  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      await response.json();
    } catch (error) {
      console.error(ERROR_MESSAGES.EXCHANGE_RATE_FAILED, error);
    }
  }, []);

  // 인증 상태 변화 감지
  useEffect(() => {
    if (user && !authLoading) {
      console.log('User authenticated, loading data...');
      setIsLoggedIn(true);
      
      // Load user data
      const loadData = async () => {
        try {
          console.log('Loading all user data...');
          await Promise.all([
            loadUserSubscriptions(),
            loadUserNotifications(),
            loadUserAlarmHistory()
          ]);
          console.log('All user data loaded successfully');
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };
      
      loadData();
      
      // 프로필 업데이트는 supabaseProfile이 변경될 때마다 실행
      updateLocalProfile();
    } else if (!user && !authLoading) {
      console.log('User logged out, clearing data...');
      // 로그아웃 시 모든 데이터 완전 초기화
      setIsLoggedIn(false);
      setSubscriptions([]);
      setNotifications([]);
      setProfile({
        username: '',
        firstName: '',
        lastName: '',
        email: ''
      });
    }
  }, [user, authLoading, loadUserSubscriptions, loadUserNotifications, loadUserAlarmHistory]);
  
  // supabaseProfile이 변경될 때마다 로컬 프로필 업데이트
  useEffect(() => {
    if (user && supabaseProfile) {
      console.log('Supabase profile updated, updating local profile...');
      updateLocalProfile();
    }
  }, [supabaseProfile, user, updateLocalProfile]);

  // 환율 정보 가져오기
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchExchangeRate]);

  // 15. 로그인되지 않은 경우 로그인 화면 표시
  if ((!user && !authLoading) || authLoading) {
    return <LoginScreen onLoginSuccess={() => {
      console.log('Login success callback called');
      setIsLoggedIn(true);
    }} />;
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
                    // TODO: Implement detail view functionality
                    console.log('Show detail for subscription:', subscription.name);
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
                            {formatCurrency(subscription.price, subscription.currency)}
                            <span className="text-sm text-gray-500 ml-1">/ 월</span>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">
                        갱신일: {formatDate(subscription.renewDate)}
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



        {/* 구독 추가/수정 화면 */}
        {currentScreen === 'add' && (
          <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
            <link
              href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
              rel="stylesheet"
            />
            
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between px-4 py-4">
              <button
                onClick={() => setCurrentScreen('main')}
                className="flex items-center text-white/80 hover:text-white transition-colors duration-200"
              >
                <ChevronLeft className="w-6 h-6 mr-1" />
                뒤로
              </button>
              <h1 className="text-white text-lg font-semibold">구독 추가</h1>
              <div className="w-8" />
            </div>
            
            {/* 메인 콘텐츠 */}
            <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
              {/* 구독 정보 입력 폼 */}
              <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">구독 정보</h3>
                
                <div className="space-y-4">
                                     {/* 서비스명 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       서비스명
                     </label>
                     <input
                       type="text"
                       value={customService.name}
                       onChange={(e) => setCustomService(prev => ({ ...prev, name: e.target.value }))}
                       placeholder="Netflix, Spotify 등"
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                     />
                   </div>

                   {/* 가격 및 화폐 */}
                   <div className="grid grid-cols-3 gap-3">
                     <div className="col-span-2">
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         월 이용료
                       </label>
                       <input
                         type="number"
                         value={customService.price}
                         onChange={(e) => setCustomService(prev => ({ ...prev, price: e.target.value }))}
                         placeholder="0"
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         화폐
                       </label>
                       <select 
                         value={customService.currency}
                         onChange={(e) => setCustomService(prev => ({ ...prev, currency: e.target.value as 'KRW' | 'USD' | 'EUR' | 'JPY' }))}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                       >
                         <option value="KRW">KRW</option>
                         <option value="USD">USD</option>
                         <option value="EUR">EUR</option>
                         <option value="JPY">JPY</option>
                       </select>
                     </div>
                   </div>

                   {/* 결제일 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       매월 결제일
                     </label>
                     <input
                       type="number"
                       min="1"
                       max="31"
                       value={customService.paymentDate}
                       onChange={(e) => setCustomService(prev => ({ ...prev, paymentDate: e.target.value }))}
                       placeholder="매월 몇 일에 결제되나요?"
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                     />
                   </div>

                   {/* 다음 결제일 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       다음 결제일
                     </label>
                     <input
                       type="date"
                       value={customService.renewalDate}
                       onChange={(e) => setCustomService(prev => ({ ...prev, renewalDate: e.target.value }))}
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                     />
                   </div>
                </div>
              </div>

              {/* 디버그 정보 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">디버그 정보</h4>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>로그인 상태: {user ? `✅ ${user.email} (ID: ${user.id})` : '❌ 로그인 안됨'}</div>
                  <div>인증 로딩: {authLoading ? '✅ 로딩중' : '❌ 완료'}</div>
                  <div>isLoggedIn: {isLoggedIn ? '✅ true' : '❌ false'}</div>
                  <div>서비스명: {customService.name || '입력 안됨'} (길이: {customService.name?.length || 0})</div>
                  <div>가격: {customService.price || '입력 안됨'} (길이: {customService.price?.length || 0})</div>
                  <div>가격 숫자: {customService.price ? (isNaN(parseFloat(customService.price)) ? '❌ 숫자 아님' : `✅ ${parseFloat(customService.price)}`) : '입력 안됨'}</div>
                  <div>버튼 활성화 조건:</div>
                  <div className="ml-2">
                    - 서비스명: {customService.name?.trim() ? '✅' : '❌'}<br/>
                    - 가격: {customService.price?.trim() ? '✅' : '❌'}<br/>
                    - 사용자: {user ? '✅' : '❌'}<br/>
                    - 최종: {(!customService.name?.trim() || !customService.price?.trim() || !user) ? '❌ 비활성화' : '✅ 활성화'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        try {
                          console.log('Supabase 연결 테스트 시작...');
                          const { data, error } = await supabase
                            .from('subscriptions')
                            .select('count')
                            .limit(1);
                          
                          if (error) {
                            console.error('Supabase 연결 실패:', error);
                            await addNotification('error', '연결 테스트', `Supabase 연결 실패: ${error.message}`);
                          } else {
                            console.log('Supabase 연결 성공:', data);
                            await addNotification('success', '연결 테스트', 'Supabase 연결 성공!');
                          }
                        } catch (error) {
                          console.error('연결 테스트 오류:', error);
                          await addNotification('error', '연결 테스트', `테스트 오류: ${error}`);
                        }
                      }}
                      className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 text-xs rounded-lg"
                    >
                      Supabase 연결 테스트
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { data: { user: currentUser } } = await supabase.auth.getUser();
                          console.log('현재 사용자:', currentUser);
                          await addNotification('info', '사용자 정보', `현재 사용자: ${currentUser?.email || '없음'}`);
                        } catch (error) {
                          console.error('사용자 조회 오류:', error);
                        }
                      }}
                      className="px-3 py-1 bg-blue-200 hover:bg-blue-300 text-blue-800 text-xs rounded-lg"
                    >
                      사용자 재확인
                    </button>
                  </div>
                </div>
              </div>

                             {/* 저장 버튼 */}
               <button
                 onClick={async (e) => {
                   e.preventDefault();
                   console.log('구독 추가하기 버튼 클릭됨');
                   console.log('form data:', { 
                     name: customService.name, 
                     price: customService.price,
                     user: user?.id 
                   });
                   
                   await handleAddSubscription();
                 }}
                 disabled={!customService.name?.trim() || !customService.price?.trim() || !user}
                 className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
               >
                 {!user ? '로그인이 필요합니다' : '구독 추가하기'}
               </button>
            </div>
          </div>
        )}

        {/* 프로필 화면 */}
        {currentScreen === 'profile' && (
          <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
            <link
              href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
              rel="stylesheet"
            />
            
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between px-4 py-4">
              <button
                onClick={() => setCurrentScreen('main')}
                className="flex items-center text-white/80 hover:text-white transition-colors duration-200"
              >
                <ChevronLeft className="w-6 h-6 mr-1" />
                뒤로
              </button>
              <h1 className="text-white text-lg font-semibold">프로필</h1>
              <div className="w-8" />
            </div>
            
            {/* 메인 콘텐츠 */}
            <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
              {/* 프로필 정보 */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt="프로필 사진"
                      className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto bg-blue-500 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-4">
                  {profile.firstName || profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`.trim()
                    : profile.username || '사용자'
                  }
                </h2>
                <p className="text-gray-600">{profile.email}</p>
              </div>

              {/* 프로필 편집 폼 */}
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">프로필 편집</h3>
                
                <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleProfileSave(); }}>
                  <div className="space-y-4">
                    {/* 사용자명 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        사용자명
                      </label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => handleProfileInput('username', e.target.value)}
                        placeholder="사용자명을 입력하세요"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      />
                    </div>

                    {/* 프로필 사진 URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        프로필 사진 URL
                      </label>
                      <input
                        type="url"
                        value={profile.photo || ''}
                        onChange={(e) => handleProfileInput('photo', e.target.value)}
                        placeholder="프로필 사진 URL을 입력하세요"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      />
                      {profile.photo && (
                        <div className="mt-2 flex justify-center">
                          <img
                            src={profile.photo}
                            alt="프로필 미리보기"
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 이름 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          이름
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => handleProfileInput('firstName', e.target.value)}
                          placeholder="이름"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          성
                        </label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => handleProfileInput('lastName', e.target.value)}
                          placeholder="성"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* 이메일 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileInput('email', e.target.value)}
                        placeholder="이메일을 입력하세요"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* 버튼 영역 */}
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={handleProfileCancel}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition-all duration-200"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      저장
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 다른 화면들은 필요에 따라 추가 */}
        {currentScreen !== 'main' && currentScreen !== 'add' && currentScreen !== 'profile' && (
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
