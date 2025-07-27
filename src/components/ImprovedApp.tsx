import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Calendar, Tag, Bell, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, CreditCard, Globe, Banknote, CalendarRange, TrendingUp, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon, XMarkIcon, CheckIcon, PhotoIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import { useSupabase } from '../contexts/SupabaseContext';
import { LoginScreen } from './LoginScreen';
import { GoogleAuthDebug } from './GoogleAuthDebug';
import { AuthCallback } from './AuthCallback';
import { SupabaseDebugger } from './SupabaseDebugger';
import { EmergencyTroubleshooter } from './EmergencyTroubleshooter';
import SafeSubscriptionApp from './SafeSubscriptionApp';
import ErrorScenarioTester from './ErrorScenarioTester';

import Header from './ui/header';
import StatsCard from './ui/stats-card';
import SubscriptionCard from './ui/subscription-card';
import SubscriptionForm from './ui/subscription-form';
import DebugPanel from './DebugPanel';
import { Button } from './ui/button';
import TestPage from '../pages/TestPage';
import { createDebugObject } from '../utils/responsive-debug';
import { 
  useSafeAsync, 
  useSafeState, 
  useDebounce, 
  useSafeEventListener,
  useSafeInterval,
  useSafeTimeout,
  useMemoryMonitor,
  useSafeLocalStorage,
  useSafeNotifications
} from '../hooks/useMemorySafeApp';

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

/**
 * 메모리 안전한 구독 앱 컴포넌트
 * 
 * 🔴 해결된 문제들:
 * 1. useEffect 의존성 배열 누락
 * 2. 이벤트 리스너 정리 누락
 * 3. 불필요한 리렌더링
 * 4. 메모리 누수 방지
 */
