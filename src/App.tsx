import React, { useState, useEffect } from 'react';
// ... (아이콘 및 컴포넌트 import 생략)

const SubscriptionApp = () => {
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase } = useSupabase();

  // 1. 하드코딩된 초기값 없이 "빈 배열/빈 값"으로 선언
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [alarmHistory, setAlarmHistory] = useState<AlarmHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<Profile>({
    username: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ... (그 외 상태들 동일하게)

  // 2. 사용자 인증 변화 감지: 로그인/로그아웃/프로필 변경
  useEffect(() => {
    if (user && !authLoading) {
      setIsLoggedIn(true);
      loadUserData();
      // 프로필 동기화는 기존 코드대로
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

  // 3. 모든 사용자 데이터 불러오는 메인 함수
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

  // 4. Supabase에서 구독 데이터 불러오기
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

  // 5. Supabase에서 알림 데이터 불러오기
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

  // 6. Supabase에서 알람 히스토리 불러오기
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
      const localAlarmHistory: AlarmHistory[] = data.map(alarm => ({
        id: alarm.id,
        type: alarm.type,
        content: alarm.content,
        target: alarm.target,
        date: new Date(alarm.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        datetime: alarm.created_at,
        icon: /* ... 타입 매칭 로직 생략 ... */,
        iconBackground: /* ... 타입 매칭 로직 생략 ... */,
        subscriptionId: parseInt(alarm.subscription_id || '0') || undefined,
        subscriptionImage: alarm.subscription_image_url || undefined
      }));
      setAlarmHistory(localAlarmHistory);
    } catch (error) {
      console.error('Unexpected error loading alarm history:', error);
    }
  };

  // 7. 알림 추가 함수 (Supabase + 로컬)
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

  // 8. 알람 히스토리 추가 함수 (Supabase + 로컬)
  const addAlarmHistory = async (type: AlarmHistory['type'], content: string, target: string, subscriptionId?: number) => {
    if (!user) return;
    const now = new Date();
    const newAlarm: AlarmHistory = {
      id: Date.now().toString(),
      type,
      content,
      target,
      date: now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      datetime: now.toISOString(),
      icon: /* ... 타입 매칭 로직 ... */,
      iconBackground: /* ... 타입 매칭 로직 ... */,
      subscriptionId,
      subscriptionImage: /* ... */
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
          subscription_id: subscriptionId || null,
          subscription_image_url: /* ... */
        });
      if (error) {
        console.error('Error saving alarm history:', error);
      }
    } catch (error) {
      console.error('Unexpected error saving alarm history:', error);
    }
  };

  // ... (이하 나머지 UI/이벤트 핸들러, 렌더링 분기, 기존 코드와 동일하게 진행)
};

export default SubscriptionApp;
