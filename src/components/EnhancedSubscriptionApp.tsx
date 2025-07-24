import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useNotifications } from '../hooks/useNotifications';
import { useAsyncOperation } from '../lib/asyncUtils';
import { SubscriptionFormData } from '../types/subscription';
import { validateSubscriptionFormEnhanced, sanitizeSubscriptionDataEnhanced } from '../lib/enhancedValidation';
import { handleError } from '../lib/errorHandler';
import { testSupabaseConnection } from '../lib/supabaseConnection';
import { useInterval } from '../lib/asyncUtils';
import { EnhancedSubscriptionForm } from './EnhancedSubscriptionForm';
import { formDebugger, errorMonitor, performanceMonitor } from '../lib/formDebugger';

export const EnhancedSubscriptionApp: React.FC = () => {
  const { user, supabase } = useSupabase();
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

  // State management
  const [currentScreen, setCurrentScreen] = useState<'main' | 'add' | 'edit' | 'notifications' | 'debug'>('main');
  const [editingSubscription, setEditingSubscription] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Exchange rate management with proper cleanup
  const [exchangeRate, setExchangeRate] = useState<number>(1300);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);

  // Load data on mount
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

  // Debug mode effect
  useEffect(() => {
    if (debugMode) {
      formDebugger.enableDebugMode();
    } else {
      formDebugger.disableDebugMode();
    }
  }, [debugMode]);

  // Exchange rate polling with proper cleanup
  const fetchExchangeRate = useCallback(async () => {
    if (!isMounted()) return;

    try {
      setExchangeRateLoading(true);
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      if (isMounted()) {
        setExchangeRate(data.rates.KRW || 1300);
      }
    } catch (error) {
      const { userMessage } = handleError(error, 'fetchExchangeRate');
      console.error('Failed to fetch exchange rate:', userMessage);
    } finally {
      if (isMounted()) {
        setExchangeRateLoading(false);
      }
    }
  }, [isMounted]);

  // Use interval with proper cleanup
  useInterval(fetchExchangeRate, 60000); // Update every minute

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
      if (results[0].status === 'rejected') {
        throw results[0].reason;
      }

      if (results[1].status === 'rejected') {
        console.warn('Failed to load notifications:', results[1].reason);
      }
    });
  }, [executeAsync, supabase, loadSubscriptions, loadNotifications]);

  // Enhanced add subscription handler
  const handleAddSubscription = useCallback(async (formData: SubscriptionFormData): Promise<boolean> => {
    return await performanceMonitor.measureOperation('addSubscription', async () => {
      try {
        // Enhanced validation
        const validation = validateSubscriptionFormEnhanced(formData, subscriptions.map(s => ({ id: s.databaseId, name: s.name })));
        
        if (!validation.isValid) {
          const errorMessages = Object.values(validation.errors).join(', ');
          throw new Error(`입력 정보를 확인해주세요: ${errorMessages}`);
        }

        // Debug logging
        if (debugMode) {
          formDebugger.watchFormData(formData, 'addSubscription');
        }

        // Sanitize data
        const sanitizedData = sanitizeSubscriptionDataEnhanced(formData);
        
        // Add subscription
        const success = await addSubscription(sanitizedData as SubscriptionFormData);
        
        if (success) {
          addNotification('success', '구독 추가 완료', `${formData.name} 구독이 성공적으로 추가되었습니다.`);
          setCurrentScreen('main');
        }
        
        return success;
      } catch (error) {
        errorMonitor.captureError(error as Error, 'addSubscription', formData);
        const { userMessage } = handleError(error, 'addSubscription');
        addNotification('error', '구독 추가 실패', userMessage);
        return false;
      }
    });
  }, [addSubscription, subscriptions, addNotification, debugMode]);

  // Enhanced update subscription handler
  const handleUpdateSubscription = useCallback(async (id: number, formData: SubscriptionFormData): Promise<boolean> => {
    return await performanceMonitor.measureOperation('updateSubscription', async () => {
      try {
        const subscription = subscriptions.find(sub => sub.id === id);
        if (!subscription?.databaseId) {
          throw new Error('수정할 구독을 찾을 수 없습니다.');
        }

        // Enhanced validation
        const validation = validateSubscriptionFormEnhanced(
          formData, 
          subscriptions.map(s => ({ id: s.databaseId, name: s.name })),
          subscription.databaseId
        );
        
        if (!validation.isValid) {
          const errorMessages = Object.values(validation.errors).join(', ');
          throw new Error(`입력 정보를 확인해주세요: ${errorMessages}`);
        }

        // Debug logging
        if (debugMode) {
          formDebugger.watchFormData(formData, 'updateSubscription');
        }

        // Sanitize data
        const sanitizedData = sanitizeSubscriptionDataEnhanced(formData);
        
        // Update subscription
        const success = await updateSubscription(id, sanitizedData as SubscriptionFormData);
        
        if (success) {
          addNotification('success', '구독 수정 완료', `${formData.name} 구독이 성공적으로 수정되었습니다.`);
          setCurrentScreen('main');
        }
        
        return success;
      } catch (error) {
        errorMonitor.captureError(error as Error, 'updateSubscription', formData);
        const { userMessage } = handleError(error, 'updateSubscription');
        addNotification('error', '구독 수정 실패', userMessage);
        return false;
      }
    });
  }, [updateSubscription, subscriptions, addNotification, debugMode]);

  // Enhanced delete subscription handler
  const handleDeleteSubscription = useCallback(async (id: number) => {
    return await performanceMonitor.measureOperation('deleteSubscription', async () => {
      try {
        const subscription = subscriptions.find(sub => sub.id === id);
        if (!subscription) {
          throw new Error('삭제할 구독을 찾을 수 없습니다.');
        }

        const success = await deleteSubscription(id);
        
        if (success) {
          addNotification('success', '구독 삭제 완료', `${subscription.name} 구독이 성공적으로 삭제되었습니다.`);
        }
        
        return success;
      } catch (error) {
        errorMonitor.captureError(error as Error, 'deleteSubscription');
        const { userMessage } = handleError(error, 'deleteSubscription');
        addNotification('error', '구독 삭제 실패', userMessage);
        return false;
      }
    });
  }, [deleteSubscription, subscriptions, addNotification]);

  // Edit subscription handler
  const handleEditSubscription = useCallback((subscription: any) => {
    setEditingSubscription(subscription.id);
    setCurrentScreen('edit');
  }, []);

  // Memoized calculations
  const totalMonthlyCost = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      if (sub.currency === 'USD') {
        return total + (sub.price * exchangeRate);
      }
      return total + sub.price;
    }, 0);
  }, [subscriptions, exchangeRate]);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => sub.isActive !== false);
  }, [subscriptions]);

  // Error handling
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
            <h1 className="text-3xl font-bold text-gray-900">구독 관리</h1>
            <div className="flex items-center space-x-4">
              {/* Debug Mode Toggle */}
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  debugMode 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {debugMode ? '🔧 디버그 ON' : '🔧 디버그 OFF'}
              </button>
              
              <button
                onClick={() => setCurrentScreen('notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">알림</span>
                <div className="h-6 w-6">
                  {/* Notification icon */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </button>
              
              <button
                onClick={() => setCurrentScreen('add')}
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

        {/* Debug Mode Indicator */}
        {debugMode && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 font-medium">디버그 모드가 활성화되었습니다. 브라우저 콘솔에서 폼 데이터를 모니터링할 수 있습니다.</span>
            </div>
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
                        <dt className="text-sm font-medium text-gray-500 truncate">월 총 비용</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ₩{totalMonthlyCost.toLocaleString()}
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
                          {activeSubscriptions.length}개
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
                        <span className="text-white text-sm font-medium">$</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">환율 (USD/KRW)</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {exchangeRateLoading ? '로딩...' : `₩${exchangeRate.toLocaleString()}`}
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
                            {subscription.currency === 'USD' && ` (₩${(subscription.price * exchangeRate).toLocaleString()})`}
                          </div>
                          <div className="text-xs text-gray-400">
                            갱신일: {subscription.renewDate}
                            {subscription.paymentDate && ` | 결제일: ${subscription.paymentDate}일`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditSubscription(subscription)}
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
                  <li className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">구독이 없습니다</h3>
                      <p className="mt-1 text-sm text-gray-500">새 구독을 추가해보세요.</p>
                      <div className="mt-6">
                        <button
                          onClick={() => setCurrentScreen('add')}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          구독 추가
                        </button>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {(currentScreen === 'add' || currentScreen === 'edit') && (
          <EnhancedSubscriptionForm
            initialData={editingSubscription ? subscriptions.find(s => s.id === editingSubscription) : undefined}
            onSubmit={currentScreen === 'add' ? handleAddSubscription : (data) => handleUpdateSubscription(editingSubscription!, data)}
            onCancel={() => {
              setEditingSubscription(null);
              setCurrentScreen('main');
            }}
            existingSubscriptions={subscriptions.map(s => ({ id: s.databaseId, name: s.name }))}
            isEditing={currentScreen === 'edit'}
            editingId={editingSubscription ? subscriptions.find(s => s.id === editingSubscription)?.databaseId : undefined}
          />
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

        {/* Debug Screen */}
        {currentScreen === 'debug' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                디버그 정보
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">에러 요약</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(errorMonitor.getErrorSummary(), null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">성능 요약</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(performanceMonitor.getPerformanceSummary(), null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">폼 히스토리</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(formDebugger.getFormHistory(), null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => errorMonitor.clearErrors()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  에러 초기화
                </button>
                <button
                  onClick={() => performanceMonitor.clearMetrics()}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                >
                  성능 초기화
                </button>
                <button
                  onClick={() => formDebugger.clearHistory()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  히스토리 초기화
                </button>
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