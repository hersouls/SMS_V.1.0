import { useMemo } from 'react';
import { 
  safeCalculateTotal, 
  safeConvertToKRW, 
  isValidNumber 
} from '../lib/utils';

interface Subscription {
  id: number;
  name: string;
  price: number;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
  isActive?: boolean;
}

interface StatisticsResult {
  totalAmount: number;
  totalAmountFormatted: string;
  averageAmount: number;
  averageAmountFormatted: string;
  subscriptionCount: number;
  activeSubscriptionCount: number;
  currencyBreakdown: {
    KRW: { count: number; total: number };
    USD: { count: number; total: number };
    EUR: { count: number; total: number };
    JPY: { count: number; total: number };
  };
  hasErrors: boolean;
  errorCount: number;
  errorDetails: Array<{
    subscriptionId: number;
    subscriptionName: string;
    error: string;
  }>;
}

export const useSafeStatistics = (
  subscriptions: Subscription[],
  exchangeRate: number,
  fallbackRate: number = 1300
): StatisticsResult => {
  return useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.isActive !== false);
    
    // 기본 통계
    const subscriptionCount = subscriptions.length;
    const activeSubscriptionCount = activeSubscriptions.length;

    // 통화별 분류
    const currencyBreakdown = {
      KRW: { count: 0, total: 0 },
      USD: { count: 0, total: 0 },
      EUR: { count: 0, total: 0 },
      JPY: { count: 0, total: 0 }
    };

    // 오류 추적
    const errorDetails: Array<{
      subscriptionId: number;
      subscriptionName: string;
      error: string;
    }> = [];

    // 각 구독별 안전한 계산
    activeSubscriptions.forEach(sub => {
      // 가격 검증
      if (!isValidNumber(sub.price)) {
        errorDetails.push({
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          error: '유효하지 않은 가격 정보'
        });
        return;
      }

      // 통화별 분류
      const currency = sub.currency.toUpperCase() as keyof typeof currencyBreakdown;
      if (currencyBreakdown[currency]) {
        currencyBreakdown[currency].count++;
        currencyBreakdown[currency].total += sub.price;
      }

      // 변환 오류 검사
      try {
        const converted = safeConvertToKRW(sub.price, sub.currency, exchangeRate, fallbackRate);
        if (!isValidNumber(converted) || converted === 0) {
          errorDetails.push({
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            error: '통화 변환 실패'
          });
        }
      } catch (error) {
        errorDetails.push({
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          error: '변환 계산 오류'
        });
      }
    });

    // 총액 계산
    const { total, isValid, errorCount } = safeCalculateTotal(
      activeSubscriptions.map(sub => ({ price: sub.price, currency: sub.currency })),
      exchangeRate,
      fallbackRate
    );

    // 평균 계산
    const averageAmount = activeSubscriptionCount > 0 ? total / activeSubscriptionCount : 0;

    // 포맷팅 함수
    const formatAmount = (amount: number): string => {
      if (!isValidNumber(amount)) return '계산 오류';
      if (amount === 0) return '₩0';
      
      try {
        return new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      } catch {
        return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
      }
    };

    return {
      totalAmount: total,
      totalAmountFormatted: formatAmount(total),
      averageAmount,
      averageAmountFormatted: formatAmount(averageAmount),
      subscriptionCount,
      activeSubscriptionCount,
      currencyBreakdown,
      hasErrors: !isValid || errorDetails.length > 0,
      errorCount: errorCount + errorDetails.length,
      errorDetails
    };
  }, [subscriptions, exchangeRate, fallbackRate]);
};