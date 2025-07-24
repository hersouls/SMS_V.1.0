import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useNotifications } from '../hooks/useNotifications';
import { useAsyncOperation } from '../lib/asyncUtils';
import { handleError } from '../lib/errorHandler';
import { testSupabaseConnection } from '../lib/supabaseConnection';
import { validateSubscriptionForm, sanitizeSubscriptionData } from '../lib/validation';
import { SubscriptionFormData } from '../types/subscription';

// Example of how to integrate the improvements into existing App.tsx
export const AppIntegration: React.FC = () => {
  const { user, supabase } = useSupabase();
  
  // Use new hooks instead of manual state management
  const {
    subscriptions,
    loading: subscriptionsLoading,
    error: subscriptionsError,
    operationState,
    operationProgress,
    loadSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    clearError: clearSubscriptionsError,
    cleanup: cleanupSubscriptions
  } = useSubscriptions();

  const {
    notifications,
    showNotification,
    addNotification,
    removeNotification,
    clearAllNotifications,
    loadNotifications,
    hideNotification
  } = useNotifications();

  const { executeAsync, isMounted } = useAsyncOperation();

  // Keep existing state for gradual migration
  const [currentScreen, setCurrentScreen] = useState<'main' | 'add' | 'edit' | 'notifications'>('main');
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<SubscriptionFormData>>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Load data on mount with improved error handling
  useEffect(() => {
    if (user && supabase) {
      loadUserData();
    }
  }, [user, supabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  const loadUserData = useCallback(async () => {
    await executeAsync(async () => {
      // Test connection first
      const connectionResult = await testSupabaseConnection(supabase!);
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || 'Failed to connect to database');
      }

      // Load data in parallel
      const results = await Promise.allSettled([
        loadSubscriptions(),
        loadNotifications()
      ]);

      // Handle results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const operation = index === 0 ? 'subscriptions' : 'notifications';
          console.error(`Failed to load ${operation}:`, result.reason);
        }
      });
    }, {
      onError: (error) => {
        const { userMessage } = handleError(error, 'loadUserData');
        addNotification('error', '데이터 로딩 실패', userMessage);
      }
    });
  }, [executeAsync, supabase, loadSubscriptions, loadNotifications, addNotification]);

  // Improved add subscription function
  const handleAddSubscriptionWithForm = useCallback(async (formData: any) => {
    // Validate form data
    const validation = validateSubscriptionForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);

    // Sanitize data
    const sanitizedData = sanitizeSubscriptionData(formData);

    const success = await addSubscription(sanitizedData as SubscriptionFormData);
    
    if (success) {
      await addNotification('success', '구독 추가 완료', `${sanitizedData.name} 구독이 성공적으로 추가되었습니다.`);
      setCurrentScreen('main');
      setFormData({});
    } else {
      await addNotification('error', '구독 추가 실패', '구독 추가 중 오류가 발생했습니다.');
    }
  }, [addSubscription, addNotification]);

  // Improved update subscription function
  const handleUpdateSubscriptionWithForm = useCallback(async (formData: any) => {
    if (!editingSubscription) return;

    // Validate form data
    const validation = validateSubscriptionForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);

    // Sanitize data
    const sanitizedData = sanitizeSubscriptionData(formData);

    const success = await updateSubscription(editingSubscription.id, sanitizedData as SubscriptionFormData);
    
    if (success) {
      await addNotification('success', '구독 수정 완료', `${sanitizedData.name} 구독이 성공적으로 수정되었습니다.`);
      setCurrentScreen('main');
      setEditingSubscription(null);
      setFormData({});
    } else {
      await addNotification('error', '구독 수정 실패', '구독 수정 중 오류가 발생했습니다.');
    }
  }, [editingSubscription, updateSubscription, addNotification]);

  // Improved delete subscription function
  const handleDeleteSubscription = useCallback(async (id: number) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (!subscription) return;

    const confirmed = window.confirm(`"${subscription.name}" 구독을 삭제하시겠습니까?`);
    if (!confirmed) return;

    const success = await deleteSubscription(id);
    
    if (success) {
      await addNotification('success', '구독 삭제 완료', `${subscription.name} 구독이 성공적으로 삭제되었습니다.`);
    } else {
      await addNotification('error', '구독 삭제 실패', '구독 삭제 중 오류가 발생했습니다.');
    }
  }, [subscriptions, deleteSubscription, addNotification]);

  // Error handling for subscription errors
  useEffect(() => {
    if (subscriptionsError) {
      addNotification('error', '구독 로딩 실패', subscriptionsError);
      clearSubscriptionsError();
    }
  }, [subscriptionsError, addNotification, clearSubscriptionsError]);

  // Loading states
  const isLoading = subscriptionsLoading || operationState !== 'idle';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">구독 관리 (개선된 버전)</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentScreen('notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">알림</span>
                <div className="h-6 w-6">
                  🔔
                </div>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </button>
              <button
                onClick={() => {
                  setFormData({});
                  setFormErrors([]);
                  setCurrentScreen('add');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                구독 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-800">{operationProgress || '로딩 중...'}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {formErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <ul className="list-disc list-inside text-red-800">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Screen Content */}
        {currentScreen === 'main' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">₩</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">총 구독</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {subscriptions.length}개
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">✓</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">활성 구독</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {subscriptions.filter(sub => sub.isActive !== false).length}개
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">📊</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">알림</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {notifications.length}개
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscriptions List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <li key={subscription.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg"
                            style={{ backgroundColor: subscription.color }}
                          >
                            {subscription.icon}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.currency} {subscription.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingSubscription(subscription);
                            setFormData({
                              name: subscription.name,
                              icon: subscription.icon,
                              icon_image_url: subscription.iconImage,
                              price: subscription.price,
                              currency: subscription.currency,
                              renew_date: subscription.renewDate,
                              start_date: subscription.startDate,
                              payment_date: subscription.paymentDate ? parseInt(subscription.paymentDate) : undefined,
                              payment_card: subscription.paymentCard,
                              url: subscription.url,
                              color: subscription.color,
                              category: subscription.category,
                              is_active: subscription.isActive
                            });
                            setCurrentScreen('edit');
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          disabled={isLoading}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                          disabled={isLoading}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                
                {subscriptions.length === 0 && (
                  <li className="px-6 py-4 text-center text-gray-500">
                    구독이 없습니다. 새로운 구독을 추가해보세요.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {(currentScreen === 'add' || currentScreen === 'edit') && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {currentScreen === 'add' ? '새 구독 추가' : '구독 수정'}
              </h3>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    서비스명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    가격 *
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    통화
                  </label>
                  <select
                    value={formData.currency || 'KRW'}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as any }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="KRW">KRW</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    갱신일 *
                  </label>
                  <input
                    type="date"
                    value={formData.renew_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, renew_date: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentScreen === 'add') {
                        handleAddSubscriptionWithForm(formData);
                      } else {
                        handleUpdateSubscriptionWithForm(formData);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {currentScreen === 'add' ? '추가' : '수정'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({});
                      setFormErrors([]);
                      setEditingSubscription(null);
                      setCurrentScreen('main');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    disabled={isLoading}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notifications Screen */}
        {currentScreen === 'notifications' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  알림
                </h3>
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-900"
                >
                  모두 지우기
                </button>
              </div>
              
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-md border ${
                      notification.type === 'error' ? 'bg-red-50 border-red-200' :
                      notification.type === 'success' ? 'bg-green-50 border-green-200' :
                      notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                
                {notifications.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    알림이 없습니다.
                  </p>
                )}
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => setCurrentScreen('main')}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  돌아가기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg">
          <div className="flex items-center">
            <span>알림이 추가되었습니다</span>
            <button
              onClick={hideNotification}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};