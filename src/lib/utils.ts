import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const ERROR_MESSAGES = {
  SUBSCRIPTION_LOAD_FAILED: '구독 정보를 불러오지 못했습니다.',
  NOTIFICATION_SAVE_FAILED: '알림 저장에 실패했습니다.',
  PROFILE_CREATION_FAILED: '프로필 생성에 실패했습니다.',
  EXCHANGE_RATE_FAILED: '환율 정보를 가져오는데 실패했습니다.',
  GENERIC_ERROR: '예상치 못한 오류가 발생했습니다.'
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 안전한 숫자 검증 함수
export function isValidNumber(value: any): boolean {
  if (typeof value !== 'number') return false;
  return !isNaN(value) && isFinite(value) && value >= 0;
}

// 안전한 환율 검증 함수
export function isValidExchangeRate(rate: number): boolean {
  if (!isValidNumber(rate)) return false;
  // USD/KRW 환율의 현실적 범위 (500 ~ 2000)
  return rate >= 500 && rate <= 2000;
}

// 안전한 통화 변환 함수
export function safeConvertToKRW(
  amount: number, 
  currency: string, 
  exchangeRate: number,
  fallbackRate: number = 1300
): number {
  // 입력값 검증
  if (!isValidNumber(amount)) {
    console.warn(`Invalid amount: ${amount} for currency: ${currency}`);
    return 0;
  }

  // 환율 검증
  const validRate = isValidExchangeRate(exchangeRate) ? exchangeRate : fallbackRate;
  
  try {
    switch (currency.toUpperCase()) {
      case 'KRW':
        return amount;
      case 'USD':
        return amount * validRate;
      case 'EUR':
        // EUR/KRW 환율 (약 1.1 USD/KRW)
        return amount * validRate * 1.1;
      case 'JPY':
        // JPY/KRW 환율 (약 0.009 USD/JPY)
        return amount * validRate * 0.009;
      default:
        console.warn(`Unsupported currency: ${currency}, using USD rate`);
        return amount * validRate;
    }
  } catch (error) {
    console.error('Currency conversion error:', error);
    return 0;
  }
}

// 안전한 통화 포맷팅 함수
export function safeFormatCurrency(
  amount: number, 
  currency: string = 'KRW',
  fallbackText: string = '계산 중...'
): string {
  try {
    // 숫자 검증
    if (!isValidNumber(amount)) {
      return fallbackText;
    }

    // 특수값 처리
    if (amount === 0) return '₩0';
    if (!isFinite(amount)) return fallbackText;

    // 브라우저별 호환성을 위한 안전한 포맷팅
    const formatter = new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    // 폴백 포맷팅
    try {
      return `${currency === 'KRW' ? '₩' : currency}${Math.round(amount).toLocaleString('ko-KR')}`;
    } catch {
      return fallbackText;
    }
  }
}

// 안전한 총액 계산 함수
export function safeCalculateTotal(
  subscriptions: Array<{ price: number; currency: string }>,
  exchangeRate: number,
  fallbackRate: number = 1300
): { total: number; isValid: boolean; errorCount: number } {
  let total = 0;
  let errorCount = 0;
  let isValid = true;

  for (const sub of subscriptions) {
    const converted = safeConvertToKRW(sub.price, sub.currency, exchangeRate, fallbackRate);
    if (converted === 0 && sub.price > 0) {
      errorCount++;
      isValid = false;
    }
    total += converted;
  }

  // 최종 검증
  if (!isValidNumber(total)) {
    total = 0;
    isValid = false;
  }

  return { total, isValid, errorCount };
}

// 환율 상태 검증 함수
export function validateExchangeRateState(
  rate: number,
  isLoading: boolean,
  lastUpdate: Date | null
): {
  isValid: boolean;
  status: 'valid' | 'loading' | 'error' | 'stale';
  message: string;
} {
  if (isLoading) {
    return {
      isValid: false,
      status: 'loading',
      message: '환율 정보를 업데이트 중입니다...'
    };
  }

  if (!isValidExchangeRate(rate)) {
    return {
      isValid: false,
      status: 'error',
      message: '환율 정보가 유효하지 않습니다'
    };
  }

  if (lastUpdate) {
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (diffMinutes > 30) {
      return {
        isValid: true,
        status: 'stale',
        message: '환율 정보가 오래되었습니다'
      };
    }
  }

  return {
    isValid: true,
    status: 'valid',
    message: '실시간 환율 정보'
  };
}

export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return safeFormatCurrency(amount, currency);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}