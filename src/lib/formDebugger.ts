import { SubscriptionFormData } from '../types/subscription';
import { validateSubscriptionFormEnhanced, sanitizeSubscriptionDataEnhanced } from './enhancedValidation';

// 폼 데이터 실시간 모니터링
export const createFormDebugger = () => {
  let debugMode = false;
  let formDataHistory: Array<{ timestamp: Date; data: any; errors: any }> = [];

  const watchFormData = (formData: any, context?: string) => {
    if (!debugMode) return;

    console.group(`📝 폼 데이터 검증 ${context ? `(${context})` : ''}`);
    console.log('원본 데이터:', formData);
    
    try {
      const sanitizedData = sanitizeSubscriptionDataEnhanced(formData);
      console.log('정제된 데이터:', sanitizedData);
      
      const validation = validateSubscriptionFormEnhanced(sanitizedData);
      console.log('검증 결과:', validation.isValid ? '✅ 성공' : '❌ 실패');
      
      if (!validation.isValid) {
        console.error('오류:', validation.errors);
      }
      
      if (Object.keys(validation.warnings).length > 0) {
        console.warn('경고:', validation.warnings);
      }

      // 히스토리에 저장
      formDataHistory.push({
        timestamp: new Date(),
        data: formData,
        errors: validation.errors
      });

      // 최근 10개만 유지
      if (formDataHistory.length > 10) {
        formDataHistory = formDataHistory.slice(-10);
      }
    } catch (error) {
      console.error('❌ 검증 중 예외 발생:', error);
    }
    
    console.groupEnd();
  };

  const testDatabaseInsert = async (formData: any, supabase: any) => {
    if (!debugMode) return;

    console.group('💾 DB 삽입 테스트');
    try {
      const sanitizedData = sanitizeSubscriptionDataEnhanced(formData);
      console.log('삽입할 데이터:', sanitizedData);
      
      // 실제 삽입 없이 구조만 검증
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(sanitizedData)
        .select()
        .limit(0); // 실제 삽입하지 않음
        
      console.log('검증 결과:', error ? '❌ 실패' : '✅ 성공');
      if (error) {
        console.error('오류:', error);
        console.error('오류 코드:', error.code);
        console.error('오류 메시지:', error.message);
        console.error('오류 상세:', error.details);
      }
    } catch (error) {
      console.error('❌ 예외 발생:', error);
    }
    console.groupEnd();
  };

  const simulateErrors = {
    invalidDate: (baseData: any) => ({ ...baseData, renew_date: '2025-13-45' }),
    invalidPrice: (baseData: any) => ({ ...baseData, price: 'abc' }),
    missingRequired: (baseData: any) => ({ ...baseData, name: '' }),
    duplicateName: (baseData: any, existingName: string) => ({ ...baseData, name: existingName }),
    outOfRangePaymentDate: (baseData: any) => ({ ...baseData, payment_date: 32 }),
    invalidUrl: (baseData: any) => ({ ...baseData, url: 'not-a-url' })
  };

  const getFormHistory = () => formDataHistory;

  const clearHistory = () => {
    formDataHistory = [];
  };

  const enableDebugMode = () => {
    debugMode = true;
    console.log('🔧 폼 디버거가 활성화되었습니다');
  };

  const disableDebugMode = () => {
    debugMode = false;
    console.log('🔧 폼 디버거가 비활성화되었습니다');
  };

  return {
    watchFormData,
    testDatabaseInsert,
    simulateErrors,
    getFormHistory,
    clearHistory,
    enableDebugMode,
    disableDebugMode,
    isDebugMode: () => debugMode
  };
};

// 글로벌 디버거 인스턴스
export const formDebugger = createFormDebugger();

// 브라우저 콘솔에서 사용할 수 있도록 전역에 노출
if (typeof window !== 'undefined') {
  (window as any).subscriptionFormDebug = formDebugger;
}

// ErrorBoundary 확장으로 폼 에러 캐치
export const createFormErrorBoundary = (onError?: (error: Error, errorInfo: any) => void) => {
  return {
    onError: (error: Error, errorInfo: any) => {
      console.group('📝 폼 에러 발생');
      console.error('에러:', error);
      console.error('컴포넌트 스택:', errorInfo.componentStack);
      console.error('현재 시간:', new Date().toISOString());
      console.groupEnd();
      
      if (onError) {
        onError(error, errorInfo);
      }
    }
  };
};