const ImprovedSubscriptionApp: React.FC = () => {
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase, updateProfile: updateSupabaseProfile } = useSupabase();

  // 🔧 안전한 상태 관리
  const [subscriptions, setSubscriptions] = useSafeState<Subscription[]>([]);
  const [alarmHistory, setAlarmHistory] = useSafeState<AlarmHistory[]>([]);
  const [notifications, setNotifications] = useSafeState<Notification[]>([]);
  const [currentMonth, setCurrentMonth] = useSafeState(new Date());
  const [selectedDate, setSelectedDate] = useSafeState<Date | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useSafeState(false);
  const [profile, setProfile] = useSafeState<Profile>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    photo: '',
    coverPhoto: ''
  });
  const [isAudioPlaying, setIsAudioPlaying] = useSafeState(false);
  const [audioVolume, setAudioVolume] = useSafeState(0.5);
  const [isMuted, setIsMuted] = useSafeState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useSafeState(0);
  const [audioDuration, setAudioDuration] = useSafeState(0);
  const [exchangeRate, setExchangeRate] = useSafeState(1300);
  const [isLoading, setIsLoading] = useSafeState(false);
  const [error, setError] = useSafeState<string | null>(null);

  // 🔧 안전한 비동기 작업
  const { execute, isMounted } = useSafeAsync();
  
  // 🔧 안전한 알림 관리
  const { notifications: safeNotifications, addNotification, removeNotification, clearAllNotifications } = useSafeNotifications();
  
  // 🔧 안전한 로컬 스토리지
  const [userPreferences, setUserPreferences] = useSafeLocalStorage('user-preferences', {
    theme: 'light',
    language: 'ko',
    notifications: true,
    audioEnabled: true
  });
  
  // 🔧 메모리 모니터링
  const memoryInfo = useMemoryMonitor();
  
  // 🔧 refs for cleanup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const exchangeRateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debugIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ 반응형 디버깅 도구 초기화 (한 번만 실행)
  useEffect(() => {
    createDebugObject();
  }, []); // ✅ 빈 의존성 배열

  // ✅ URL 정리 함수 (메모이제이션)
  const handleURLCleanup = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    window.history.replaceState({}, document.title, url.toString());
  }, []);

  // ✅ Supabase 연결 테스트 (안전한 비동기 처리)
  const testSupabaseConnection = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const result = await execute(
        async (signal) => {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('count')
            .limit(1);

          if (error) throw error;
          return data;
        },
        {
          onSuccess: () => {
            console.log('Supabase connection successful');
            addNotification({
              type: 'success',
              title: '연결 성공',
              message: '데이터베이스 연결이 정상입니다.',
              duration: 3000
            });
          },
          onError: (error) => {
            console.error('Supabase connection failed:', error);
            addNotification({
              type: 'error',
              title: '연결 실패',
              message: '데이터베이스 연결에 실패했습니다.',
              duration: 5000
            });
          }
        }
      );

      return result !== null;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }, [supabase, execute, addNotification]);

  // ✅ 사용자 데이터 로드 (안전한 비동기 처리)
  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      await execute(
        async (signal) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;
          return profileData;
        },
        {
          onSuccess: (data) => {
            if (data) {
              setProfile({
                username: data.username || '',
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                email: data.email || '',
                photo: data.photo || '',
                coverPhoto: data.cover_photo || ''
              });
            }
          },
          onError: (error) => {
            console.error('Failed to load user data:', error);
            setError('사용자 데이터 로드 실패');
          }
        }
      );
    } catch (error) {
      console.error('Load user data failed:', error);
    }
  }, [user, supabase, execute, setProfile, setError]);

  // ✅ 구독 데이터 로드 (안전한 비동기 처리)
  const loadUserSubscriptions = useCallback(async () => {
    if (!user) return;

    try {
      await execute(
        async (signal) => {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        },
        {
          onSuccess: (data) => {
            setSubscriptions(data || []);
          },
          onError: (error) => {
            console.error('Failed to load subscriptions:', error);
            setError('구독 데이터 로드 실패');
          }
        }
      );
    } catch (error) {
      console.error('Load subscriptions failed:', error);
    }
  }, [user, supabase, execute, setSubscriptions, setError]);

  // ✅ 알림 히스토리 로드 (안전한 비동기 처리)
  const loadUserAlarmHistory = useCallback(async () => {
    if (!user) return;

    try {
      await execute(
        async (signal) => {
          const { data, error } = await supabase
            .from('alarm_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;
          return data;
        },
        {
          onSuccess: (data) => {
            setAlarmHistory(data || []);
          },
          onError: (error) => {
            console.error('Failed to load alarm history:', error);
          }
        }
      );
    } catch (error) {
      console.error('Load alarm history failed:', error);
    }
  }, [user, supabase, execute, setAlarmHistory]);

  // ✅ 알림 로드 (안전한 비동기 처리)
  const loadUserNotifications = useCallback(async () => {
    if (!user) return;

    try {
      await execute(
        async (signal) => {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) throw error;
          return data;
        },
        {
          onSuccess: (data) => {
            setNotifications(data || []);
          },
          onError: (error) => {
            console.error('Failed to load notifications:', error);
          }
        }
      );
    } catch (error) {
      console.error('Load notifications failed:', error);
    }
  }, [user, supabase, execute, setNotifications]);

  // ✅ 환율 정보 가져오기 (안전한 비동기 처리)
  const fetchExchangeRate = useCallback(async () => {
    try {
      await execute(
        async (signal) => {
          const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            signal
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
          }
          
          const data = await response.json();
          return data.rates.KRW;
        },
        {
          onSuccess: (rate) => {
            setExchangeRate(rate);
          },
          onError: (error) => {
            console.error('Failed to fetch exchange rate:', error);
            // 기본값 사용
            setExchangeRate(1300);
          }
        }
      );
    } catch (error) {
      console.error('Fetch exchange rate failed:', error);
    }
  }, [execute, setExchangeRate]);

  // ✅ 오디오 초기화 (안전한 이벤트 리스너)
  const initializeAudio = useCallback(() => {
    if (!userPreferences.audioEnabled) return;

    const audio = new Audio('/path/to/notification-sound.mp3');
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsAudioPlaying(false);
      setAudioCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // 정리 함수 반환
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, [userPreferences.audioEnabled, setAudioDuration, setAudioCurrentTime, setIsAudioPlaying]);

  // ✅ 오디오 재생/일시정지 (안전한 처리)
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        await audioRef.current.play();
        setIsAudioPlaying(true);
      }
    } catch (error) {
      console.error('Audio play failed:', error);
      addNotification({
        type: 'error',
        title: '오디오 재생 실패',
        message: '오디오를 재생할 수 없습니다.',
        duration: 3000
      });
    }
  }, [isAudioPlaying, setIsAudioPlaying, addNotification]);

  // ✅ 음소거 토글 (안전한 처리)
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;

    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted, setIsMuted]);

  // ✅ 볼륨 변경 (안전한 처리)
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!audioRef.current) return;

    audioRef.current.volume = newVolume;
    setAudioVolume(newVolume);
  }, [setAudioVolume]);

  // ✅ 시간 이동 (안전한 처리)
  const handleSeek = useCallback((newTime: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = newTime;
    setAudioCurrentTime(newTime);
  }, [setAudioCurrentTime]);

  // ✅ 시간 포맷팅 (메모이제이션)
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // ✅ 알림 추가 (안전한 비동기 처리)
  const addNotificationSafe = useCallback(async (type: Notification['type'], title: string, message: string) => {
    if (!user) return;

    try {
      await execute(
        async (signal) => {
          const { data, error } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type,
              title,
              message,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        {
          onSuccess: (data) => {
            setNotifications(prev => [data, ...prev]);
            addNotification({
              type,
              title,
              message,
              duration: 4000
            });
          },
          onError: (error) => {
            console.error('Failed to add notification:', error);
          }
        }
      );
    } catch (error) {
      console.error('Add notification failed:', error);
    }
  }, [user, supabase, execute, setNotifications, addNotification]);

  // ✅ 알림 제거 (안전한 비동기 처리)
  const removeNotificationSafe = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await execute(
        async (signal) => {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
        },
        {
          onSuccess: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          },
          onError: (error) => {
            console.error('Failed to remove notification:', error);
          }
        }
      );
    } catch (error) {
      console.error('Remove notification failed:', error);
    }
  }, [user, supabase, execute, setNotifications]);

  // ✅ 모든 알림 제거 (안전한 비동기 처리)
  const clearAllNotificationsSafe = useCallback(async () => {
    if (!user) return;

    try {
      await execute(
        async (signal) => {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;
        },
        {
          onSuccess: () => {
            setNotifications([]);
            clearAllNotifications();
          },
          onError: (error) => {
            console.error('Failed to clear notifications:', error);
          }
        }
      );
    } catch (error) {
      console.error('Clear notifications failed:', error);
    }
  }, [user, supabase, execute, setNotifications, clearAllNotifications]);

  // ✅ 사용자 인증 상태 변경 시 데이터 로드
  useEffect(() => {
    if (user && !authLoading) {
      loadUserData();
      loadUserSubscriptions();
      loadUserAlarmHistory();
      loadUserNotifications();
      fetchExchangeRate();
    }
  }, [user, authLoading, loadUserData, loadUserSubscriptions, loadUserAlarmHistory, loadUserNotifications, fetchExchangeRate]);

  // ✅ 오디오 초기화
  useEffect(() => {
    const cleanup = initializeAudio();
    return cleanup;
  }, [initializeAudio]);

  // ✅ URL 정리
  useEffect(() => {
    handleURLCleanup();
  }, [handleURLCleanup]);

  // ✅ 주기적 작업들 (안전한 인터벌)
  useSafeInterval(() => {
    if (user) {
      fetchExchangeRate();
    }
  }, 300000); // 5분마다

  useSafeInterval(() => {
    if (user) {
      loadUserNotifications();
    }
  }, 60000); // 1분마다

  // ✅ 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 모든 타이머 정리
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      if (exchangeRateIntervalRef.current) {
        clearInterval(exchangeRateIntervalRef.current);
      }
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
      }
      
      // 오디오 정리
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  // ✅ 안전한 이벤트 리스너들
  useSafeEventListener('resize', () => {
    console.log('Window resized');
  }, window);

  useSafeEventListener('online', () => {
    addNotification({
      type: 'success',
      title: '인터넷 연결',
      message: '인터넷에 다시 연결되었습니다.',
      duration: 3000
    });
  }, window);

  useSafeEventListener('offline', () => {
    addNotification({
      type: 'warning',
      title: '인터넷 연결 끊김',
      message: '인터넷 연결이 끊어졌습니다.',
      duration: 5000
    });
  }, window);

  // 로딩 중이거나 사용자가 없으면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 사용자가 없으면 로그인 화면 표시
  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header 
          onHomeClick={() => {}}
          onNotificationClick={() => {}}
          onProfileClick={() => setIsEditingProfile(true)}
          notificationCount={notifications.length}
          profile={profile}
        />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              <div className="space-y-8">
                {/* 통계 카드들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard
                    title="총 구독"
                    value={subscriptions.length}
                    icon={<Tag className="w-6 h-6" />}
                    trend={{ value: 2, isPositive: true }}
                  />
                  <StatsCard
                    title="월 구독료"
                    value={`₩${subscriptions.reduce((sum, sub) => sum + sub.price, 0).toLocaleString()}`}
                    icon={<CreditCard className="w-6 h-6" />}
                    trend={{ value: 5, isPositive: true }}
                  />
                  <StatsCard
                    title="활성 구독"
                    value={subscriptions.filter(sub => sub.isActive).length}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    trend={{ value: 1, isPositive: true }}
                  />
                  <StatsCard
                    title="이번 달 만료"
                    value={subscriptions.filter(sub => {
                      const renewDate = new Date(sub.renewDate);
                      const now = new Date();
                      return renewDate.getMonth() === now.getMonth() && renewDate.getFullYear() === now.getFullYear();
                    }).length}
                    icon={<Calendar className="w-6 h-6" />}
                    trend={{ value: 1, isPositive: false }}
                  />
                </div>

                {/* 구독 목록 */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">내 구독</h2>
                    <Button onClick={() => {}}>
                      <Plus className="w-4 h-4 mr-2" />
                      구독 추가
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptions.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                </div>

                {/* 오디오 컨트롤 */}
                {userPreferences.audioEnabled && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">오디오 컨트롤</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlay}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                      >
                        {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={audioDuration}
                          value={audioCurrentTime}
                          onChange={(e) => handleSeek(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{formatTime(audioCurrentTime)}</span>
                          <span>{formatTime(audioDuration)}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={toggleMute}
                        className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={audioVolume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                )}

                {/* 메모리 모니터링 */}
                {memoryInfo && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">메모리 사용량</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-gray-100 rounded">
                        <div className="font-semibold">사용 중</div>
                        <div>{(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <div className="p-3 bg-gray-100 rounded">
                        <div className="font-semibold">총 힙 크기</div>
                        <div>{(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <div className="p-3 bg-gray-100 rounded">
                        <div className="font-semibold">힙 제한</div>
                        <div>{(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            } />
            
            <Route path="/test" element={<TestPage />} />
            <Route path="/debug" element={
              <DebugPanel 
                onTestSubscription={() => console.log('Test subscription clicked')}
                onTestConnection={() => console.log('Test connection clicked')}
                onClearLogs={() => console.clear()}
              />
            } />
            <Route path="/google-auth-debug" element={<GoogleAuthDebug />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/supabase-debugger" element={<SupabaseDebugger />} />
            <Route path="/emergency-troubleshooter" element={
              <EmergencyTroubleshooter 
                isVisible={true}
                onClose={() => {}}
              />
            } />
            <Route path="/safe-subscription-app" element={<SafeSubscriptionApp />} />
            <Route path="/error-scenario-tester" element={<ErrorScenarioTester />} />

          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default ImprovedSubscriptionApp;