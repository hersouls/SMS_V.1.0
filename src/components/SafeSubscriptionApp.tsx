import React, { useState } from 'react';
import StatsCard from './ui/stats-card';
import SubscriptionCard from './ui/subscription-card';
import ExchangeRateInfo from './ui/exchange-rate-info';
import { useSafeExchangeRate } from '../hooks/useSafeExchangeRate';
import { useSafeStatistics } from '../hooks/useSafeStatistics';
import { CreditCard, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface Subscription {
  id: number;
  name: string;
  icon: string;
  iconImage?: string;
  price: number;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
  paymentDate?: string;
  url?: string;
  color?: string;
  category?: string;
  isActive?: boolean;
}

const SafeSubscriptionApp: React.FC = () => {
  // 샘플 데이터 (실제로는 API에서 가져옴)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: 1,
      name: 'Netflix',
      icon: 'N',
      price: 15.99,
      currency: 'USD',
      paymentDate: '15',
      color: '#E50914',
      category: '엔터테인먼트',
      isActive: true
    },
    {
      id: 2,
      name: 'Spotify',
      icon: 'S',
      price: 12.99,
      currency: 'EUR',
      paymentDate: '20',
      color: '#1DB954',
      category: '음악',
      isActive: true
    },
    {
      id: 3,
      name: 'YouTube Premium',
      icon: 'Y',
      price: 1180,
      currency: 'JPY',
      paymentDate: '1',
      color: '#FF0000',
      category: '엔터테인먼트',
      isActive: true
    },
    {
      id: 4,
      name: 'Naver Cloud',
      icon: 'N',
      price: 50000,
      currency: 'KRW',
      paymentDate: '25',
      color: '#03C75A',
      category: '클라우드',
      isActive: true
    }
  ]);

  // 안전한 환율 관리
  const {
    rate: exchangeRate,
    isLoading: exchangeRateLoading,
    error: exchangeRateError,
    lastUpdate,
    retry: retryExchangeRate
  } = useSafeExchangeRate({
    fallbackRate: 1300,
    maxRetries: 3,
    retryDelay: 5000,
    updateInterval: 60000,
    enableAutoUpdate: true
  });

  // 안전한 통계 계산
  const statistics = useSafeStatistics(subscriptions, exchangeRate, 1300);

  // 구독 편집 핸들러
  const handleEditSubscription = (subscription: Subscription) => {
    console.log('Edit subscription:', subscription);
    // 실제로는 편집 모달을 열거나 편집 페이지로 이동
  };

  // 구독 삭제 핸들러
  const handleDeleteSubscription = (id: number) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            안전한 구독 관리
          </h1>
          <p className="text-gray-600">
            오류 없는 통화 변환과 안정적인 통계 계산
          </p>
        </div>

        {/* 환율 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ExchangeRateInfo
              exchangeRate={exchangeRate}
              isLoading={exchangeRateLoading}
              lastUpdate={lastUpdate}
              onRetry={retryExchangeRate}
            />
          </div>

          {/* 통계 카드들 */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="총 구독 수"
              value={`${statistics.subscriptionCount}개`}
              subtitle={`활성: ${statistics.activeSubscriptionCount}개`}
              icon={<Users className="w-5 h-5" />}
              variant="info"
              error={statistics.hasErrors}
              errorMessage={`${statistics.errorCount}개 오류 발생`}
            />

            <StatsCard
              title="월 총액"
              value={statistics.totalAmountFormatted}
              subtitle={exchangeRateLoading ? "환율 정보 업데이트 중..." : "원화 기준"}
              icon={<CreditCard className="w-5 h-5" />}
              variant="gradient"
              isLoading={exchangeRateLoading}
              error={statistics.hasErrors}
              errorMessage="일부 구독 계산 실패"
            />

            <StatsCard
              title="평균 비용"
              value={statistics.averageAmountFormatted}
              subtitle="구독당 평균"
              icon={<TrendingUp className="w-5 h-5" />}
              variant="success"
              error={statistics.hasErrors}
              errorMessage="계산 오류"
            />
          </div>
        </div>

        {/* 오류 요약 */}
        {statistics.hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-medium text-red-900">계산 오류 발생</h3>
            </div>
            <p className="text-sm text-red-700 mb-3">
              {statistics.errorCount}개의 구독에서 계산 오류가 발생했습니다.
            </p>
            <div className="space-y-1">
              {statistics.errorDetails.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs text-red-600">
                  • {error.subscriptionName}: {error.error}
                </div>
              ))}
              {statistics.errorDetails.length > 3 && (
                <div className="text-xs text-red-600">
                  • 외 {statistics.errorDetails.length - 3}개 오류...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 통화별 분류 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statistics.currencyBreakdown).map(([currency, data]) => (
            <div key={currency} className="bg-white rounded-lg p-4 border">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{currency}</div>
                <div className="text-sm text-gray-600">{data.count}개 구독</div>
                <div className="text-xs text-gray-500">
                  {data.total > 0 ? `${data.total.toLocaleString()} ${currency}` : '없음'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 구독 카드들 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">내 구독 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map(subscription => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onEdit={handleEditSubscription}
                onDelete={handleDeleteSubscription}
                exchangeRate={exchangeRate}
                showConvertedPrice={true}
              />
            ))}
          </div>
        </div>

        {/* 디버그 정보 (개발 모드에서만 표시) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">디버그 정보</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>환율: {exchangeRate} (로딩: {exchangeRateLoading ? '예' : '아니오'})</div>
              <div>오류: {exchangeRateError || '없음'}</div>
              <div>통계 오류: {statistics.errorCount}개</div>
              <div>마지막 업데이트: {lastUpdate?.toLocaleString() || '없음'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeSubscriptionApp;