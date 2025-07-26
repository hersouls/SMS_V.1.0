import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Subscription } from '../types/subscription';
import { useErrorHandler } from '../lib/errorHandlingSystem';
import { subscriptionErrorHandlers } from '../lib/supabaseWithErrorHandling';

export const useSubscriptionManager = () => {
  const { supabase, user } = useSupabase();
  const { setError } = useErrorHandler();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1300);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await Promise.all([
        loadUserSubscriptions(),
        initializeExchangeRate()
      ]);
    } catch (error) {
      setError('데이터 로딩 중 오류가 발생했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load user subscriptions
  const loadUserSubscriptions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSubscriptions = data?.map(sub => ({
        id: sub.id,
        databaseId: sub.id.toString(),
        name: sub.name,
        icon: sub.icon || 'tag',
        iconImage: sub.icon_image_url,
        price: parseFloat(sub.price) || 0,
        currency: sub.currency || 'KRW',
        renewDate: sub.renew_date,
        startDate: sub.start_date || sub.created_at,
        paymentDate: sub.payment_date?.toString(),
        paymentCard: sub.payment_card,
        url: sub.url,
        color: sub.color,
        category: sub.category,
        isActive: sub.is_active !== false,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      })) || [];

      setSubscriptions(formattedSubscriptions);
      calculateTotals(formattedSubscriptions);
    } catch (error) {
      setError('구독 목록을 불러오는 중 오류가 발생했습니다.', error);
    }
  }, [user, supabase, setError]);

  // Initialize exchange rate
  const initializeExchangeRate = useCallback(async () => {
    try {
      const rate = await fetchExchangeRate();
      setExchangeRate(rate);
    } catch (error) {
      console.warn('환율 정보를 불러올 수 없습니다. 기본값을 사용합니다.');
      setExchangeRate(1300);
    }
  }, []);

  // Fetch exchange rate
  const fetchExchangeRate = useCallback(async (): Promise<number> => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      
      // 한국은행 ECOS API 사용
      const API_KEY = process.env.REACT_APP_EXCHANGE_RATE_API_KEY || 'your_api_key_here';
      const response = await fetch(
        `https://ecos.bok.or.kr/api/StatisticSearch/${API_KEY}/json/kr/1/100/036Y001/DD/${dateStr}/${dateStr}/0001`
      );

      if (!response.ok) {
        throw new Error('환율 API 응답 오류');
      }

      const data = await response.json();
      
      if (data.StatisticSearch && data.StatisticSearch.row && data.StatisticSearch.row.length > 0) {
        const rate = parseFloat(data.StatisticSearch.row[0].DATA_VALUE);
        return rate || 1300;
      }
      
      return 1300; // 기본값
    } catch (error) {
      console.error('환율 정보 조회 실패:', error);
      return 1300; // 기본값
    }
  }, []);

  // Calculate totals
  const calculateTotals = useCallback((subs: Subscription[]) => {
    const activeSubs = subs.filter(sub => sub.isActive !== false);
    setTotalCount(activeSubs.length);
    
    const total = activeSubs.reduce((sum, sub) => {
      const amount = sub.currency === 'USD' ? sub.price * exchangeRate : sub.price;
      return sum + amount;
    }, 0);
    
    setTotalAmount(total);
  }, [exchangeRate]);

  // Convert to KRW
  const convertToKRW = useCallback((amount: number, currency: string): number => {
    if (currency === 'KRW') return amount;
    if (currency === 'USD') return amount * exchangeRate;
    return amount; // 다른 통화는 그대로 반환
  }, [exchangeRate]);

  // Add subscription
  const handleAddSubscription = useCallback(async (formData: any) => {
    if (!user) return;

    try {
      const subscriptionData = {
        user_id: user.id,
        name: formData.name,
        icon: formData.icon || 'tag',
        icon_image_url: formData.iconImage || formData.icon_image_url,
        price: formData.price.toString(),
        currency: formData.currency,
        renew_date: formData.renew_date,
        start_date: formData.start_date || new Date().toISOString(),
        payment_date: formData.payment_date ? parseInt(formData.payment_date) : null,
        payment_card: formData.payment_card,
        url: formData.url,
        color: formData.color,
        category: formData.category,
        is_active: formData.is_active !== false
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) throw error;

      const newSubscription: Subscription = {
        id: data.id,
        databaseId: data.id.toString(),
        name: data.name,
        icon: data.icon || 'tag',
        iconImage: data.icon_image_url,
        price: parseFloat(data.price) || 0,
        currency: data.currency || 'KRW',
        renewDate: data.renew_date,
        startDate: data.start_date || data.created_at,
        paymentDate: data.payment_date?.toString(),
        paymentCard: data.payment_card,
        url: data.url,
        color: data.color,
        category: data.category,
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setSubscriptions(prev => [newSubscription, ...prev]);
      calculateTotals([newSubscription, ...subscriptions]);
      
      return newSubscription;
    } catch (error) {
      setError('구독 추가 중 오류가 발생했습니다.', error);
      throw error;
    }
  }, [user, supabase, subscriptions, calculateTotals, setError]);

  // Update subscription
  const handleUpdateSubscription = useCallback(async (formData: any) => {
    if (!user || !formData.id) return;

    try {
      const updateData = {
        name: formData.name,
        icon: formData.icon || 'tag',
        icon_image_url: formData.iconImage || formData.icon_image_url,
        price: formData.price.toString(),
        currency: formData.currency,
        renew_date: formData.renew_date,
        start_date: formData.start_date,
        payment_date: formData.payment_date ? parseInt(formData.payment_date) : null,
        payment_card: formData.payment_card,
        url: formData.url,
        color: formData.color,
        category: formData.category,
        is_active: formData.is_active !== false
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', formData.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSubscription: Subscription = {
        id: data.id,
        databaseId: data.id.toString(),
        name: data.name,
        icon: data.icon || 'tag',
        iconImage: data.icon_image_url,
        price: parseFloat(data.price) || 0,
        currency: data.currency || 'KRW',
        renewDate: data.renew_date,
        startDate: data.start_date || data.created_at,
        paymentDate: data.payment_date?.toString(),
        paymentCard: data.payment_card,
        url: data.url,
        color: data.color,
        category: data.category,
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setSubscriptions(prev => 
        prev.map(sub => sub.id === updatedSubscription.id ? updatedSubscription : sub)
      );
      calculateTotals(subscriptions.map(sub => 
        sub.id === updatedSubscription.id ? updatedSubscription : sub
      ));
      
      return updatedSubscription;
    } catch (error) {
      setError('구독 수정 중 오류가 발생했습니다.', error);
      throw error;
    }
  }, [user, supabase, subscriptions, calculateTotals, setError]);

  // Delete subscription
  const handleDeleteSubscription = useCallback(async (id: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      calculateTotals(subscriptions.filter(sub => sub.id !== id));
    } catch (error) {
      setError('구독 삭제 중 오류가 발생했습니다.', error);
      throw error;
    }
  }, [user, supabase, subscriptions, calculateTotals, setError]);

  // Update totals when exchange rate changes
  useEffect(() => {
    calculateTotals(subscriptions);
  }, [exchangeRate, calculateTotals]);

  return {
    subscriptions,
    loading,
    exchangeRate,
    totalAmount,
    totalCount,
    loadUserData,
    loadUserSubscriptions,
    handleAddSubscription,
    handleUpdateSubscription,
    handleDeleteSubscription,
    convertToKRW,
    fetchExchangeRate
  };
};