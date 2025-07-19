import React, { useState, useEffect } from 'react';
import { Search, Check, Calendar, DollarSign, Tag, Bell, User, Home, Menu, Plus, Edit2, Trash2, Upload, Image, Settings, ChevronLeft, ChevronRight, CreditCard, Globe, Banknote, CalendarRange } from 'lucide-react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XMarkIcon, CheckIcon, HandThumbUpIcon, UserIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useSupabase } from './contexts/SupabaseContext';
import { LoginScreen } from './components/LoginScreen';
import { SupabaseTest } from './components/SupabaseTest';

interface Subscription {
  id: number;
  databaseId?: string; // Supabase 데이터베이스의 실제 UUID
  name: string;
  icon: string;
  iconImage?: string; // 이미지 URL 추가
  price: number;
  currency: string; // 통화 추가
  renewDate: string;
  startDate: string; // 구독 시작일 추가
  paymentDate: string; // 결재일 추가
  paymentCard: string; // 결제카드 추가
  url: string; // URL 추가
  color: string;
  category: string;
}



interface CustomService {
  name: string;
  price: string;
  currency: string; // 통화 추가
  renewalDate: string;
  startDate: string; // 구독 시작일 추가
  paymentDate: string; // 결재일 추가
  paymentCard: string; // 결제카드 추가
  url: string; // URL 추가
  category: string;
  notifications: boolean;
  iconImage?: string; // 이미지 URL 추가
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

interface AlarmHistory {
  id: string;
  type: 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'renewal_reminder' | 'payment_due';
  content: string;
  target: string;
  date: string;
  datetime: string;
  icon: any;
  iconBackground: string;
  subscriptionId?: number;
  subscriptionImage?: string;
}

interface Profile {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  coverPhoto?: string;
}

const SubscriptionApp = () => {
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase } = useSupabase();
  const [currentScreen, setCurrentScreen] = useState<'main' | 'add' | 'manage' | 'detail' | 'notifications' | 'alarm-history' | 'profile' | 'supabase-test'>('main');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    username: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exchangeRate, setExchangeRate] = useState<number>(1300); // 기본 환율 (1 USD = 1300 KRW)
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  
  // 앱 시작 시 환율 정보 가져오기
  useEffect(() => {
    fetchExchangeRate();
    
    // 1시간마다 환율 정보 업데이트
    const interval = setInterval(fetchExchangeRate, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 인증 상태 변경 감지 및 데이터 로딩
  useEffect(() => {
    if (user && !authLoading) {
      setIsLoggedIn(true);
      loadUserSubscriptions();
    } else if (!user && !authLoading) {
      setIsLoggedIn(false);
      setSubscriptions([]); // 로그아웃 시 구독 데이터 초기화
    }
  }, [user, authLoading]);

  // 사용자의 구독 데이터를 Supabase에서 불러오는 함수
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
        addNotification('error', '데이터 로딩 실패', '구독 정보를 불러오는데 실패했습니다.');
        return;
      }

      // Supabase 데이터를 로컬 Subscription 형태로 변환
      const localSubscriptions: Subscription[] = data.map((sub, index) => ({
        id: Date.now() + index, // 로컬 ID 생성
        databaseId: sub.id, // Supabase 데이터베이스 ID
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
      console.log(`Loaded ${localSubscriptions.length} subscriptions from database`);

    } catch (error) {
      console.error('Unexpected error loading subscriptions:', error);
      addNotification('error', '데이터 로딩 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };
  
  const [alarmHistory, setAlarmHistory] = useState<AlarmHistory[]>([
    {
      id: '1',
      type: 'subscription_added',
      content: '구독이 추가되었습니다',
      target: '넷플릭스',
      date: '7월 18',
      datetime: '2024-07-18',
      icon: CheckIcon,
      iconBackground: 'bg-green-500',
      subscriptionId: 1
    }
  ]);
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

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: 1,
      name: '넷플릭스',
      icon: '🎬',
      price: 19.99,
      currency: 'USD',
      renewDate: '2024-06-15',
      startDate: '2024-01-15',
      paymentDate: '15',
      paymentCard: '신한카드',
      url: 'https://www.netflix.com',
      color: '#E50914',
      category: '엔터테인먼트'
    },
    {
      id: 2,
      name: 'GPT',
      icon: '🤖',
      price: 20.00,
      currency: 'USD',
      renewDate: '2024-06-10',
      startDate: '2024-02-10',
      paymentDate: '10',
      paymentCard: 'KB국민카드',
      url: 'https://chat.openai.com',
      color: '#10A37F',
      category: '생산성'
    },
    {
      id: 3,
      name: '디즈니+',
      icon: '✨',
      price: 10.99,
      currency: 'USD',
      renewDate: '2024-06-10',
      startDate: '2024-03-10',
      paymentDate: '10',
      paymentCard: '삼성카드',
      url: 'https://www.disneyplus.com',
      color: '#113CCF',
      category: '엔터테인먼트'
    },
    {
      id: 4,
      name: '스포티파이',
      icon: '🎵',
      price: 9.99,
      currency: 'USD',
      renewDate: '2024-06-01',
      startDate: '2024-04-01',
      paymentDate: '1',
      paymentCard: '현대카드',
      url: 'https://www.spotify.com',
      color: '#1DB954',
      category: '음악'
    }
  ]);



  const categories = ['엔터테인먼트', '음악', '생산성', '쇼핑', '개발', 'AI서비스'];

  // 환율 변환 함수
  const convertToKRW = (amount: number, currency: string): number => {
    if (currency === 'KRW') return amount;
    if (currency === 'USD') return amount * exchangeRate;
    return amount;
  };

  // 환율 정보 가져오기 (한국은행 ECOS API)
  const fetchExchangeRate = async () => {
    setExchangeRateLoading(true);
    try {
      // 한국은행 ECOS API - 원/달러 환율 (036Y001: 원/달러 환율)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      // 실제 API 키가 필요하지만, 여기서는 기본값 사용
      // const API_KEY = 'your_api_key_here';
      // const response = await fetch(`https://ecos.bok.or.kr/api/StatisticSearch/${API_KEY}/json/kr/1/100/036Y001/DD/${dateStr}/${dateStr}/0001`);
      
      // 임시로 고정 환율 사용 (실제로는 API 호출)
      const mockExchangeRate = 1300 + Math.random() * 50; // 1300-1350 사이 랜덤값
      setExchangeRate(mockExchangeRate);
      
      // 실제 API 호출 시 사용할 코드:
      // const data = await response.json();
      // if (data.StatisticSearch && data.StatisticSearch.row && data.StatisticSearch.row.length > 0) {
      //   const rate = parseFloat(data.StatisticSearch.row[0].DATA_VALUE);
      //   setExchangeRate(rate);
      // }
    } catch (error) {
      console.error('환율 정보를 가져오는데 실패했습니다:', error);
      // 에러 시 기본값 유지
    } finally {
      setExchangeRateLoading(false);
    }
  };

  // 원화로 통합된 총액 계산
  const totalAmountInKRW = subscriptions.reduce((sum, sub) => {
    return sum + convertToKRW(sub.price, sub.currency);
  }, 0);

  // 소셜 미디어 네비게이션
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

  const handleCustomInput = (field: keyof CustomService, value: string | boolean) => {
    setCustomService(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSubscription = async () => {
    if (!customService.name || !customService.price || !user) return;
    
    try {
      // Supabase 데이터베이스에 저장할 구독 데이터
      const subscriptionData = {
        user_id: user.id,
        name: customService.name,
        icon: '📱',
        icon_image_url: customService.iconImage,
        price: parseFloat(customService.price),
        currency: customService.currency as 'USD' | 'KRW' | 'EUR' | 'JPY',
        renew_date: customService.renewalDate,
        start_date: customService.startDate || new Date().toISOString().split('T')[0],
        payment_date: customService.paymentDate ? parseInt(customService.paymentDate) : new Date(customService.renewalDate).getDate(),
        payment_card: customService.paymentCard,
        url: customService.url,
        color: '#6C63FF',
        category: customService.category,
        is_active: true
      };

      // Supabase에 데이터 저장
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        addNotification('error', '구독 추가 실패', `데이터베이스 오류: ${error.message}`);
        return;
      }

      // 로컬 상태에도 추가 (UI 업데이트용)
      const newSubscription: Subscription = {
        id: Date.now(), // 로컬 ID (UI용)
        databaseId: data.id, // Supabase 데이터베이스 ID
        name: customService.name,
        icon: '📱',
        iconImage: customService.iconImage,
        price: parseFloat(customService.price),
        currency: customService.currency,
        renewDate: customService.renewalDate,
        startDate: customService.startDate || new Date().toISOString().split('T')[0],
        paymentDate: customService.paymentDate || new Date(customService.renewalDate).getDate().toString(),
        paymentCard: customService.paymentCard,
        url: customService.url,
        color: '#6C63FF',
        category: customService.category
      };

      setSubscriptions(prev => [...prev, newSubscription]);
      addNotification('success', '구독 추가 완료', `${customService.name} 구독이 성공적으로 추가되었습니다.`);
      addAlarmHistory('subscription_added', '구독이 추가되었습니다', customService.name, newSubscription.id);
      setCurrentScreen('main');
      resetForm();

    } catch (error) {
      console.error('Unexpected error:', error);
      addNotification('error', '구독 추가 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setCustomService({
      name: subscription.name,
      price: subscription.price.toString(),
      currency: subscription.currency,
      renewalDate: subscription.renewDate,
      startDate: subscription.startDate,
      paymentDate: subscription.paymentDate,
      paymentCard: subscription.paymentCard,
      url: subscription.url,
      category: subscription.category,
      notifications: true,
      iconImage: subscription.iconImage || ''
    });
    setCurrentScreen('add');
  };

  const handleUpdateSubscription = async () => {
    if (!customService.name || !customService.price || !editingSubscription || !user) return;

    try {
      // Supabase 데이터베이스에서 업데이트
      if (editingSubscription.databaseId) {
        const updateData = {
          name: customService.name,
          price: parseFloat(customService.price),
          currency: customService.currency as 'USD' | 'KRW' | 'EUR' | 'JPY',
          renew_date: customService.renewalDate,
          start_date: customService.startDate,
          payment_date: customService.paymentDate ? parseInt(customService.paymentDate) : null,
          payment_card: customService.paymentCard,
          url: customService.url,
          category: customService.category,
          icon_image_url: customService.iconImage,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('id', editingSubscription.databaseId);

        if (error) {
          console.error('Database update error:', error);
          addNotification('error', '구독 수정 실패', `데이터베이스 오류: ${error.message}`);
          return;
        }
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
      
      addNotification('success', '구독 수정 완료', `${customService.name} 구독이 성공적으로 수정되었습니다.`);
      addAlarmHistory('subscription_updated', '구독이 수정되었습니다', customService.name, editingSubscription.id);
      setCurrentScreen('main');
      setEditingSubscription(null);
      resetForm();

    } catch (error) {
      console.error('Unexpected update error:', error);
      addNotification('error', '구독 수정 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (!subscription || !window.confirm(`"${subscription.name}" 구독을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // Supabase에서 삭제 (is_active를 false로 설정하여 소프트 삭제)
      if (subscription.databaseId) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.databaseId);

        if (error) {
          console.error('Database delete error:', error);
          addNotification('error', '구독 삭제 실패', `데이터베이스 오류: ${error.message}`);
          return;
        }
      }

      // 로컬 상태에서 제거
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      addNotification('info', '구독 삭제 완료', `${subscription.name} 구독이 삭제되었습니다.`);
      addAlarmHistory('subscription_deleted', '구독이 삭제되었습니다', subscription.name, id);

    } catch (error) {
      console.error('Unexpected delete error:', error);
      addNotification('error', '구독 삭제 실패', '예상치 못한 오류가 발생했습니다.');
    }
  };

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
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 형식 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // 이미지 크기 최적화
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 최적 크기로 리사이즈 (128px)
          const maxSize = 128;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedImage = canvas.toDataURL('image/jpeg', 0.8);
            
            setCustomService(prev => ({
              ...prev,
              iconImage: optimizedImage
            }));
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCustomService(prev => ({
      ...prev,
      iconImage: ''
    }));
  };

  // 알림 관련 함수들
  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
    setShowNotification(true);
    
    // 5초 후 자동으로 알림 숨기기
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
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

  // 알람 히스토리 관련 함수들
  const addAlarmHistory = (type: AlarmHistory['type'], content: string, target: string, subscriptionId?: number) => {
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
      const paymentDay = parseInt(subscription.paymentDate);
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

  const handleProfileSave = () => {
    addNotification('success', '프로필 저장 완료', '프로필이 성공적으로 저장되었습니다.');
    setCurrentScreen('main');
  };

  const handleProfileCancel = () => {
    setCurrentScreen('main');
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Supabase 테스트 화면
  if (currentScreen === 'supabase-test') {
    return <SupabaseTest />;
  }

  // 공통 헤더 컴포넌트
  const CommonHeader = () => (
        <div className="relative px-4 pt-8 pb-8">
          <div className="flex justify-between items-center mb-6">
        {/* 왼쪽: 홈 버튼 */}
        <div className="flex items-center">
          <button 
            onClick={() => {
              console.log('홈 버튼 클릭됨 - CommonHeader');
              setCurrentScreen('main');
              setSelectedSubscription(null);
              setEditingSubscription(null);
              resetForm();
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer z-20"
            style={{ pointerEvents: 'auto', position: 'relative' }}
          >
            <Home className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* 오른쪽: 알람 + 아바타 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentScreen('alarm-history')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 relative cursor-pointer z-10"
            style={{ pointerEvents: 'auto' }}
          >
            <Bell className="w-5 h-5 text-white" />
            {alarmHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{alarmHistory.length}</span>
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              console.log('아바타 버튼 클릭됨 - CommonHeader');
              setCurrentScreen('profile');
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 cursor-pointer z-10 overflow-hidden"
            style={{ pointerEvents: 'auto', position: 'relative' }}
          >
            {profile.photo ? (
              <img 
                src={profile.photo} 
                alt="프로필 사진"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </button>
            </div>
          </div>

          {/* 웨이브 효과 */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 375 60" className="w-full h-15">
              <path
                d="M0,20 C100,0 200,40 375,25 L375,60 L0,60 Z"
                fill="white"
                fillOpacity="0.1"
              />
              <path
                d="M0,35 C150,15 250,50 375,30 L375,60 L0,60 Z"
                fill="white"
                fillOpacity="0.15"
              />
            </svg>
          </div>
        </div>
  );

  // 메인 구독 관리 화면
  if (currentScreen === 'main') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <CommonHeader />

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-8 pb-24 min-h-[70vh] -mt-4 relative z-10">
          {/* 총액 및 구독 수 카드 */}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-8">
            <div className="flex justify-between items-center">
              <div className="text-left">
                <p className="text-gray-600 text-lg font-medium mb-1">총 구독 수:</p>
                <p className="text-3xl font-bold text-gray-900">
                  {subscriptions.length}개
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-lg font-medium mb-1">총액 (원화):</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    ₩{Math.round(totalAmountInKRW).toLocaleString()} <span className="text-lg font-normal text-gray-500">/ 월</span>
                  </p>
                  {exchangeRateLoading && (
                    <p className="text-xs text-gray-500">환율 정보 업데이트 중...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 구독 서비스 리스트 */}
          <div className="space-y-4 mb-8">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => {
                  handleEditSubscription(subscription);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
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
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        매월 결제일: {subscription.paymentDate}일
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-900">
                    ₩{Math.round(convertToKRW(subscription.price, subscription.currency)).toLocaleString()}
                  </span>
                  </div>
                </div>
              </div>
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
                        <button
                          key={event.id}
            onClick={() => {
                            handleEditSubscription(event.subscription);
                          }}
                          className="w-full flex items-center gap-1 p-1 rounded text-xs hover:opacity-80 transition-opacity duration-200"
                          style={{ backgroundColor: `${event.color}20` }}
                        >
                          <button
                                                    onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (event.subscription.url) {
                            window.open(event.subscription.url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                            className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] text-white overflow-hidden hover:opacity-80 transition-opacity duration-200"
                            style={{ backgroundColor: event.color }}
                            disabled={!event.subscription.url}
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
          </button>
                          <span className="truncate font-medium text-left" style={{ color: event.color }}>
                            {event.name}
                            {/* event.isPaymentDay && <span className="text-[10px] ml-1">(결제)</span> */}
                            {/* event.isRenewalDay && <span className="text-[10px] ml-1">(갱신)</span> */}
                          </span>
                        </button>
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
        {/* Supabase 테스트 버튼 */}
        <button
          onClick={() => setCurrentScreen('supabase-test')}
          className="rounded-full bg-green-600 p-3 text-white shadow-lg hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          title="Supabase 테스트"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </button>
        
        {/* 구독 추가 버튼 */}
        <button
          onClick={() => {
            setCurrentScreen('add');
            resetForm();
          }}
          className="rounded-full bg-indigo-600 p-3 text-white shadow-lg hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      </>
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
                      <p className="text-sm text-gray-500 mb-1">{subscription.category}</p>
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
                <p className="text-gray-500">{selectedSubscription.category}</p>
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
                  {selectedSubscription.category}
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
              <ul role="list" className="-mb-8">
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
          <h1 className="text-white text-2xl font-bold tracking-tight"></h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleProfileSave(); }}>
            <div className="space-y-8">
              {/* 프로필 섹션 */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2"></h2>
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
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  저장
                </button>
              </div>
            </div>
          </form>
            </div>
      </div>
    );
  }

  // 구독 추가/수정 화면
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
          {editingSubscription ? '구독 수정' : '구독 추가'}
        </h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
        {/* 구독 정보 입력 폼 */}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">구독 정보</h3>
            
            <div className="space-y-4">
            {/* 아이콘 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                서비스 아이콘
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-sm overflow-hidden bg-gray-200">
                  {customService.iconImage ? (
                    <img 
                      src={customService.iconImage} 
                      alt="서비스 아이콘"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '📱'
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="icon-upload"
                  />
                  <label
                    htmlFor="icon-upload"
                    className="block w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl border-2 border-dashed border-blue-300 text-center cursor-pointer transition-colors duration-200"
                  >
                    <Upload className="w-4 h-4 inline mr-1" />
                    이미지 업로드
                  </label>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    권장: 128×128px
                  </p>
                </div>

                {customService.iconImage && (
                  <button
                    onClick={removeImage}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    제거
                  </button>
                )}
              </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  서비스 이름
                </label>
                <input
                  type="text"
                  value={customService.name}
                  onChange={(e) => handleCustomInput('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="서비스 이름을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Banknote className="w-4 h-4 inline mr-1" />
                  월 구독료
                </label>
                <div className="flex gap-3">
                  <select
                    value={customService.currency}
                    onChange={(e) => handleCustomInput('currency', e.target.value)}
                    className="w-1/3 px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                  >
                    <option value="USD">달러</option>
                    <option value="KRW">원화</option>
                  </select>
                <input
                  type="number"
                  step="0.01"
                  value={customService.price}
                  onChange={(e) => handleCustomInput('price', e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 text-right"
                  placeholder="0.00"
                />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarRange className="w-4 h-4 inline mr-1" />
                구독 갱신일
                </label>
                <input
                  type="date"
                  value={customService.renewalDate}
                  onChange={(e) => handleCustomInput('renewalDate', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                />
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                구독 시작일
              </label>
              <input
                type="date"
                value={customService.startDate}
                onChange={(e) => handleCustomInput('startDate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                매월 결제일
              </label>
              <select
                value={customService.paymentDate}
                onChange={(e) => handleCustomInput('paymentDate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              >
                <option value="">매월 결제일을 선택하세요</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day.toString()}>
                    {day}일
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                결제 방법
              </label>
              <input
                type="text"
                value={customService.paymentCard}
                onChange={(e) => handleCustomInput('paymentCard', e.target.value)}
                placeholder="결제 방법을 입력하세요 (예: 신한카드, KB국민카드)"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                서비스 URL
              </label>
              <input
                type="url"
                value={customService.url}
                onChange={(e) => handleCustomInput('url', e.target.value)}
                placeholder="서비스 웹사이트 URL을 입력하세요 (예: https://www.netflix.com)"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                카테고리
              </label>
              <select
                value={customService.category}
                onChange={(e) => handleCustomInput('category', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.filter(cat => cat !== '전체').map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">갱신 알림</span>
                </div>
                <button
                  onClick={() => handleCustomInput('notifications', !customService.notifications)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    customService.notifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      customService.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

        {/* 액션 버튼 */}
        {editingSubscription ? (
          <div className="flex gap-3">
        <button
              onClick={handleUpdateSubscription}
          disabled={!customService.name || !customService.price}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
              수정
        </button>
            <button
              onClick={() => handleDeleteSubscription(editingSubscription.id)}
              className="flex-1 rounded-md bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-xs hover:bg-indigo-100"
            >
              삭제
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddSubscription}
            disabled={!customService.name || !customService.price}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            구독 추가하기
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionApp;