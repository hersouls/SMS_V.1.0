import { useState, useCallback, useRef } from 'react';
import { Subscription, SubscriptionFormData, SubscriptionOperationState } from '../types/subscription';
import { handleError, isRetryableError, getRetryDelay } from '../lib/errorHandler';
import { useSupabase } from '../contexts/SupabaseContext';

export const useSubscriptions = () => {
  const { user, supabase } = useSupabase();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationState, setOperationState] = useState<SubscriptionOperationState>('idle');
  const [operationProgress, setOperationProgress] = useState<string>('');
  
  // Race condition prevention
  const operationInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    mountedRef.current = false;
  }, []);

  const setOperationStatus = useCallback((state: SubscriptionOperationState, progress?: string) => {
    if (mountedRef.current) {
      setOperationState(state);
      if (progress) setOperationProgress(progress);
    }
  }, []);

  const loadSubscriptions = useCallback(async (retryCount = 0): Promise<void> => {
    if (!user || !supabase) return;

    const maxRetries = 3;
    
    try {
      setLoading(true);
      setError(null);
      setOperationStatus('loading', '구독 정보를 불러오는 중...');

      const { data, error: supabaseError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      if (mountedRef.current) {
        const formattedSubscriptions: Subscription[] = (data || []).map(item => ({
          id: Date.now() + Math.random(), // Local ID for UI
          databaseId: item.id,
          name: item.name,
          icon: item.icon || '📱',
          iconImage: item.icon_image_url,
          price: item.price,
          currency: item.currency as 'KRW' | 'USD' | 'EUR' | 'JPY',
          renewDate: item.renew_date,
          startDate: item.start_date || '',
          paymentDate: item.payment_date?.toString() || '',
          paymentCard: item.payment_card || '',
          url: item.url || '',
          color: item.color || '#3B82F6',
          category: item.category || '',
          isActive: item.is_active !== false,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));

        setSubscriptions(formattedSubscriptions);
        setOperationStatus('idle');
      }
    } catch (error) {
      const { userMessage, shouldRetry } = handleError(error, 'loadSubscriptions');
      
      if (mountedRef.current) {
        setError(userMessage);
        setOperationStatus('idle');
      }

      // Retry logic
      if (shouldRetry && retryCount < maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(retryCount);
        setTimeout(() => loadSubscriptions(retryCount + 1), delay);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, supabase, setOperationStatus]);

  const addSubscription = useCallback(async (formData: SubscriptionFormData): Promise<boolean> => {
    if (!user || !supabase || operationInProgress.current) return false;

    operationInProgress.current = true;
    
    try {
      setOperationStatus('adding', '구독을 추가하는 중...');

      // Validation
      if (!formData.name || !formData.price || !formData.renew_date) {
        throw new Error('필수 정보가 누락되었습니다. 서비스명, 가격, 갱신일을 모두 입력해주세요.');
      }

      if (formData.price <= 0) {
        throw new Error('가격은 0보다 큰 값이어야 합니다.');
      }

      if (formData.payment_date && (formData.payment_date < 1 || formData.payment_date > 31)) {
        throw new Error('결제일은 1일부터 31일 사이여야 합니다.');
      }

      // Check for duplicates
      const existingSubscription = subscriptions.find(sub => 
        sub.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (existingSubscription) {
        throw new Error(`"${formData.name}" 구독이 이미 존재합니다. 다른 이름을 사용해주세요.`);
      }

      const insertData = {
        user_id: user.id,
        name: String(formData.name).trim(),
        icon: String(formData.icon || '📱'),
        icon_image_url: formData.icon_image_url ? String(formData.icon_image_url) : null,
        price: parseFloat(String(formData.price)) || 0,
        currency: String(formData.currency || 'KRW'),
        renew_date: String(formData.renew_date),
        start_date: formData.start_date ? String(formData.start_date) : null,
        payment_date: formData.payment_date ? parseInt(String(formData.payment_date)) : null,
        payment_card: formData.payment_card ? String(formData.payment_card).trim() : null,
        url: formData.url ? String(formData.url).trim() : null,
        color: String(formData.color || '#3B82F6'),
        category: formData.category ? String(formData.category).trim() : null,
        is_active: Boolean(formData.is_active !== false)
      };

      const { data, error: supabaseError } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      if (mountedRef.current) {
        const newSubscription: Subscription = {
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

        setSubscriptions(prev => [newSubscription, ...prev]);
        setOperationStatus('idle');
        return true;
      }
    } catch (error) {
      const { userMessage } = handleError(error, 'addSubscription');
      if (mountedRef.current) {
        setError(userMessage);
        setOperationStatus('idle');
      }
      return false;
    } finally {
      operationInProgress.current = false;
    }
    
    return false;
  }, [user, supabase, subscriptions, setOperationStatus]);

  const updateSubscription = useCallback(async (id: number, formData: SubscriptionFormData): Promise<boolean> => {
    if (!user || !supabase || operationInProgress.current) return false;

    operationInProgress.current = true;
    
    try {
      setOperationStatus('updating', '구독을 수정하는 중...');

      const subscription = subscriptions.find(sub => sub.id === id);
      if (!subscription?.databaseId) {
        throw new Error('수정할 구독을 찾을 수 없습니다.');
      }

      const updateData = {
        name: String(formData.name).trim(),
        icon: String(formData.icon || '📱'),
        icon_image_url: formData.icon_image_url ? String(formData.icon_image_url) : null,
        price: parseFloat(String(formData.price)) || 0,
        currency: String(formData.currency || 'KRW'),
        renew_date: String(formData.renew_date),
        start_date: formData.start_date ? String(formData.start_date) : null,
        payment_date: formData.payment_date ? parseInt(String(formData.payment_date)) : null,
        payment_card: formData.payment_card ? String(formData.payment_card).trim() : null,
        url: formData.url ? String(formData.url).trim() : null,
        color: String(formData.color || '#3B82F6'),
        category: formData.category ? String(formData.category).trim() : null,
        is_active: Boolean(formData.is_active !== false)
      };

      const { data, error: supabaseError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.databaseId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      if (mountedRef.current) {
        const updatedSubscription: Subscription = {
          ...subscription,
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
          prev.map(sub => sub.id === id ? updatedSubscription : sub)
        );
        setOperationStatus('idle');
        return true;
      }
    } catch (error) {
      const { userMessage } = handleError(error, 'updateSubscription');
      if (mountedRef.current) {
        setError(userMessage);
        setOperationStatus('idle');
      }
      return false;
    } finally {
      operationInProgress.current = false;
    }
    
    return false;
  }, [user, supabase, subscriptions, setOperationStatus]);

  const deleteSubscription = useCallback(async (id: number): Promise<boolean> => {
    if (!user || !supabase || operationInProgress.current) return false;

    operationInProgress.current = true;
    
    try {
      setOperationStatus('deleting', '구독을 삭제하는 중...');

      const subscription = subscriptions.find(sub => sub.id === id);
      if (!subscription?.databaseId) {
        throw new Error('삭제할 구독을 찾을 수 없습니다.');
      }

      const { error: supabaseError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscription.databaseId);

      if (supabaseError) throw supabaseError;

      if (mountedRef.current) {
        setSubscriptions(prev => prev.filter(sub => sub.id !== id));
        setOperationStatus('idle');
        return true;
      }
    } catch (error) {
      const { userMessage } = handleError(error, 'deleteSubscription');
      if (mountedRef.current) {
        setError(userMessage);
        setOperationStatus('idle');
      }
      return false;
    } finally {
      operationInProgress.current = false;
    }
    
    return false;
  }, [user, supabase, subscriptions, setOperationStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    subscriptions,
    loading,
    error,
    operationState,
    operationProgress,
    loadSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    clearError,
    cleanup
  };
};