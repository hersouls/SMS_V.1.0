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
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase } = useSupabase();

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
    
    if (!customService.name || !customService.price || !user) {
      console.log('Validation failed:', { 
        name: customService.name, 
        price: customService.price, 
        user: !!user 
      });
      await addNotification('warning', '입력 확인', '서비스명과 가격을 입력해주세요.');
      return;
    }
    
    try {
      console.log('Starting subscription addition...');
      
      // 날짜 필드 처리: 빈 문자열인 경우 null로 변환
      const renewDate = customService.renewalDate || null;
      const startDate = customService.startDate || null;
      
      // payment_date는 숫자 타입이므로 빈 문자열인 경우 null로 처리
      let paymentDate = null;
      if (customService.paymentDate && customService.paymentDate.trim() !== '') {
        paymentDate = parseInt(customService.paymentDate);
      } else if (renewDate) {
        // renewalDate가 있는 경우 해당 날짜의 일자를 사용
        paymentDate = new Date(renewDate).getDate();
      }

      const insertData = {
        user_id: user.id,
        name: customService.name,
        icon: '📱',
        icon_image_url: customService.iconImage || null,
        price: parseFloat(customService.price),
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

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error adding subscription:', error);
        await addNotification('error', '구독 추가 실패', '구독 추가 중 오류가 발생했습니다.');
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
      setSubscriptions(prev => [localSubscription, ...prev]);
      console.log('Success! Showing notification and navigating...');
      await addNotification('success', '구독 추가 완료', `${customService.name} 구독이 성공적으로 추가되었습니다.`);
      setCurrentScreen('main');
      resetForm();
    } catch (error) {
      console.error('Unexpected error adding subscription:', error);
      await addNotification('error', '구독 추가 실패', '구독 추가 중 오류가 발생했습니다.');
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
        await addNotification('error', '구독 로딩 실패', ERROR_MESSAGES.SUBSCRIPTION_LOAD_FAILED);
        return;
      }
      
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
      
      setSubscriptions(localSubscriptions);
          } catch (error) {
        console.error('Unexpected error loading subscriptions:', error);
        await addNotification('error', '구독 로딩 실패', ERROR_MESSAGES.GENERIC_ERROR);
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
      setIsLoggedIn(true);
      
      // Load user data
      const loadData = async () => {
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
      
      loadData();
      updateLocalProfile();
    } else if (!user && !authLoading) {
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
  }, [user, authLoading, loadUserSubscriptions, loadUserNotifications, loadUserAlarmHistory, updateLocalProfile]);

  // 환율 정보 가져오기
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchExchangeRate]);

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

                             {/* 저장 버튼 */}
               <button
                 onClick={() => {
                   console.log('구독 추가하기 버튼 클릭됨');
                   console.log('버튼 disabled 상태:', !customService.name || !customService.price);
                   console.log('form data:', { name: customService.name, price: customService.price });
                   handleAddSubscription();
                 }}
                 disabled={!customService.name || !customService.price}
                 className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
               >
                 구독 추가하기
               </button>
            </div>
          </div>
        )}

        {/* 다른 화면들은 필요에 따라 추가 */}
        {currentScreen !== 'main' && currentScreen !== 'add' && (
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