// 실시간 에러 모니터링
export const createErrorMonitor = () => {
  const errors: Array<{
    timestamp: Date;
    error: Error;
    context: string;
    formData?: any;
  }> = [];

  const captureError = (error: Error, context: string, formData?: any) => {
    const errorRecord = {
      timestamp: new Date(),
      error,
      context,
      formData
    };

    errors.push(errorRecord);
    console.error(`🚨 폼 에러 캡처 (${context}):`, errorRecord);

    // 최근 20개만 유지
    if (errors.length > 20) {
      errors.splice(0, errors.length - 20);
    }
  };

  const getErrors = () => errors;

  const clearErrors = () => {
    errors.length = 0;
  };

  const getErrorSummary = () => {
    const summary = errors.reduce((acc, error) => {
      const context = error.context;
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errors.length,
      errorsByContext: summary,
      recentErrors: errors.slice(-5)
    };
  };

  return {
    captureError,
    getErrors,
    clearErrors,
    getErrorSummary
  };
};

// 글로벌 에러 모니터 인스턴스
export const errorMonitor = createErrorMonitor();

// 폼 성능 모니터링
export const createPerformanceMonitor = () => {
  const metrics: Array<{
    timestamp: Date;
    operation: string;
    duration: number;
    success: boolean;
  }> = [];

  const measureOperation = async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } finally {
      const duration = performance.now() - startTime;
      metrics.push({
        timestamp: new Date(),
        operation,
        duration,
        success
      });

      // 최근 50개만 유지
      if (metrics.length > 50) {
        metrics.splice(0, metrics.length - 50);
      }

      if (duration > 1000) {
        console.warn(`⚠️ 느린 작업 감지: ${operation} (${duration.toFixed(2)}ms)`);
      }
    }
  };

  const getPerformanceSummary = () => {
    const summary = metrics.reduce((acc, metric) => {
      const operation = metric.operation;
      if (!acc[operation]) {
        acc[operation] = {
          count: 0,
          totalDuration: 0,
          successCount: 0,
          avgDuration: 0
        };
      }

      acc[operation].count++;
      acc[operation].totalDuration += metric.duration;
      if (metric.success) acc[operation].successCount++;
      acc[operation].avgDuration = acc[operation].totalDuration / acc[operation].count;

      return acc;
    }, {} as Record<string, {
      count: number;
      totalDuration: number;
      successCount: number;
      avgDuration: number;
    }>);

    return {
      totalOperations: metrics.length,
      operationsByType: summary,
      recentMetrics: metrics.slice(-10)
    };
  };

  const clearMetrics = () => {
    metrics.length = 0;
  };

  return {
    measureOperation,
    getPerformanceSummary,
    clearMetrics
  };
};

// 글로벌 성능 모니터 인스턴스
export const performanceMonitor = createPerformanceMonitor();

// 디버깅 유틸리티 함수들
export const debugUtils = {
  // 폼 데이터를 안전하게 문자열로 변환
  safeStringify: (obj: any, space = 2) => {
    try {
      return JSON.stringify(obj, null, space);
    } catch (error) {
      return `[객체를 문자열로 변환할 수 없습니다: ${error}]`;
    }
  },

  // 폼 데이터를 콘솔에 예쁘게 출력
  prettyPrint: (data: any, label = '폼 데이터') => {
    console.group(`📋 ${label}`);
    console.log('타입:', typeof data);
    console.log('값:', data);
    if (typeof data === 'object' && data !== null) {
      console.log('키들:', Object.keys(data));
      console.log('JSON:', debugUtils.safeStringify(data));
    }
    console.groupEnd();
  },

  // 폼 데이터 비교
  compareFormData: (before: any, after: any) => {
    console.group('🔄 폼 데이터 비교');
    console.log('이전:', before);
    console.log('이후:', after);
    
    const changes: Record<string, { before: any; after: any }> = {};
    
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    
    allKeys.forEach(key => {
      if (before?.[key] !== after?.[key]) {
        changes[key] = {
          before: before?.[key],
          after: after?.[key]
        };
      }
    });
    
    if (Object.keys(changes).length > 0) {
      console.log('변경된 필드들:', changes);
    } else {
      console.log('변경사항 없음');
    }
    
    console.groupEnd();
  },

  // 폼 검증 결과를 시각적으로 표시
  visualizeValidation: (validation: any) => {
    console.group('✅ 폼 검증 결과');
    
    if (validation.isValid) {
      console.log('🎉 모든 검증 통과!');
    } else {
      console.log('❌ 검증 실패:');
      Object.entries(validation.errors).forEach(([field, error]) => {
        console.error(`  ${field}: ${error}`);
      });
    }
    
    if (validation.warnings && Object.keys(validation.warnings).length > 0) {
      console.warn('⚠️ 경고:');
      Object.entries(validation.warnings).forEach(([field, warning]) => {
        console.warn(`  ${field}: ${warning}`);
      });
    }
    
    console.groupEnd();
  }
};

// 긴급 상황별 빠른 해결책
export const emergencyUtils = {
  // 최소한의 데이터로 테스트
  createMinimalTestData: (userId: string) => ({
    user_id: userId,
    name: "테스트 구독",
    price: 1000,
    currency: "KRW",
    renew_date: "2025-12-31",
    icon: "📱",
    color: "#3B82F6",
    is_active: true
  }),

  // 문제가 되는 필드들 안전하게 처리
  sanitizeForEmergency: (formData: any) => {
    const cleanData = { ...formData };
    
    // 결제일이 빈 문자열이거나 NaN인 경우 제거
    if (cleanData.payment_date === '' || isNaN(cleanData.payment_date)) {
      delete cleanData.payment_date;
    }
    
    // URL에 프로토콜이 없는 경우 추가
    if (cleanData.url && !cleanData.url.startsWith('http')) {
      cleanData.url = `https://${cleanData.url}`;
    }
    
    // 가격 정제
    if (cleanData.price) {
      const cleanPrice = String(cleanData.price).replace(/[^0-9.]/g, '');
      cleanData.price = parseFloat(cleanPrice) || 0;
    }
    
    return cleanData;
  },

  // 원시 SQL로 직접 삽입 테스트
  testDirectInsert: async (formData: any, supabase: any) => {
    console.group('🚨 긴급 DB 삽입 테스트');
    try {
      const { data, error } = await supabase.rpc('insert_subscription_direct', {
        p_user_id: formData.user_id,
        p_name: formData.name,
        p_price: formData.price,
        p_currency: formData.currency,
        p_renew_date: formData.renew_date
      });
      
      console.log('직접 삽입 결과:', { data, error });
    } catch (error) {
      console.error('직접 삽입 실패:', error);
    }
    console.groupEnd();
  }
};

// 브라우저 콘솔에서 사용할 수 있도록 전역에 노출
if (typeof window !== 'undefined') {
  (window as any).formDebugUtils = {
    ...debugUtils,
    ...emergencyUtils,
    formDebugger,
    errorMonitor,
    performanceMonitor
  };
}