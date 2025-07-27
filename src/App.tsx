import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Calendar, Tag, Bell, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, CreditCard, Globe, Banknote, CalendarRange, TrendingUp, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon, XMarkIcon, CheckIcon, PhotoIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import { useSupabase } from './contexts/SupabaseContext';
import { LoginScreen } from './components/LoginScreen';
import { GoogleAuthDebug } from './components/GoogleAuthDebug';
import { AuthCallback } from './components/AuthCallback';
import { SupabaseDebugger } from './components/SupabaseDebugger';
import { EmergencyTroubleshooter } from './components/EmergencyTroubleshooter';
import SafeSubscriptionApp from './components/SafeSubscriptionApp';
import ErrorScenarioTester from './components/ErrorScenarioTester';

import Header from './components/ui/header';
import StatsCard from './components/ui/stats-card';
import SubscriptionCard from './components/ui/subscription-card';
import SubscriptionForm from './components/ui/subscription-form';
import DebugPanel from './components/DebugPanel';
import { Button } from './components/ui/button';
import TestPage from './pages/TestPage';
import { createDebugObject } from './utils/responsive-debug';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ErrorActionGenerator, useErrorHandler } from './lib/errorHandlingSystem';
import { subscriptionErrorHandlers } from './lib/supabaseWithErrorHandling';
import { useNetworkStatus } from './lib/networkRecovery';


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
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  subscriptionId?: string;
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
    const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase, updateProfile: updateSupabaseProfile } = useSupabase();
    const { handleError } = useErrorHandler();
    const { isOnline } = useNetworkStatus();

    // 반응형 디버깅 도구 초기화
    React.useEffect(() => {
      createDebugObject();
    }, []);

  // 1. 빈 값으로 모든 상태 선언
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [alarmHistory, setAlarmHistory] = useState<AlarmHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'add' | 'manage' | 'detail' | 'notifications' | 'alarm-history' | 'profile'>('main');
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
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);

  const [addingProgress, setAddingProgress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 오디오 플레이어 상태
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const [isLooping, setIsLooping] = useState(true); // 반복 재생 상태 추가

  const [customService, setCustomService] = useState<CustomService>({
    name: '',
    price: '',
    currency: 'USD',
    renewalDate: '',
    startDate: '',
    paymentDate: '',
    paymentCard: '',
    url: '',
    category: '',
    notifications: true,
    iconImage: ''
  });

  // Missing state variables
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentError, setCurrentError] = useState<any>(null);
  
  // Missing refs
  const dataLoaded = useRef(false);

  // Missing functions
  const clearError = () => {
    setCurrentError(null);
  };

  const retryLastAction = async (action: () => void | Promise<void>) => {
    return await action();
  };

  // 1. 컴포넌트 마운트/언마운트 정리
  useEffect(() => {
    console.log('SubscriptionApp component mounted');
    
    return () => {
      console.log('SubscriptionApp component unmounting, cleaning up...');
      // 컴포넌트 언마운트 시 정리 작업
      dataLoaded.current = false;
    };
  }, []);

  // 2. 사용자 인증 상태 확인 및 데이터 로딩
  useEffect(() => {
    console.log('Auth state effect triggered:', { user: !!user, authLoading, supabaseProfile: !!supabaseProfile });
    
    if (user && !authLoading) {
      console.log('User authenticated, loading data...');
      setIsLoggedIn(true);
      
      // 데이터 로딩을 한 번만 실행하도록 플래그 사용
      if (!dataLoaded.current) {
        dataLoaded.current = true;
        loadUserData();
      }

      // 프로필 동기화
      if (supabaseProfile) {
        console.log('Syncing profile from Supabase:', supabaseProfile);
        setProfile({
          username: supabaseProfile.username || '',
          firstName: supabaseProfile.first_name || '',
          lastName: supabaseProfile.last_name || '',
          email: supabaseProfile.email || user.email || '',
          photo: supabaseProfile.photo_url || '',
          coverPhoto: supabaseProfile.cover_photo_url || ''
        });
      } else if (user.user_metadata) {
        console.log('Syncing profile from user metadata:', user.user_metadata);
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
      console.log('User logged out, clearing all data');
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
      // 데이터 로딩 플래그 리셋
      dataLoaded.current = false;
    } else {
      console.log('Auth state in transition:', { user: !!user, authLoading });
    }
  }, [user, authLoading, supabaseProfile]);

  // 2.1. supabaseProfile 변경 시 로컬 프로필 동기화
  useEffect(() => {
    if (supabaseProfile && user && isLoggedIn) {
      console.log('Supabase profile updated, syncing local profile:', supabaseProfile);
      setProfile({
        username: supabaseProfile.username || '',
        firstName: supabaseProfile.first_name || '',
        lastName: supabaseProfile.last_name || '',
        email: supabaseProfile.email || user.email || '',
        photo: supabaseProfile.photo_url || '',
        coverPhoto: supabaseProfile.cover_photo_url || ''
      });
    }
  }, [supabaseProfile, user, isLoggedIn]);

  // 3. URL 해시 처리 및 정규화
  useEffect(() => {
    let isProcessing = false;
    
    // OAuth 콜백 후 URL 정리
    const handleURLCleanup = () => {
      if (isProcessing) return;
      isProcessing = true;
      
      try {
        const currentURL = window.location.href;
        const urlObj = new URL(currentURL);
        
        // OAuth 콜백 파라미터가 있는 경우 정리
        if (urlObj.searchParams.has('access_token') || 
            urlObj.searchParams.has('refresh_token') || 
            urlObj.hash.includes('access_token')) {
          // 파라미터와 해시를 제거하고 깔끔한 URL로 리다이렉트
          const cleanURL = `${urlObj.origin}/`;
          window.history.replaceState({}, document.title, cleanURL);
        }
        
        // 빈 해시(#)만 있는 경우도 정리
        if (urlObj.hash === '#') {
          const cleanURL = `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;
          window.history.replaceState({}, document.title, cleanURL);
        }
      } catch (error) {
        console.error('URL cleanup error:', error);
      } finally {
        isProcessing = false;
      }
    };

    // 컴포넌트 마운트 시 URL 정리
    handleURLCleanup();
    
    // popstate 이벤트 리스너 추가 (뒤로가기/앞으로가기 시)
    window.addEventListener('popstate', handleURLCleanup);
    
    return () => {
      window.removeEventListener('popstate', handleURLCleanup);
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // 4. 환율 정보 가져오기
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const initializeExchangeRate = async () => {
      try {
        await fetchExchangeRate();
        // 성공적으로 초기화된 후에만 인터벌 설정
        intervalId = setInterval(fetchExchangeRate, 60 * 60 * 1000);
      } catch (error) {
        console.error('환율 정보 초기화 실패:', error);
      }
    };

    initializeExchangeRate();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]); // user가 변경될 때만 재실행

  // 4.5. 구독 추가 상태 추적
  useEffect(() => {
    console.log('isAddingSubscription 상태 변화:', isAddingSubscription);
  }, [isAddingSubscription]);

  // 4.6. 실시간 진단 도구 설정 (매뉴얼 기반)
  useEffect(() => {
    // 매뉴얼에서 제안한 실시간 진단 도구
    (window as any).supabaseMonitor = {
      // 프로필 상태 확인
      checkProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return console.log("❌ No user logged in");
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);
        
        console.log("🔍 Profile check:", { data, error });
        if (error) {
          console.log("❌ Profile error:", error.message, error.code);
        } else {
          console.log("✅ Profile found:", data);
        }
      },
      
      // 구독 데이터 확인
      checkSubscriptions: async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*');
        
        console.log("🔍 Subscriptions check:", { data, error });
        if (error) {
          console.log("❌ Subscriptions error:", error.message, error.code);
        } else {
          console.log("✅ Subscriptions found:", data?.length || 0, "items");
        }
      },
      
      // RLS 정책 확인
      checkRLS: async () => {
        console.log("🔍 Testing RLS policies...");
        
        try {
          await supabase.from('subscriptions').select('count');
          console.log("✅ Subscriptions accessible");
        } catch (error) {
          console.log("❌ Subscriptions blocked:", error instanceof Error ? error.message : String(error));
        }
        
        try {
          await supabase.from('profiles').select('count');
          console.log("✅ Profiles accessible");
        } catch (error) {
          console.log("❌ Profiles blocked:", error instanceof Error ? error.message : String(error));
        }
      },
      
      // 세션 상태 확인
      checkAuthState: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("🔍 Current session:", session);
        
        if (session) {
          console.log("✅ User ID:", session.user.id);
          console.log("✅ Access token valid:", !!session.access_token);
          console.log("✅ Token expires at:", session.expires_at ? new Date(session.expires_at * 1000) : 'Not set');
        } else {
          console.log("❌ No active session found");
        }
      },
      
      // 네트워크 상태 확인
      checkNetwork: () => {
        console.log("🔍 Network status:", navigator.onLine);
        return navigator.onLine;
      },
      
      // 전체 진단 실행
      runFullDiagnostic: async () => {
        console.log("🚀 Running full diagnostic...");
        await (window as any).supabaseMonitor.checkAuthState();
        await (window as any).supabaseMonitor.checkProfile();
        await (window as any).supabaseMonitor.checkSubscriptions();
        await (window as any).supabaseMonitor.checkRLS();
        (window as any).supabaseMonitor.checkNetwork();
        console.log("✅ Full diagnostic completed");
      }
    };
    
    // 기존 디버깅 함수도 유지
    (window as any).debugSubscriptionApp = {
      getState: () => ({
        isAddingSubscription,
        addingProgress,
        currentScreen,
        user: user?.id,
        subscriptions: subscriptions.length,
        customService
      }),
      resetAddingState: () => {
        console.log('수동으로 isAddingSubscription 상태 리셋');
        setIsAddingSubscription(false);
        setAddingProgress('');
      },
      testConnection: () => testSupabaseConnection(),
      checkNetwork: () => {
        console.log('네트워크 상태 확인:', navigator.onLine);
        return navigator.onLine;
      }
    };
    
    console.log('🔧 실시간 진단 도구 설정 완료!');
    console.log('📋 사용법:');
    console.log('  - window.supabaseMonitor.checkProfile()');
    console.log('  - window.supabaseMonitor.checkSubscriptions()');
    console.log('  - window.supabaseMonitor.checkRLS()');
    console.log('  - window.supabaseMonitor.runFullDiagnostic()');
  }, [isAddingSubscription, addingProgress, currentScreen, user, subscriptions, customService, supabase]);

  // 4.5. Supabase 연결 테스트 (재시도 로직 포함)
  const testSupabaseConnection = async (retryCount = 0): Promise<boolean> => {
    const maxRetries = 2;
    
    try {
      console.log(`Supabase 연결 테스트 시작... (시도 ${retryCount + 1}/${maxRetries + 1})`);
      
      // 사용자 인증 상태 확인
      if (!user) {
        console.error('사용자가 로그인되어 있지 않습니다.');
        return false;
      }

      // 네트워크 연결 확인
      if (!navigator.onLine) {
        console.error('네트워크 연결이 없습니다.');
        return false;
      }

      // 간단한 쿼리로 연결 테스트 (더 안전한 방법)
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .limit(1);
        
      if (error) {
        console.error('Supabase 연결 테스트 실패:', error.message, error);
        
        // 특정 에러 코드에 대한 처리
        if (error.code === 'PGRST116') {
          console.error('인증 토큰이 만료되었습니다.');
          return false;
        }
        
        // 재시도 로직
        if (retryCount < maxRetries) {
          console.log(`${1000 * (retryCount + 1)}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return testSupabaseConnection(retryCount + 1);
        }
        
        return false;
      }
      
      console.log('Supabase 연결 테스트 성공:', data);
      return true;
    } catch (error) {
      console.error('Supabase 연결 예외:', error);
      
      // 재시도 로직
      if (retryCount < maxRetries) {
        console.log(`${1000 * (retryCount + 1)}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return testSupabaseConnection(retryCount + 1);
      }
      
      return false;
    }
  };

  // 5. 사용자 전체 데이터 불러오기
  const loadUserData = async () => {
    if (!user) return;
    
    console.log('Loading user data for user:', user.id);
    
    // 먼저 Supabase 연결을 테스트
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase 연결 실패로 인해 데이터 로딩을 중단합니다.');
      return;
    }
    
    try {
      await Promise.all([
        loadUserSubscriptions(),
        loadUserNotifications(),
        loadUserAlarmHistory()
      ]);
      console.log('User data loaded successfully');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // 6. Supabase 구독 데이터 로딩
  const loadUserSubscriptions = async () => {
    if (!user) return;
    try {
      const { data, error } = await subscriptionErrorHandlers.fetchSubscriptions(user.id);
      
      if (error) {
        console.error('Error loading subscriptions:', error);
        handleError(error, 'load_subscriptions');
        return;
      }
      
      const localSubscriptions: Subscription[] = (data || []).map((sub: any, index: number) => ({
        id: Date.now() + index,
        databaseId: sub.id,
        name: sub.name,
        icon: sub.icon || '📱',
        iconImage: sub.icon_image_url,
        price: sub.price,
        currency: sub.currency as 'KRW' | 'USD' | 'EUR' | 'JPY',
        renewDate: sub.renew_date,
        startDate: sub.start_date || '',
        paymentDate: (sub.payment_date !== null && sub.payment_date !== undefined) ? sub.payment_date.toString() : '',
        paymentCard: sub.payment_card || '',
        url: sub.url || '',
        color: sub.color || '#000000',
        category: sub.category || ''
      }));
      setSubscriptions(localSubscriptions);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      handleError(error, 'load_subscriptions_exception');
    }
  };

  // 7. Supabase 알림 히스토리 로딩
  const loadUserAlarmHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('alarm_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error loading alarm history:', error);
        return;
      }
      const localAlarmHistory: AlarmHistory[] = data.map(alarm => {
        const createdAt = new Date(alarm.created_at);
        return {
          id: alarm.id,
          type: alarm.type,
          content: alarm.content,
          target: alarm.target,
          date: createdAt.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }),
          datetime: createdAt.toISOString().split('T')[0],
          icon: getAlarmIcon(alarm.type),
          iconBackground: getAlarmIconBackground(alarm.type),
          subscriptionId: alarm.subscription_id || undefined,
          subscriptionImage: alarm.subscription_image_url
        };
      });
      setAlarmHistory(localAlarmHistory);
    } catch (error) {
      console.error('Error loading alarm history:', error);
    }
  };

  // 7. Supabase 알림 로딩
  const loadUserNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      const localNotifications: Notification[] = data.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at)
      }));
      setNotifications(localNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // 8. 알림 아이콘 도우미 함수들
  const getAlarmIcon = (type: string) => {
    switch (type) {
      case 'subscription_added': return CheckIcon;
      case 'subscription_updated': return Edit2;
      case 'subscription_deleted': return Trash2;
      case 'renewal_reminder': return Bell;
      case 'payment_due': return CreditCard;
      default: return Bell;
    }
  };

  const getAlarmIconBackground = (type: string): string => {
    switch (type) {
      case 'subscription_added': return 'bg-green-500';
      case 'subscription_updated': return 'bg-blue-500';
      case 'subscription_deleted': return 'bg-red-500';
      case 'renewal_reminder': return 'bg-yellow-500';
      case 'payment_due': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // 9. 환율 변환 함수
  const convertToKRW = (amount: number, currency: string): number => {
    if (currency === 'KRW') return amount;
    if (currency === 'USD') return amount * exchangeRate;
    return amount;
  };

  // 10. 원화로 통합된 총액 계산
  const totalAmountInKRW = subscriptions.reduce((sum, sub) => {
    return sum + convertToKRW(sub.price, sub.currency);
  }, 0);

  // 11. 소셜 미디어 네비게이션
  const navigation = [
    {
      name: 'Blog',
      href: 'https://blog.naver.com/ycdy80',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            clipRule="evenodd"
          />
        </svg>
      ) as React.ReactElement,
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/da_youn/',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ) as React.ReactElement,
    },
    {
      name: 'GitHub',
      href: 'https://github.com/hersouls',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ) as React.ReactElement,
    },
  ];

  // 12. Supabase 알림 추가
  const addNotification = async (type: Notification['type'], title: string, message: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          is_read: false
        })
        .select()
        .single();
      if (error) {
        console.error('Error adding notification:', error);
        return;
      }
      const localNotification: Notification = {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.created_at)
      };
      setNotifications(prev => [localNotification, ...prev]);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // 13. Supabase 알람 히스토리 추가
  const addAlarmHistory = async (type: AlarmHistory['type'], content: string, target: string, subscriptionId?: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('alarm_history')
        .insert({
          user_id: user.id,
          type,
          content,
          target,
          subscription_id: subscriptionId || null
        })
        .select()
        .single();
      if (error) {
        console.error('Error adding alarm history:', error);
        return;
      }
      const createdAt = new Date(data.created_at);
      const newAlarm: AlarmHistory = {
        id: data.id,
        type: data.type,
        content: data.content,
        target: data.target,
        date: createdAt.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }),
        datetime: createdAt.toISOString().split('T')[0],
        icon: getAlarmIcon(data.type),
        iconBackground: getAlarmIconBackground(data.type),
        subscriptionId: data.subscription_id || undefined,
        subscriptionImage: data.subscription_image_url
      };
      setAlarmHistory(prev => [newAlarm, ...prev]);
    } catch (error) {
      console.error('Error adding alarm history:', error);
    }
  };

  // 14. 환율 정보 가져오기
  const fetchExchangeRate = async () => {
    if (!user) {
      console.log('No user logged in, skipping exchange rate fetch');
      return;
    }
    
    setExchangeRateLoading(true);
    try {
      console.log('Fetching exchange rate...');
      
      // Supabase에서 최신 환율 정보 가져오기
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('base_currency', 'USD')
        .eq('target_currency', 'KRW')
        .eq('date', today)
        .single();

      if (data && !error) {
        setExchangeRate(data.rate);
        console.log('Exchange rate loaded from database:', data.rate);
      } else {
        // 외부 API에서 환율 정보 가져오기 (API 키가 설정된 경우)
        const apiKey = process.env.REACT_APP_EXCHANGE_RATE_API_KEY;
        if (apiKey && apiKey !== 'your_exchange_rate_api_key') {
          try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
            const exchangeData = await response.json();
            const usdToKrw = exchangeData.rates.KRW;
            setExchangeRate(usdToKrw);
            
            // Supabase에 환율 정보 저장
            await supabase
              .from('exchange_rates')
              .upsert({
                base_currency: 'USD',
                target_currency: 'KRW',
                rate: usdToKrw,
                date: today
              });
            console.log('Exchange rate loaded from API:', usdToKrw);
          } catch (apiError) {
            console.warn('외부 환율 API 실패, 기본값 사용:', apiError);
            const mockExchangeRate = 1300 + Math.random() * 50;
            setExchangeRate(mockExchangeRate);
          }
        } else {
          // API 키가 없으면 임시 환율 사용
          const mockExchangeRate = 1300 + Math.random() * 50;
          setExchangeRate(mockExchangeRate);
          
          // Supabase에 환율 정보 저장
          await supabase
            .from('exchange_rates')
            .upsert({
              base_currency: 'USD',
              target_currency: 'KRW',
              rate: mockExchangeRate,
              date: today
            });
          console.log('Exchange rate using mock value:', mockExchangeRate);
        }
      }
    } catch (error) {
      console.error('환율 정보를 가져오는데 실패했습니다:', error);
      const mockExchangeRate = 1300 + Math.random() * 50;
      setExchangeRate(mockExchangeRate);
    } finally {
      setExchangeRateLoading(false);
    }
  };



  // 15. Supabase 구독 추가
  // 새로운 구독 추가 함수 (SubscriptionForm과 호환)
  const handleAddSubscriptionWithForm = async (formData: any) => {
    if (!user || isAddingSubscription) return;
    
    console.log('=== 구독 추가 프로세스 시작 ===');
    console.log('사용자 ID:', user.id);
    console.log('폼 데이터:', formData);
    console.log('Supabase 클라이언트:', !!supabase);
    console.log('네트워크 상태:', navigator.onLine);
    
    // 필수 필드 검증
    if (!formData.name || !formData.price || !formData.renew_date) {
      console.error('필수 필드 누락:', { name: formData.name, price: formData.price, renew_date: formData.renew_date });
      alert('필수 정보가 누락되었습니다. 서비스명, 가격, 갱신일을 모두 입력해주세요.');
      return;
    }

    // 날짜 형식 검증
    if (formData.renew_date && !formData.renew_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.error('잘못된 갱신일 형식:', formData.renew_date);
      alert('갱신일 형식이 올바르지 않습니다. (YYYY-MM-DD)');
      return;
    }

    if (formData.start_date && !formData.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.error('잘못된 시작일 형식:', formData.start_date);
      alert('시작일 형식이 올바르지 않습니다. (YYYY-MM-DD)');
      return;
    }

    // 중복 구독 검사
    const existingSubscription = subscriptions.find(sub => 
      sub.name.toLowerCase() === formData.name.toLowerCase()
    );
    if (existingSubscription) {
      console.error('중복 구독 발견:', existingSubscription);
      alert(`"${formData.name}" 구독이 이미 존재합니다. 다른 이름을 사용해주세요.`);
      return;
    }
    
    // 로딩 상태 설정
    setIsAddingSubscription(true);
    
    try {
      // 네트워크 상태 확인
      if (!navigator.onLine) {
        console.error('네트워크 연결이 없습니다');
        alert('인터넷 연결을 확인해주세요.');
        setIsAddingSubscription(false);
        return;
      }

      // Supabase 연결 테스트
      console.log('Supabase 연결 테스트 시작...');
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest) {
        console.error('Supabase 연결 테스트 실패');
        alert('데이터베이스에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
        setIsAddingSubscription(false);
        return;
      }
      console.log('Supabase 연결 테스트 성공');

      // 삽입할 데이터 준비 (DB 스키마에 맞게 변환 및 타입 검증)
      const insertData = {
        user_id: user.id,
        name: String(formData.name || '').trim(),
        icon: String(formData.icon || '📱'),
        icon_image_url: formData.icon_image_url ? String(formData.icon_image_url) : null,
        price: parseFloat(String(formData.price || 0)) || 0,
        currency: String(formData.currency || 'KRW'),
        renew_date: String(formData.renew_date || ''),
        start_date: formData.start_date ? String(formData.start_date) : null,
        payment_date: formData.payment_date ? parseInt(String(formData.payment_date)) : null,
        payment_card: formData.payment_card ? String(formData.payment_card).trim() : null,
        url: formData.url ? String(formData.url).trim() : null,
        color: String(formData.color || '#3B82F6'),
        category: formData.category ? String(formData.category).trim() : null,
        is_active: Boolean(formData.is_active !== false)
      };

      // 필드명 매핑 디버깅
      console.log('=== 필드명 매핑 디버깅 ===');
      console.log('formData.icon_image_url:', formData.icon_image_url);
      console.log('formData.renew_date:', formData.renew_date);
      console.log('formData.start_date:', formData.start_date);
      console.log('formData.payment_date:', formData.payment_date);
      console.log('formData.payment_card:', formData.payment_card);

      // 추가 데이터 검증
      if (insertData.price <= 0) {
        console.error('잘못된 가격:', insertData.price);
        alert('가격은 0보다 큰 값이어야 합니다.');
        setIsAddingSubscription(false);
        return;
      }

      if (insertData.payment_date && (insertData.payment_date < 1 || insertData.payment_date > 31)) {
        console.error('잘못된 결제일:', insertData.payment_date);
        alert('결제일은 1일부터 31일 사이여야 합니다.');
        setIsAddingSubscription(false);
        return;
      }

      console.log('=== 삽입할 데이터 준비 완료 ===');
      console.log('삽입할 데이터:', JSON.stringify(insertData, null, 2));
      console.log('데이터 타입 검증:');
      console.log('- user_id (string):', typeof insertData.user_id, insertData.user_id);
      console.log('- name (string):', typeof insertData.name, insertData.name);
      console.log('- price (number):', typeof insertData.price, insertData.price);
      console.log('- currency (string):', typeof insertData.currency, insertData.currency);
      console.log('- renew_date (string):', typeof insertData.renew_date, insertData.renew_date);
      console.log('- start_date (string|null):', typeof insertData.start_date, insertData.start_date);
      console.log('- payment_date (number|null):', typeof insertData.payment_date, insertData.payment_date);
      console.log('- icon_image_url (string|null):', typeof insertData.icon_image_url, insertData.icon_image_url);

      console.log('=== Supabase 쿼리 실행 시작 ===');
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('=== Supabase 구독 추가 오류 발생 ===');
        console.error('에러 객체:', error);
        console.error('에러 메시지:', error.message);
        console.error('에러 코드:', error.code);
        console.error('에러 상세:', error.details);
        console.error('에러 힌트:', error.hint);
        console.error('전체 에러 정보:', JSON.stringify(error, null, 2));
        console.error('삽입 시도한 데이터:', JSON.stringify(insertData, null, 2));
        console.error('사용자 ID:', user.id);
        console.error('Supabase 클라이언트 상태:', !!supabase);
        
        let userFriendlyMessage = '구독 추가 중 오류가 발생했습니다.';
        
        if (error.message) {
          if (error.message.includes('duplicate key') || error.message.includes('subscriptions_user_name_unique')) {
            userFriendlyMessage = `"${insertData.name}" 구독이 이미 존재합니다. 다른 이름을 사용하거나 기존 구독을 수정해주세요.`;
          } else if (error.message.includes('foreign key')) {
            userFriendlyMessage = '사용자 정보가 올바르지 않습니다. 다시 로그인해주세요.';
          } else if (error.message.includes('check constraint') && error.message.includes('price')) {
            userFriendlyMessage = '가격은 0 이상의 값이어야 합니다.';
          } else if (error.message.includes('check constraint') && error.message.includes('payment_date')) {
            userFriendlyMessage = '결제일은 1일부터 31일 사이여야 합니다.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            userFriendlyMessage = '네트워크 연결을 확인해주세요.';
          } else if (error.message.includes('timeout')) {
            userFriendlyMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
          } else if (error.message.includes('not-null constraint')) {
            userFriendlyMessage = '필수 정보가 누락되었습니다. 모든 필수 항목을 입력해주세요.';
          } else if (error.message.includes('invalid input syntax')) {
            userFriendlyMessage = '입력 데이터 형식이 올바르지 않습니다. 다시 확인해주세요.';
          } else if (error.message.includes('column') && error.message.includes('does not exist')) {
            userFriendlyMessage = '데이터베이스 스키마 오류가 발생했습니다. 관리자에게 문의해주세요.';
          } else {
            userFriendlyMessage = `구독 추가 중 오류가 발생했습니다: ${error.message}`;
          }
        }
        
        alert(`구독 추가 실패: ${userFriendlyMessage}`);
        try {
          await addNotification('error', '구독 추가 실패', userFriendlyMessage);
        } catch (notificationError) {
          console.error('알림 추가 오류:', notificationError);
        }
        setIsAddingSubscription(false);
        return;
      }

      console.log('=== 구독 추가 성공 ===');
      console.log('반환된 데이터:', JSON.stringify(data, null, 2));
      
      const localSubscription: Subscription = {
        id: Date.now(),
        databaseId: data.id,
        name: data.name,
        icon: data.icon || '📱',
        iconImage: data.icon_image_url,
        price: data.price,
        currency: data.currency as 'KRW' | 'USD' | 'EUR' | 'JPY',
        renewDate: data.renew_date,
        startDate: data.start_date || '',
        paymentDate: data.payment_date?.toString() || '',
        paymentCard: data.payment_card || '',
        url: data.url || '',
        color: data.color || '#3B82F6',
        category: data.category || ''
      };

      console.log('=== 로컬 구독 객체 생성 완료 ===');
      console.log('로컬 구독 객체:', JSON.stringify(localSubscription, null, 2));
      setSubscriptions(prev => [localSubscription, ...prev]);
      
      // 알림과 알람 히스토리 추가
      try {
        await addNotification('success', '구독 추가 완료', `${insertData.name} 구독이 성공적으로 추가되었습니다.`);
        await addAlarmHistory('subscription_added', '구독이 추가되었습니다', insertData.name, data.id);
      } catch (error) {
        console.error('알림/알람 히스토리 추가 오류:', error);
      }

      // 성공 알림 표시
      alert(`✅ "${insertData.name}" 구독이 성공적으로 추가되었습니다!`);

      // 성공 시 메인 화면으로 이동
      setCurrentScreen('main');
      setEditingSubscription(null);
      resetForm();
      console.log('=== 구독 추가 프로세스 완료 ===');
      
    } catch (error) {
      console.error('구독 추가 중 예외 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      alert(`구독 추가 실패: ${errorMessage}`);
      
      try {
        await addNotification('error', '구독 추가 실패', `구독 추가 중 오류가 발생했습니다: ${errorMessage}`);
      } catch (notificationError) {
        console.error('알림 추가 오류:', notificationError);
      }
    } finally {
      setIsAddingSubscription(false);
    }
  };

  // 새로운 구독 수정 함수 (SubscriptionForm과 호환)
  const handleUpdateSubscriptionWithForm = async (formData: any) => {
    if (!user || !editingSubscription || isAddingSubscription) return;
    
    console.log('새로운 구독 수정 시작:', formData);
    
    // 로딩 상태 설정
    setIsAddingSubscription(true);
    
    try {
      // 네트워크 상태 확인
      if (!navigator.onLine) {
        console.error('네트워크 연결이 없습니다');
        alert('인터넷 연결을 확인해주세요.');
        setIsAddingSubscription(false);
        return;
      }

      // Supabase 연결 테스트
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest) {
        console.error('Supabase 연결 테스트 실패');
        alert('데이터베이스에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
        setIsAddingSubscription(false);
        return;
      }

      // 업데이트할 데이터 준비
      const updateData = {
        name: formData.name,
        icon: formData.icon || '📱',
        icon_image_url: formData.iconImage || null,
        price: formData.price,
        currency: formData.currency,
        renew_date: formData.renew_date,
        start_date: formData.start_date,
        payment_date: formData.payment_date,
        payment_card: formData.payment_card || null,
        url: formData.url || null,
        color: formData.color || '#3B82F6',
        category: formData.category || null,
        is_active: formData.is_active !== false
      };

      console.log('업데이트할 데이터:', updateData);

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', editingSubscription.databaseId)
        .select()
        .single();

      if (error) {
        console.error('Supabase 구독 수정 오류:', error);
        alert(`구독 수정 실패: ${error.message}`);
        try {
          await addNotification('error', '구독 수정 실패', error.message);
        } catch (notificationError) {
          console.error('알림 추가 오류:', notificationError);
        }
        setIsAddingSubscription(false);
        return;
      }

      console.log('구독 수정 성공:', data);
      
      // 로컬 상태 업데이트
      const updatedSubscription: Subscription = {
        ...editingSubscription,
        name: data.name,
        icon: data.icon || '📱',
        iconImage: data.icon_image_url,
        price: data.price,
        currency: data.currency as 'KRW' | 'USD' | 'EUR' | 'JPY',
        renewDate: data.renew_date,
        startDate: data.start_date || '',
        paymentDate: data.payment_date?.toString() || '',
        paymentCard: data.payment_card || '',
        url: data.url || '',
        color: data.color || '#3B82F6',
        category: data.category || ''
      };

      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === editingSubscription.id ? updatedSubscription : sub
        )
      );
      
      // 알림과 알람 히스토리 추가
      try {
        await addNotification('success', '구독 수정 완료', `${formData.name} 구독이 성공적으로 수정되었습니다.`);
        await addAlarmHistory('subscription_updated', '구독이 수정되었습니다', formData.name, data.id);
      } catch (error) {
        console.error('알림/알람 히스토리 추가 오류:', error);
      }

      // 성공 시 메인 화면으로 이동
      setCurrentScreen('main');
      setEditingSubscription(null);
      resetForm();
      console.log('구독 수정 프로세스 완료');
      
    } catch (error) {
      console.error('구독 수정 중 예외 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      alert(`구독 수정 실패: ${errorMessage}`);
      
      try {
        await addNotification('error', '구독 수정 실패', `구독 수정 중 오류가 발생했습니다: ${errorMessage}`);
      } catch (notificationError) {
        console.error('알림 추가 오류:', notificationError);
      }
    } finally {
      setIsAddingSubscription(false);
    }
  };

  // 기존 레거시 구독 추가 함수 제거 (handleAddSubscriptionWithForm으로 통합)

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setCustomService({
      name: subscription.name,
      price: subscription.price.toString(),
      currency: subscription.currency,
      renewalDate: subscription.renewDate,
      startDate: subscription.startDate,
      paymentDate: subscription.paymentDate ?? '',
      paymentCard: subscription.paymentCard ?? '',
      url: subscription.url ?? '',
      category: subscription.category ?? '',
      notifications: true,
      iconImage: subscription.iconImage ?? ''
    });
    setCurrentScreen('add');
  };

  // 기존 레거시 구독 수정 함수 제거 (handleUpdateSubscriptionWithForm으로 통합)

  // 17. Supabase 구독 삭제
  const handleDeleteSubscription = async (id: number) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (!subscription || !user) return;
    
    if (window.confirm(`"${subscription.name}" 구독을 삭제하시겠습니까?`)) {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.databaseId);

        if (error) {
          console.error('Error deleting subscription:', error);
          await addNotification('error', '구독 삭제 실패', '구독 삭제 중 오류가 발생했습니다.');
          return;
        }

        setSubscriptions(prev => prev.filter(sub => sub.id !== id));
        
        // 알림과 알람 히스토리는 실패해도 구독 삭제는 성공으로 처리
        try {
          await addNotification('info', '구독 삭제 완료', `${subscription.name} 구독이 삭제되었습니다.`);
        } catch (notificationError) {
          console.error('Error adding notification:', notificationError);
        }
        
        try {
          await addAlarmHistory('subscription_deleted', '구독이 삭제되었습니다', subscription.name, subscription.databaseId);
        } catch (alarmError) {
          console.error('Error adding alarm history:', alarmError);
        }
      } catch (error) {
        console.error('Error deleting subscription:', error);
        try {
          await addNotification('error', '구독 삭제 실패', '구독 삭제 중 오류가 발생했습니다.');
        } catch (notificationError) {
          console.error('Error adding error notification:', notificationError);
        }
      }
    }
  };

  // 18. 카테고리 목록


  const resetForm = () => {
    setCustomService({
      name: '',
      price: '',
      currency: 'USD',
      renewalDate: '',
      startDate: '',
      paymentDate: '',
      paymentCard: '',
      url: '',
      category: '',
      notifications: true,
      iconImage: ''
    });
    setIsAddingSubscription(false);
    
    setAddingProgress('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };



  // 19. Supabase 알림 삭제
  const removeNotification = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) {
        console.error('Error removing notification:', error);
        return;
      }
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  // 20. 모든 알림 삭제
  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) {
        console.error('Error clearing notifications:', error);
        return;
      }
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
      case 'warning':
        return <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>;
      case 'error':
        return <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">×</span>
        </div>;
      case 'info':
        return <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">i</span>
        </div>;
    }
  };

  // 21. Supabase 프로필 업데이트
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      // Supabase 테이블 형식에 맞게 변환
      const supabaseUpdates = {
        username: updates.username,
        first_name: updates.firstName,
        last_name: updates.lastName,
        email: updates.email,
        photo_url: updates.photo,
        cover_photo_url: updates.coverPhoto,
        updated_at: new Date().toISOString()
      };

      // Supabase Context의 updateProfile 사용
      await updateSupabaseProfile(supabaseUpdates);
      
      // 로컬 상태도 업데이트
      setProfile(prev => ({ ...prev, ...updates }));
      
      // 성공 알림 추가
      await addNotification('success', '프로필 업데이트 완료', '프로필이 성공적으로 업데이트되었습니다.');
      
      console.log('Profile updated successfully:', supabaseUpdates);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      await addNotification('error', '프로필 업데이트 실패', `프로필 업데이트 중 오류가 발생했습니다: ${errorMessage}`);
    }
  };

  const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
  };

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const formatDateForCalendar = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getSubscriptionEvents = () => {
    const events: { [key: string]: any[] } = {};
    
    subscriptions.forEach(subscription => {
      // 매월 결제일 계산
      const paymentDay = parseInt(subscription.paymentDate ?? '1');
      const renewDate = new Date(subscription.renewDate);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // 현재 월부터 갱신일이 있는 월까지의 결제일들을 계산
      const startMonth = currentMonth;
      const endMonth = renewDate.getMonth();
      const endYear = renewDate.getFullYear();
      
      let currentMonthIndex = startMonth;
      let currentYearIndex = currentYear;
      
      while (
        (currentYearIndex < endYear) || 
        (currentYearIndex === endYear && currentMonthIndex <= endMonth)
      ) {
        // 해당 월의 결제일 계산
        const paymentDate = new Date(currentYearIndex, currentMonthIndex, paymentDay);
        const dateKey = formatDateForCalendar(paymentDate);
        
        if (!events[dateKey]) {
          events[dateKey] = [];
        }
        
        // 중복 방지를 위해 구독 ID로 체크
        const existingEvent = events[dateKey].find(event => event.id === subscription.id);
        if (!existingEvent) {
          events[dateKey].push({
            id: subscription.id,
            name: subscription.name,
            price: subscription.price,
            color: subscription.color,
            icon: subscription.icon,
            iconImage: subscription.iconImage,
            subscription: subscription // 전체 구독 정보 저장
          });
        }
        
        // 다음 월로 이동
        currentMonthIndex++;
        if (currentMonthIndex > 11) {
          currentMonthIndex = 0;
          currentYearIndex++;
        }
      }
    });
    
    return events;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 프로필 관련 함수들
  const handleProfileInput = (field: keyof Profile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfile(prev => ({
          ...prev,
          photo: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfile(prev => ({
          ...prev,
          coverPhoto: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    if (isSavingProfile) return;
    
    setIsSavingProfile(true);
    try {
      // 현재 profile과 supabaseProfile을 비교하여 변경된 필드만 업데이트
      const updates: Partial<Profile> = {};
      
      if (supabaseProfile) {
        if (profile.username !== supabaseProfile.username) updates.username = profile.username;
        if (profile.firstName !== supabaseProfile.first_name) updates.firstName = profile.firstName;
        if (profile.lastName !== supabaseProfile.last_name) updates.lastName = profile.lastName;
        if (profile.email !== supabaseProfile.email) updates.email = profile.email;
        if (profile.photo !== supabaseProfile.photo_url) updates.photo = profile.photo;
        if (profile.coverPhoto !== supabaseProfile.cover_photo_url) updates.coverPhoto = profile.coverPhoto;
      } else {
        // supabaseProfile이 없는 경우 전체 profile을 업데이트
        updates.username = profile.username;
        updates.firstName = profile.firstName;
        updates.lastName = profile.lastName;
        updates.email = profile.email;
        updates.photo = profile.photo;
        updates.coverPhoto = profile.coverPhoto;
      }
      
      console.log('Profile updates to be saved:', updates);
      
      if (Object.keys(updates).length > 0) {
        console.log('Saving profile updates:', updates);
        await updateProfile(updates);
        console.log('Profile saved successfully');
      } else {
        console.log('No changes detected in profile');
        await addNotification('info', '변경사항 없음', '프로필에 변경사항이 없습니다.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      await addNotification('error', '프로필 저장 실패', '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingProfile(false);
      // 저장 완료 후 잠시 대기 후 메인 화면으로 이동
      setTimeout(() => {
        setCurrentScreen('main');
      }, 500);
    }
  };

  const handleProfileCancel = () => {
    // 프로필 변경 사항을 원래 상태로 되돌림
    if (supabaseProfile) {
      setProfile({
        username: supabaseProfile.username || '',
        firstName: supabaseProfile.first_name || '',
        lastName: supabaseProfile.last_name || '',
        email: supabaseProfile.email || user?.email || '',
        photo: supabaseProfile.photo_url || '',
        coverPhoto: supabaseProfile.cover_photo_url || ''
      });
    }
    setCurrentScreen('main');
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showEmergencyTroubleshooter, setShowEmergencyTroubleshooter] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log('Logout already in progress');
      return;
    }
    
    console.log('Logout button clicked');
    setIsLoggingOut(true);
    
    // 타임아웃 설정 (10초)
    const timeoutId = setTimeout(() => {
      console.log('Logout timeout - forcing logout');
      // 로컬 상태 초기화
      setProfile({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        photo: '',
        coverPhoto: ''
      });
      setSubscriptions([]);
      setIsLoggedIn(false);
      setCurrentScreen('main');
      setIsLoggingOut(false);
      addNotification('warning', '로그아웃 완료', '타임아웃으로 인해 로그아웃되었습니다.');
    }, 10000);
    
    try {
      console.log('Calling signOut...');
      await signOut();
      clearTimeout(timeoutId);
      console.log('SignOut completed');
      
      // 로컬 상태 초기화
      setProfile({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        photo: '',
        coverPhoto: ''
      });
      setSubscriptions([]);
      setIsLoggedIn(false);
      setCurrentScreen('main');
      
      // 로그아웃 후 강제로 로그인 화면 표시
      setTimeout(() => {
        console.log('Setting isLoggedIn to false');
        setIsLoggedIn(false);
        setIsLoggingOut(false);
      }, 100);
      addNotification('success', '로그아웃 완료', '성공적으로 로그아웃되었습니다.');
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Logout error:', error);
      addNotification('error', '로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
      setIsLoggingOut(false);
    }
  };

  // 오디오 플레이어 관련 함수들
  const initializeAudio = () => {
    setIsLoading(true);
    const audio = new Audio('/Moonwave (Remastered).mp3');
    audio.volume = volume;
    audio.muted = isMuted;
    audio.loop = isLooping; // 반복 재생 설정
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsLoading(false);
    });
    
    audio.addEventListener('loadstart', () => {
      setIsLoading(true);
    });
    
    audio.addEventListener('canplay', () => {
      setIsLoading(false);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      if (isLooping) {
        // 반복 재생이 활성화된 경우 다시 재생
        audio.currentTime = 0;
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      } else {
        // 반복 재생이 비활성화된 경우 재생 중지
        setIsPlaying(false);
        setCurrentTime(0);
      }
    });
    
    audio.addEventListener('play', () => {
      setIsPlaying(true);
      setIsLoading(false);
    });
    
    audio.addEventListener('pause', () => {
      setIsPlaying(false);
    });
    
    audio.addEventListener('error', () => {
      setIsLoading(false);
      console.error('오디오 파일을 로드할 수 없습니다.');
    });
    
    setAudioRef(audio);
  };

  const togglePlay = () => {
    if (!audioRef) {
      initializeAudio();
      return;
    }
    
    if (isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
  };

  const toggleMute = () => {
    if (!audioRef) return;
    
    const newMutedState = !isMuted;
    audioRef.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef) return;
    
    setVolume(newVolume);
    audioRef.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
      audioRef.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      audioRef.muted = false;
    }
  };

  const handleSeek = (newTime: number) => {
    if (!audioRef) return;
    
    audioRef.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 18. 구독 추가 디버그 함수
  const debugSubscriptionAdd = async () => {
    console.log('=== 구독 추가 디버그 정보 ===');
    console.log('현재 사용자:', user?.id);
    console.log('Supabase 클라이언트:', !!supabase);
    console.log('현재 구독 목록:', subscriptions.length);
    console.log('isAddingSubscription:', isAddingSubscription);
    console.log('네트워크 상태:', navigator.onLine);
    
    // Supabase 연결 테스트
    try {
      const connectionResult = await testSupabaseConnection();
      console.log('Supabase 연결 테스트 결과:', connectionResult);
    } catch (error) {
      console.error('Supabase 연결 테스트 오류:', error);
    }

    // 테스트 구독 추가
    const testData = {
      name: `테스트 구독 ${Date.now()}`, // 중복 방지를 위해 타임스탬프 추가
      icon: '🧪',
      icon_image_url: null,
      price: 9900,
      currency: 'KRW',
      renew_date: '2024-03-15',
      start_date: '2024-02-15',
      payment_date: 15,
      payment_card: null,
      url: null,
      category: 'testing',
      color: '#10B981',
      is_active: true
    };
    
    console.log('=== 테스트 구독 추가 시작 ===');
    console.log('테스트 데이터:', testData);
    await handleAddSubscriptionWithForm(testData);
  };

  // 컴포넌트 마운트 시 오디오 초기화 및 자동 재생
  useEffect(() => {
    if (isLoggedIn) {
      initializeAudio();
      
      // 개발환경에서 디버그 함수를 전역으로 노출
      if (process.env.NODE_ENV === 'development') {
        (window as any).debugSubscriptionAdd = debugSubscriptionAdd;
        console.log('🔧 디버그 모드: window.debugSubscriptionAdd() 함수가 사용 가능합니다.');
      }
      
      // 자동 재생 시도 (브라우저 정책으로 인해 사용자 상호작용 후에만 작동)
      const attemptAutoPlay = async () => {
        if (hasAutoPlayed) return;
        
        try {
          const audio = new Audio('/Moonwave (Remastered).mp3');
          audio.volume = volume;
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          
          // 자동 재생이 가능한 경우 실제 오디오로 재생
          setTimeout(() => {
            if (audioRef && !hasAutoPlayed) {
              audioRef.play().then(() => {
                setHasAutoPlayed(true);
                addNotification('success', '음악 재생', 'Moonwave 음악이 자동으로 재생됩니다.');
              }).catch(() => {
                console.log('자동 재생이 차단되었습니다. 사용자가 재생 버튼을 클릭해주세요.');
              });
            }
          }, 1000);
        } catch (error) {
          console.log('자동 재생이 차단되었습니다. 사용자가 재생 버튼을 클릭해주세요.');
        }
      };
      
      // 페이지 로드 후 3초 뒤에 자동 재생 시도
      const autoPlayTimer = setTimeout(attemptAutoPlay, 3000);
      
      // Cleanup 함수
      return () => {
        clearTimeout(autoPlayTimer);
        if (audioRef) {
          audioRef.pause();
          audioRef.src = '';
        }
      };
    }
  }, [isLoggedIn]);

  // 반복 재생 상태 변경 시 오디오 요소 업데이트
  useEffect(() => {
    if (audioRef) {
      audioRef.loop = isLooping;
    }
  }, [isLooping, audioRef]);

  // 로딩 중이거나 로그인하지 않은 경우
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
        <GoogleAuthDebug />
      </>
    );
  }



  // 공통 헤더 컴포넌트

  const CommonHeader = () => (
    <Header
      onHomeClick={() => {
        console.log('홈 버튼 클릭됨 - CommonHeader');
        setCurrentScreen('main');
        setSelectedSubscription(null);
        setEditingSubscription(null);
        resetForm();
      }}
      onNotificationClick={() => setCurrentScreen('alarm-history')}
      onProfileClick={() => {
        console.log('아바타 버튼 클릭됨 - CommonHeader');
        setCurrentScreen('profile');
      }}
      notificationCount={alarmHistory.length}
      profile={profile}
    />
  );

  // 메인 구독 관리 화면
  if (currentScreen === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 네트워크 상태 표시 */}
        {!isOnline && (
          <div className="bg-red-500 text-white text-center py-2 px-4">
            <div className="flex items-center justify-center space-x-2">
              <span>🌐</span>
              <span>오프라인 모드입니다. 네트워크 연결을 확인해주세요.</span>
            </div>
          </div>
        )}
        
        {/* 에러 표시 */}
        {currentError && (
          <ErrorDisplay
            error={currentError}
            actions={ErrorActionGenerator.generateActions(currentError, {
              onRetry: () => retryLastAction(() => loadUserSubscriptions()),
              onRefresh: () => window.location.reload(),
              onGoBack: () => window.history.back()
            })}
            onClose={clearError}
          />
        )}
        
        {/* 헤더 영역 */}
        <CommonHeader />

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 lg:px-6 xl:px-8 pt-8 pb-24 min-h-[70vh] -mt-4 relative z-0">
          {/* 반응형 최대 너비 제한 */}
          <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto">
            

            
            {/* 통계 카드 섹션 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 mb-8">
              <StatsCard
                title="총 구독 수"
                value={`${subscriptions.length}개`}
                subtitle="활성 구독 서비스"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="info"
              />
              <StatsCard
                title="월 총액"
                value={`₩${Math.round(totalAmountInKRW).toLocaleString()}`}
                subtitle={exchangeRateLoading ? "환율 정보 업데이트 중..." : "원화 기준"}
                icon={<CreditCard className="w-5 h-5" />}
                variant="gradient"
              />
            </div>

          {/* 구독 서비스 리스트 */}
          <div className="space-y-4 mb-8">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onEdit={handleEditSubscription}
                onDelete={handleDeleteSubscription}
              />
            ))}
          </div>

          {/* 달력 섹션 */}
          <div className="bg-white rounded-t-2xl shadow-md overflow-hidden">
            {/* 달력 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </h2>
              <div className="flex items-center gap-2">
          <button 
                  onClick={goToPreviousMonth}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  오늘
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
          </button>
              </div>
            </div>

            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="bg-white py-2 text-center text-xs font-semibold text-gray-700">
                  {day}
                </div>
              ))}

              {/* 날짜 셀 */}
              {getDaysInMonth(currentDate).map((date, index) => {
                const dateKey = formatDateForCalendar(date);
                const events = getSubscriptionEvents()[dateKey] || [];
                const isCurrentMonthDay = isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={index}
                    className={`bg-white min-h-[80px] p-2 ${
                      !isCurrentMonthDay ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${
                          isTodayDate
                            ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                            : ''
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {events.length > 0 && (
                        <span className="text-xs text-blue-600 font-medium">
                          {events.length}개
                        </span>
                      )}
                    </div>
                    
                    {/* 이벤트 표시 */}
                    <div className="space-y-1">
                      {events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="w-full flex items-center gap-1 p-1 rounded text-xs hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                          style={{ backgroundColor: `${event.color}20` }}
                          onClick={() => {
                            handleEditSubscription(event.subscription);
                          }}
                        >
                          <div
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (event.subscription.url) {
                                window.open(event.subscription.url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] text-white overflow-hidden hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                            style={{ backgroundColor: event.color }}
                          >
                            {event.iconImage ? (
                              <img 
                                src={event.iconImage} 
                                alt={event.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              event.icon
                            )}
                          </div>
                          <span className="truncate font-medium text-left" style={{ color: event.color }}>
                            {event.name}
                            {/* event.isPaymentDay && <span className="text-[10px] ml-1">(결제)</span> */}
                            {/* event.isRenewalDay && <span className="text-[10px] ml-1">(갱신)</span> */}
                          </span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{events.length - 2}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오디오 플레이어 섹션 */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">Moonwave Music</h3>
                  {isPlaying && (
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-3 bg-blue-600 rounded-full animate-pulse" />
                      <div className="w-1 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    className={`p-1 transition-colors duration-200 ${
                      isLooping 
                        ? 'text-blue-600 hover:text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title={isLooping ? '반복 재생 중' : '반복 재생 끄기'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    isLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div
                      className="absolute top-0 left-0 h-1 bg-blue-600 rounded-lg"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <footer className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
            <div className="flex justify-center space-x-6 md:order-2">
              {navigation.map((item) => (
                <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
            <div className="mt-8 md:order-1 md:mt-0">
              <p className="text-center text-sm leading-5 text-gray-500">
                &copy; 2025 Moonwave Company, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* 전역 알림 */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          <Transition show={showNotification && notifications.length > 0}>
            <div className="pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition-all duration-300 ease-out">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    {notifications.length > 0 && getNotificationIcon(notifications[0].type)}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    {notifications.length > 0 && (
                      <>
                        <p className="text-sm font-medium text-gray-900">{notifications[0].title}</p>
                        <p className="mt-1 text-sm text-gray-500">{notifications[0].message}</p>
                      </>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowNotification(false)}
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                    >
                      <span className="sr-only">닫기</span>
                      <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
            </div>
          </Transition>
        </div>
      </div>

      {/* 오른쪽 하단 고정 버튼들 */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-40">
        
        {/* 개발 환경에서만 보이는 디버그 버튼 */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Button
              onClick={debugSubscriptionAdd}
              variant="outline"
              size="icon"
              className="w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
              title="구독 추가 디버그 테스트"
            >
              🔧
            </Button>
            <Button
              onClick={() => setShowEmergencyTroubleshooter(true)}
              variant="outline"
              size="icon"
              className="w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-red-500 hover:bg-red-600 text-white border-red-500"
              title="긴급 상황 진단 도구"
            >
              🚨
            </Button>
          </>
        )}
        
        {/* 구독 추가 버튼 */}
        <Button
          onClick={() => {
            setCurrentScreen('add');
            resetForm();
          }}
          variant="gradient"
          size="icon"
          className="w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* 개발 환경에서만 보이는 Supabase 디버거 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-50 max-w-md">
          <SupabaseDebugger />
        </div>
      )}

      {/* 디버그 패널 */}
      <DebugPanel
        onTestConnection={async () => {
          console.log('=== 디버그: DB 연결 테스트 시작 ===');
          const result = await testSupabaseConnection();
          console.log('DB 연결 테스트 결과:', result);
        }}
        onTestSubscription={async () => {
          console.log('=== 디버그: 테스트 구독 추가 시작 ===');
          const testData = {
            name: 'Test Service',
            icon: '🧪',
            iconImage: '',
            price: 1000,
            currency: 'KRW',
            renew_date: new Date().toISOString().split('T')[0],
            start_date: new Date().toISOString().split('T')[0],
            payment_date: 15,
            payment_card: 'Test Card',
            url: 'https://example.com',
            color: '#FF6B6B',
            category: 'test',
            is_active: true
          };
          await handleAddSubscriptionWithForm(testData);
        }}
        onClearLogs={() => {
          console.clear();
          console.log('=== 콘솔 로그가 지워졌습니다 ===');
        }}
      />

      {/* 긴급 상황 진단 도구 */}
      <EmergencyTroubleshooter
        isVisible={showEmergencyTroubleshooter}
        onClose={() => setShowEmergencyTroubleshooter(false)}
      />
      </div>
    );
  }

  // 구독 관리 화면
  if (currentScreen === 'manage') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <CommonHeader />
        
        {/* 페이지 제목 */}
        <div className="px-4 mb-6">
            <h1 className="text-white text-2xl font-bold tracking-tight">구독 관리</h1>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">내 구독 서비스</h2>
            <p className="text-gray-600">총 {subscriptions.length}개의 구독 서비스</p>
          </div>

          {/* 구독 서비스 관리 리스트 */}
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (subscription.url) {
                          window.open(subscription.url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm overflow-hidden hover:opacity-80 transition-opacity duration-200"
                      style={{ backgroundColor: subscription.color }}
                      disabled={!subscription.url}
                    >
                      {subscription.iconImage ? (
                        <img 
                          src={subscription.iconImage} 
                          alt={subscription.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        subscription.icon
                      )}
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {subscription.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">{subscription.category ?? ''}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        갱신일: {formatDate(subscription.renewDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">
                      ${subscription.price}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubscription(subscription)}
                        className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 새 구독 추가 버튼 */}
          <button 
            onClick={() => {
              setCurrentScreen('add');
              resetForm();
            }}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="w-5 h-5" />
            새 구독 추가
          </button>
        </div>
      </div>
    );
  }

  // 구독 상세 보기 화면
  if (currentScreen === 'detail' && selectedSubscription) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
        rel="stylesheet"
      />
      
      {/* 헤더 영역 */}
        <CommonHeader />
        
        {/* 페이지 제목 */}
        <div className="px-4 mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">구독 정보</h1>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          {/* 구독 상세 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => {
                  if (selectedSubscription.url) {
                    window.open(selectedSubscription.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden hover:opacity-80 transition-opacity duration-200"
                style={{ backgroundColor: selectedSubscription.color }}
                disabled={!selectedSubscription.url}
              >
                {selectedSubscription.iconImage ? (
                  <img 
                    src={selectedSubscription.iconImage} 
                    alt={selectedSubscription.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedSubscription.icon
                )}
          </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedSubscription.name}
                </h2>
                <p className="text-gray-500">{selectedSubscription.category ?? ''}</p>
              </div>
        </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">월 구독료</span>
            </div>
                <span className="text-2xl font-bold text-gray-900">
                  ₩{Math.round(convertToKRW(selectedSubscription.price, selectedSubscription.currency)).toLocaleString()}
                </span>
          </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">구독 갱신일</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {formatDate(selectedSubscription.renewDate)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">구독 시작일</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {formatDate(selectedSubscription.startDate)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">매월 결제일</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {selectedSubscription.paymentDate ? `${selectedSubscription.paymentDate}일` : '미설정'}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">결제 방법</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {selectedSubscription.paymentCard || '미설정'}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">카테고리</span>
                </div>
                <span className="text-gray-900 font-medium">
                  {selectedSubscription.category ?? ''}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">서비스 URL</span>
                </div>
                <a 
                  href={selectedSubscription.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium truncate max-w-[200px]"
                >
                  {selectedSubscription.url || '미설정'}
                </a>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
          <button 
              onClick={() => handleEditSubscription(selectedSubscription)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Edit2 className="w-5 h-5" />
              수정하기
          </button>
            <button
              onClick={() => handleDeleteSubscription(selectedSubscription.id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <Trash2 className="w-5 h-5" />
              삭제하기
            </button>
        </div>
        </div>
      </div>
    );
  }

  // 알림 화면
  if (currentScreen === 'notifications') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <CommonHeader />
        
        {/* 페이지 제목 */}
        <div className="px-4 mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">알림</h1>
            </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">알림 목록</h2>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                모두 지우기
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">알림이 없습니다</p>
                <p className="text-gray-400 text-sm mt-1">새로운 알림이 오면 여기에 표시됩니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border-l-4"
                  style={{
                    borderLeftColor: 
                      notification.type === 'success' ? '#10B981' :
                      notification.type === 'warning' ? '#F59E0B' :
                      notification.type === 'error' ? '#EF4444' : '#3B82F6'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.timestamp.toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 알람 히스토리 화면
  if (currentScreen === 'alarm-history') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <CommonHeader />
        
        {/* 페이지 제목 */}
        <div className="px-4 mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">알람 히스토리</h1>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">알람 기록</h2>
            {alarmHistory.length > 0 && (
              <span className="text-sm text-gray-500">
                총 {alarmHistory.length}개의 알람
              </span>
            )}
          </div>

          {/* 알람 히스토리 타임라인 */}
          <div className="flow-root">
            {alarmHistory.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">알람 기록이 없습니다</p>
                <p className="text-gray-400 text-sm mt-1">구독 활동이 여기에 기록됩니다</p>
              </div>
            ) : (
              <ul className="-mb-8">
                {alarmHistory.map((event, eventIdx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {eventIdx !== alarmHistory.length - 1 ? (
                        <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          {event.subscriptionImage ? (
                            <div className="flex size-8 items-center justify-center rounded-full ring-8 ring-white overflow-hidden">
                              <img 
                                src={event.subscriptionImage} 
                                alt="구독 아이콘"
                                className="w-full h-full object-cover"
                              />
        </div>
                          ) : (
                            <span
                              className={classNames(
                                event.iconBackground,
                                'flex size-8 items-center justify-center rounded-full ring-8 ring-white',
                              )}
                            >
                              <event.icon aria-hidden="true" className="size-5 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              {event.content}{' '}
                              <span className="font-medium text-gray-900">
                                {event.target}
                              </span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime={event.datetime}>{event.date}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 프로필 화면
  if (currentScreen === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <CommonHeader />
        
        {/* 페이지 제목 */}
        <div className="px-4 mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">프로필</h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleProfileSave(); }}>
            <div className="space-y-8">
              {/* 프로필 섹션 */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">기본 정보</h2>
                <p className="text-sm text-gray-600 mb-6">
                  이 정보는 공개적으로 표시되므로 공유하는 내용에 주의하세요.
                </p>

                <div className="space-y-6">
                  {/* 사용자명 */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
                      사용자명
                    </label>
              <input
                      id="username"
                type="text"
                      value={profile.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleProfileInput('username', e.target.value)}
                      placeholder="사용자명을 입력하세요"
                      className="block w-full py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg bg-white border border-gray-300 text-sm"
              />
            </div>

                  {/* 프로필 사진 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      프로필 사진
                    </label>
                    <div className="flex items-center gap-4">
                      {profile.photo ? (
                        <img 
                          src={profile.photo} 
                          alt="프로필 사진"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-12 h-12 text-gray-300" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 cursor-pointer"
                      >
                        변경
                      </label>
                    </div>
            </div>

                  {/* 커버 사진 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      커버 사진
                    </label>
                    <div className="flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10">
                      <div className="text-center">
                        <PhotoIcon className="mx-auto w-12 h-12 text-gray-300 mb-4" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverPhotoUpload}
                            className="hidden"
                            id="cover-photo-upload"
                          />
                          <label
                            htmlFor="cover-photo-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 hover:text-blue-500"
                          >
                            <span>파일 업로드</span>
                          </label>
                          <p className="pl-1">또는 드래그 앤 드롭</p>
                      </div>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF 최대 10MB</p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 개인 정보 섹션 */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">개인 정보</h2>
                <p className="text-sm text-gray-600 mb-6">
                  메일을 받을 수 있는 영구 주소를 사용하세요.
                </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* 이름 */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                      이름
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => handleProfileInput('firstName', e.target.value)}
                      className="block w-full rounded-lg bg-white px-3 py-2 text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                  </div>

                  {/* 성 */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                      성
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => handleProfileInput('lastName', e.target.value)}
                      className="block w-full rounded-lg bg-white px-3 py-2 text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                  </div>

                  {/* 이메일 주소 */}
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                      이메일 주소
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileInput('email', e.target.value)}
                      className="block w-full rounded-lg bg-white px-3 py-2 text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isLoggingOut 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center ${
                    isSavingProfile 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isSavingProfile ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </>
                  ) : (
                    '저장'
                  )}
                </button>
              </div>
            </div>
          </form>
            </div>
      </div>
    );
  }

  // 구독 추가 화면 (SubscriptionForm 컴포넌트 사용)
  if (currentScreen === 'add') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <CommonHeader />
        
        {/* 페이지 제목 */}
        <div className="px-4 mb-6">
          <h1 className="text-white text-2xl font-bold tracking-tight">
            {editingSubscription ? '구독 수정' : '새 구독 추가'}
          </h1>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          <SubscriptionForm
            subscription={editingSubscription ? {
              id: editingSubscription.id,
              name: editingSubscription.name,
              icon: editingSubscription.icon,
              iconImage: editingSubscription.iconImage,
              price: editingSubscription.price,
              currency: editingSubscription.currency,
              renewDate: editingSubscription.renewDate,
              startDate: editingSubscription.startDate,
              paymentDate: editingSubscription.paymentDate,
              paymentCard: editingSubscription.paymentCard,
              url: editingSubscription.url,
              color: editingSubscription.color,
              category: editingSubscription.category,
              isActive: editingSubscription.isActive
            } : undefined}
            onSubmit={editingSubscription ? handleUpdateSubscriptionWithForm : handleAddSubscriptionWithForm}
            onCancel={() => {
              setCurrentScreen('main');
              setEditingSubscription(null);
              resetForm();
            }}
            isLoading={isAddingSubscription}
          />
        </div>
      </div>
    );
  }

  // 기본값: 메인 화면으로 리다이렉트
  return null;
};

// 메인 앱 컴포넌트를 라우팅으로 감싸기
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/safe" element={<SafeSubscriptionApp />} />
        <Route path="/error-test" element={<ErrorScenarioTester />} />

        <Route path="/" element={<SubscriptionApp />} />
      </Routes>
    </Router>
  );
};

export default App;
