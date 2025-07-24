import React, { useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAppState } from '../hooks/useAppState';
import { useSafeAsync } from '../hooks/useSafeAsync';
import { useModal } from '../hooks/useModal';
import { ErrorBoundary } from './ErrorBoundary';
import { SafeSubscriptionCard } from './SafeSubscriptionCard';
import { createStateDebugger, setGlobalStateDebugger } from '../utils/stateDebugger';
import { LoginScreen } from './LoginScreen';
import { GoogleAuthDebug } from './GoogleAuthDebug';
import { AuthCallback } from './components/AuthCallback';
import { SupabaseDebugger } from './components/SupabaseDebugger';
import { EmergencyTroubleshooter } from './components/EmergencyTroubleshooter';
import Header from './components/ui/header';
import StatsCard from './components/ui/stats-card';
import SubscriptionForm from './components/ui/subscription-form';
import DebugPanel from './components/DebugPanel';
import { Button } from './components/ui/button';

const ImprovedApp: React.FC = () => {
  const { user, profile: supabaseProfile, loading: authLoading, signOut, supabase } = useSupabase();
  const { state, actions } = useAppState();
  const { execute, cancel } = useSafeAsync();
  const modal = useModal();

  // 디버거 초기화
  useEffect(() => {
    const debugger = createStateDebugger(() => state);
    setGlobalStateDebugger(debugger);
    
    // 개발 환경에서만 자동으로 상태 모니터링 시작
    if (process.env.NODE_ENV === 'development') {
      debugger.startWatching();
    }
    
    return () => {
      cancel(); // 진행 중인 비동기 작업 취소
    };
  }, [state, cancel]);

  // 사용자 인증 상태 동기화
  useEffect(() => {
    if (user && !authLoading) {
      actions.setLoading('auth', false);
      loadUserData();
      
      // 프로필 동기화
      if (supabaseProfile) {
        actions.updateProfile({
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
        actions.updateProfile({
          username: user.user_metadata.preferred_username || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          photo: user.user_metadata.avatar_url || user.user_metadata.picture || '',
          coverPhoto: ''
        });
      }
    } else if (!user && !authLoading) {
      // 로그아웃 시 상태 초기화
      actions.resetState();
    }
  }, [user, authLoading, supabaseProfile, actions]);

  // 사용자 데이터 로드
  const loadUserData = async () => {
    if (!user || !supabase) return;

    try {
      actions.setLoading('subscriptions', true);
      actions.setError('subscriptions', null);

      await execute(
        async () => {
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
            const formattedSubscriptions = (data || []).map(item => ({
              id: Date.now() + Math.random(),
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

            actions.setSubscriptions(formattedSubscriptions);
          },
          onError: (error) => {
            actions.setError('subscriptions', error.message);
          },
          onFinally: () => {
            actions.setLoading('subscriptions', false);
          }
        }
      );
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      actions.setError('subscriptions', '데이터를 불러올 수 없습니다');
      actions.setLoading('subscriptions', false);
    }
  };

  // 구독 추가 핸들러
  const handleAddSubscription = async (formData: any) => {
    if (!user || !supabase) return;

    try {
      actions.setLoading('subscriptions', true);
      actions.setError('subscriptions', null);

      await execute(
        async () => {
          // 중복 검사
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', formData.name)
            .single();

          if (existing) {
            throw new Error(`"${formData.name}" 구독이 이미 존재합니다`);
          }

          // 구독 추가
          const { data, error } = await supabase
            .from('subscriptions')
            .insert({
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
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        {
          onSuccess: (data) => {
            const newSubscription = {
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
              category: data.category || '',
              isActive: data.is_active !== false
            };

            actions.addSubscription(newSubscription);
            
            // 성공 알림
            actions.addNotification({
              id: Date.now().toString(),
              type: 'success',
              title: '구독 추가 완료',
              message: `${data.name} 구독이 성공적으로 추가되었습니다.`,
              timestamp: new Date()
            });

            // 메인 화면으로 이동
            modal.closeModal();
          },
          onError: (error) => {
            actions.setError('subscriptions', error.message);
            
            // 오류 알림
            actions.addNotification({
              id: Date.now().toString(),
              type: 'error',
              title: '구독 추가 실패',
              message: error.message,
              timestamp: new Date()
            });
          },
          onFinally: () => {
            actions.setLoading('subscriptions', false);
          }
        }
      );
    } catch (error) {
      console.error('구독 추가 오류:', error);
    }
  };

  // 구독 편집 핸들러
  const handleEditSubscription = (subscription: any) => {
    actions.setEditingSubscription(subscription);
    modal.openModal('edit', subscription);
  };

  // 구독 삭제 핸들러
  const handleDeleteSubscription = async (id: number) => {
    if (!user || !supabase) return;

    const subscription = state.subscriptions.find(sub => sub.id === id);
    if (!subscription) return;

    try {
      await execute(
        async () => {
          const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('id', subscription.databaseId);

          if (error) throw error;
          return true;
        },
        {
          onSuccess: () => {
            actions.deleteSubscription(id);
            
            // 성공 알림
            actions.addNotification({
              id: Date.now().toString(),
              type: 'success',
              title: '구독 삭제 완료',
              message: `${subscription.name} 구독이 삭제되었습니다.`,
              timestamp: new Date()
            });
          },
          onError: (error) => {
            actions.addNotification({
              id: Date.now().toString(),
              type: 'error',
              title: '구독 삭제 실패',
              message: error.message,
              timestamp: new Date()
            });
          }
        }
      );
    } catch (error) {
      console.error('구독 삭제 오류:', error);
    }
  };

  // 통계 계산
  const stats = useMemo(() => {
    const totalSubscriptions = state.subscriptions.length;
    const activeSubscriptions = state.subscriptions.filter(sub => sub.isActive !== false).length;
    const totalPrice = state.subscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0);
    const expiredSubscriptions = state.subscriptions.filter(sub => {
      if (!sub.renewDate) return false;
      const renewDate = new Date(sub.renewDate);
      return renewDate < new Date();
    }).length;

    return {
      total: totalSubscriptions,
      active: activeSubscriptions,
      totalPrice,
      expired: expiredSubscriptions
    };
  }, [state.subscriptions]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await signOut();
      actions.resetState();
      modal.resetModal();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/debug/google" element={<GoogleAuthDebug />} />
          <Route path="/debug/supabase" element={<SupabaseDebugger />} />
          <Route path="/troubleshoot" element={<EmergencyTroubleshooter />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header
            user={user}
            profile={state.profile}
            onLogout={handleLogout}
            onProfileClick={() => modal.openModal('profile')}
            onNotificationClick={() => modal.openModal('notifications')}
          />

          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="총 구독"
                value={stats.total}
                icon="📱"
                color="blue"
              />
              <StatsCard
                title="활성 구독"
                value={stats.active}
                icon="✅"
                color="green"
              />
              <StatsCard
                title="총 비용"
                value={`₩${stats.totalPrice.toLocaleString()}`}
                icon="💰"
                color="yellow"
              />
              <StatsCard
                title="만료된 구독"
                value={stats.expired}
                icon="⚠️"
                color="red"
              />
            </div>

            {/* 메인 콘텐츠 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">내 구독</h2>
                  <Button
                    onClick={() => modal.openModal('add')}
                    disabled={state.loading.subscriptions}
                  >
                    구독 추가
                  </Button>
                </div>

                {/* 구독 목록 */}
                {state.loading.subscriptions ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : state.subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📱</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      구독이 없습니다
                    </h3>
                    <p className="text-gray-500 mb-4">
                      첫 번째 구독을 추가해보세요
                    </p>
                    <Button onClick={() => modal.openModal('add')}>
                      구독 추가하기
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.subscriptions.map(subscription => (
                      <SafeSubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onEdit={handleEditSubscription}
                        onDelete={handleDeleteSubscription}
                        isSelected={state.selectedSubscription?.id === subscription.id}
                        isEditing={state.isUpdatingSubscription}
                      />
                    ))}
                  </div>
                )}

                {/* 오류 표시 */}
                {state.errors.subscriptions && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          오류가 발생했습니다
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{state.errors.subscriptions}</p>
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={loadUserData}
                            className="bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            다시 시도
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* 모달 */}
          {modal.isModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  {modal.currentScreen === 'add' && (
                    <SubscriptionForm
                      onSubmit={handleAddSubscription}
                      onCancel={modal.closeModal}
                      loading={state.loading.subscriptions}
                    />
                  )}
                  
                  {modal.currentScreen === 'edit' && state.editingSubscription && (
                    <SubscriptionForm
                      subscription={state.editingSubscription}
                      onSubmit={handleAddSubscription}
                      onCancel={modal.closeModal}
                      loading={state.loading.subscriptions}
                    />
                  )}
                  
                  {modal.currentScreen === 'notifications' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">알림</h3>
                      {state.notifications.length === 0 ? (
                        <p className="text-gray-500">알림이 없습니다</p>
                      ) : (
                        <div className="space-y-2">
                          {state.notifications.map(notification => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-md ${
                                notification.type === 'success' ? 'bg-green-50 text-green-800' :
                                notification.type === 'error' ? 'bg-red-50 text-red-800' :
                                notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                                'bg-blue-50 text-blue-800'
                              }`}
                            >
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-sm">{notification.message}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex justify-end">
                        <Button onClick={modal.closeModal}>닫기</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 디버그 패널 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <DebugPanel />
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default ImprovedApp;