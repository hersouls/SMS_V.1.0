import { useState, useEffect, useCallback } from 'react';
import { AppError, ErrorMessageGenerator } from './errorHandlingSystem';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  attempts: number;
  totalTime: number;
}

/**
 * 네트워크 요청 재시도 로직
 */
export class NetworkRetryManager {
  private static defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'network',
      'timeout',
      'connection failed',
      'fetch failed',
      'server error',
      '500',
      '502',
      '503',
      '504'
    ]
  };

  /**
   * 지수 백오프를 사용한 지연 시간 계산
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * 에러가 재시도 가능한지 확인
   */
  private static isRetryableError(error: any, config: RetryConfig): boolean {
    const errorMessage = this.extractErrorMessage(error).toLowerCase();
    return config.retryableErrors.some(pattern => 
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  /**
   * 에러 메시지 추출
   */
  private static extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return String(error);
  }

  /**
   * 비동기 함수를 재시도 로직으로 래핑
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: string
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const data = await operation();
        return {
          success: true,
          data,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error;
        
        // 마지막 시도이거나 재시도 불가능한 에러인 경우
        if (attempt === finalConfig.maxAttempts || !this.isRetryableError(error, finalConfig)) {
          const appError = ErrorMessageGenerator.generate(error, context);
          return {
            success: false,
            error: appError,
            attempts: attempt,
            totalTime: Date.now() - startTime
          };
        }

        // 재시도 전 대기
        const delay = this.calculateDelay(attempt, finalConfig);
        console.log(`Retry attempt ${attempt}/${finalConfig.maxAttempts} in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // 이 부분은 실행되지 않아야 하지만 타입 안전성을 위해
    const appError = ErrorMessageGenerator.generate(lastError, context);
    return {
      success: false,
      error: appError,
      attempts: finalConfig.maxAttempts,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * 지연 함수
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 네트워크 상태 모니터링
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
  }

  private updateStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    this.listeners.forEach(listener => listener(isOnline));
    
    if (isOnline) {
      console.log('🌐 네트워크 연결이 복구되었습니다.');
    } else {
      console.log('🌐 네트워크 연결이 끊어졌습니다.');
    }
  }

  /**
   * 네트워크 상태 변경 리스너 등록
   */
  addListener(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 현재 온라인 상태 확인
   */
  isOnlineNow(): boolean {
    return this.isOnline;
  }

  /**
   * 네트워크 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * React 훅: 네트워크 상태 모니터링
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const monitor = NetworkMonitor.getInstance();
    const unsubscribe = monitor.addListener(setIsOnline);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const testConnection = useCallback(async () => {
    setIsConnecting(true);
    try {
      const monitor = NetworkMonitor.getInstance();
      const isConnected = await monitor.testConnection();
      return isConnected;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return {
    isOnline,
    isConnecting,
    testConnection
  };
}

/**
 * 네트워크 오류 복구 훅
 */
export function useNetworkRecovery() {
  const { isOnline, testConnection } = useNetworkStatus();
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  const attemptRecovery = useCallback(async () => {
    setRecoveryAttempts(prev => prev + 1);
    
    // 네트워크 상태 확인
    if (!isOnline) {
      throw new Error('네트워크 연결이 없습니다.');
    }

    // 서버 연결 테스트
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('서버에 연결할 수 없습니다.');
    }

    return true;
  }, [isOnline, testConnection]);

  const resetRecoveryAttempts = useCallback(() => {
    setRecoveryAttempts(0);
  }, []);

  return {
    isOnline,
    recoveryAttempts,
    attemptRecovery,
    resetRecoveryAttempts
  };
}

