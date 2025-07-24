import { useState, useEffect, useCallback, useRef } from 'react';
import { isValidExchangeRate } from '../lib/utils';

interface ExchangeRateState {
  rate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  retryCount: number;
}

interface UseSafeExchangeRateOptions {
  fallbackRate?: number;
  maxRetries?: number;
  retryDelay?: number;
  updateInterval?: number;
  enableAutoUpdate?: boolean;
}

const DEFAULT_OPTIONS: UseSafeExchangeRateOptions = {
  fallbackRate: 1300,
  maxRetries: 3,
  retryDelay: 5000,
  updateInterval: 60000, // 1분
  enableAutoUpdate: true
};

export const useSafeExchangeRate = (options: UseSafeExchangeRateOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<ExchangeRateState>({
    rate: opts.fallbackRate!,
    isLoading: false,
    error: null,
    lastUpdate: null,
    retryCount: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 안전한 환율 설정
  const setSafeRate = useCallback((newRate: number) => {
    if (isValidExchangeRate(newRate)) {
      setState(prev => ({
        ...prev,
        rate: newRate,
        error: null,
        lastUpdate: new Date(),
        retryCount: 0
      }));
    } else {
      console.warn(`Invalid exchange rate: ${newRate}, using fallback`);
      setState(prev => ({
        ...prev,
        rate: opts.fallbackRate!,
        error: '유효하지 않은 환율 정보입니다',
        lastUpdate: new Date()
      }));
    }
  }, [opts.fallbackRate]);

  // 환율 API 호출
  const fetchExchangeRate = useCallback(async (isRetry = false) => {
    if (state.isLoading) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      // 여러 API 엔드포인트 시도
      const endpoints = [
        'https://api.exchangerate-api.com/v4/latest/USD',
        'https://api.exchangerate.host/latest?base=USD',
        'https://open.er-api.com/v6/latest/USD'
      ];

      let success = false;
      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000) // 10초 타임아웃
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          // 다양한 API 응답 형식 처리
          let rate: number;
          if (data.rates && data.rates.KRW) {
            rate = data.rates.KRW;
          } else if (data.conversion_rates && data.conversion_rates.KRW) {
            rate = data.conversion_rates.KRW;
          } else if (data.rates && data.rates.KRW) {
            rate = data.rates.KRW;
          } else {
            throw new Error('환율 정보를 찾을 수 없습니다');
          }

          setSafeRate(rate);
          success = true;
          break;

        } catch (error) {
          lastError = error as Error;
          console.warn(`Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }

      if (!success) {
        throw lastError || new Error('모든 환율 API에 연결할 수 없습니다');
      }

    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        retryCount: isRetry ? prev.retryCount + 1 : 0
      }));

      // 재시도 로직
      if (isRetry && state.retryCount < opts.maxRetries!) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchExchangeRate(true);
        }, opts.retryDelay);
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.retryCount, setSafeRate, opts.maxRetries, opts.retryDelay]);

  // 수동 재시도
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    fetchExchangeRate(true);
  }, [fetchExchangeRate]);

  // 자동 업데이트 설정
  useEffect(() => {
    if (!opts.enableAutoUpdate) return;

    // 초기 로드
    fetchExchangeRate();

    // 주기적 업데이트
    intervalRef.current = setInterval(() => {
      fetchExchangeRate();
    }, opts.updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchExchangeRate, opts.enableAutoUpdate, opts.updateInterval]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    rate: state.rate,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    retryCount: state.retryCount,
    retry,
    fetchExchangeRate: () => fetchExchangeRate(false)
  };
};