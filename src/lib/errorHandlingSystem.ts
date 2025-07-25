import { useState, useCallback } from 'react';

export interface AppError {
  id: string;
  type: 'validation' | 'network' | 'auth' | 'database' | 'permission' | 'unknown';
  title: string;
  message: string;
  details?: any;
  recoverable: boolean;
  retryable: boolean;
  timestamp: Date;
  context?: string;
}

export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

/**
 * 중앙화된 에러 분류 및 처리
 */
export class ErrorClassifier {
  private static patterns = {
    validation: [
      /가격은.*0.*보다.*큰/i,
      /결제일은.*1.*31.*사이/i,
      /필수.*정보.*누락/i,
      /올바른.*입력/i,
      /유효하지.*않/i
    ],
    network: [
      /network/i,
      /fetch.*failed/i,
      /connection.*failed/i,
      /timeout/i,
      /offline/i
    ],
    auth: [
      /unauthorized/i,
      /401/,
      /invalid.*token/i,
      /session.*expired/i,
      /로그인.*필요/i
    ],
    database: [
      /duplicate.*key/i,
      /foreign.*key/i,
      /check.*constraint/i,
      /not-null.*constraint/i,
      /column.*does.*not.*exist/i,
      /PGRST/
    ],
    permission: [
      /forbidden/i,
      /403/,
      /권한.*없/i,
      /접근.*거부/i
    ]
  };

  static classify(error: any): AppError['type'] {
    const message = this.extractMessage(error);
    
    for (const [type, patterns] of Object.entries(this.patterns)) {
      if (patterns.some(pattern => pattern.test(message))) {
        return type as AppError['type'];
      }
    }
    
    return 'unknown';
  }

  private static extractMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return String(error);
  }
}

/**
 * 사용자 친화적 에러 메시지 생성기
 */
export class ErrorMessageGenerator {
  private static messages = {
    validation: {
      title: '입력 오류',
      defaultMessage: '입력하신 정보를 다시 확인해주세요.'
    },
    network: {
      title: '연결 오류',
      defaultMessage: '네트워크 연결을 확인하고 다시 시도해주세요.'
    },
    auth: {
      title: '인증 오류',
      defaultMessage: '로그인이 필요합니다. 다시 로그인해주세요.'
    },
    database: {
      title: '데이터 오류',
      defaultMessage: '데이터 처리 중 오류가 발생했습니다.'
    },
    permission: {
      title: '권한 오류',
      defaultMessage: '이 작업을 수행할 권한이 없습니다.'
    },
    unknown: {
      title: '오류 발생',
      defaultMessage: '예상치 못한 오류가 발생했습니다.'
    }
  };

  static generate(error: any, context?: string): AppError {
    const type = ErrorClassifier.classify(error);
    const config = this.messages[type];
    const originalMessage = ErrorClassifier['extractMessage'](error);
    
    // 특정 에러에 대한 맞춤 메시지
    let userMessage = this.getSpecificMessage(originalMessage) || config.defaultMessage;
    
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: config.title,
      message: userMessage,
      details: error,
      recoverable: this.isRecoverable(type),
      retryable: this.isRetryable(type, originalMessage),
      timestamp: new Date(),
      context
    };
  }

  private static getSpecificMessage(message: string): string | null {
    const specificMessages: Record<string, string> = {
      'duplicate key': '이미 존재하는 항목입니다. 다른 이름을 사용해주세요.',
      'foreign key': '사용자 정보가 올바르지 않습니다. 다시 로그인해주세요.',
      'not-null constraint': '필수 정보가 누락되었습니다. 모든 항목을 입력해주세요.',
      'check constraint.*price': '가격은 0보다 큰 값을 입력해주세요.',
      'check constraint.*payment_date': '결제일은 1일부터 31일 사이로 입력해주세요.',
      'invalid input syntax': '입력 형식이 올바르지 않습니다. 다시 확인해주세요.',
      'network.*failed': '인터넷 연결을 확인하고 다시 시도해주세요.',
      'timeout': '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    };

    for (const [pattern, msg] of Object.entries(specificMessages)) {
      if (new RegExp(pattern, 'i').test(message)) {
        return msg;
      }
    }

    return null;
  }

  private static isRecoverable(type: AppError['type']): boolean {
    return ['validation', 'network', 'auth'].includes(type);
  }

  private static isRetryable(type: AppError['type'], message: string): boolean {
    if (type === 'network') return true;
    if (type === 'database' && message.includes('timeout')) return true;
    return false;
  }
}

/**
 * 에러 복구 액션 생성기
 */
export class ErrorActionGenerator {
  static generateActions(error: AppError, context: {
    onRetry?: () => Promise<void>;
    onLogin?: () => void;
    onRefresh?: () => void;
    onGoBack?: () => void;
  }): ErrorAction[] {
    const actions: ErrorAction[] = [];

    // 재시도 가능한 에러
    if (error.retryable && context.onRetry) {
      actions.push({
        label: '다시 시도',
        action: context.onRetry,
        primary: true
      });
    }

    // 인증 에러
    if (error.type === 'auth' && context.onLogin) {
      actions.push({
        label: '다시 로그인',
        action: context.onLogin,
        primary: true
      });
    }

    // 네트워크 에러
    if (error.type === 'network') {
      if (context.onRefresh) {
        actions.push({
          label: '새로고침',
          action: context.onRefresh
        });
      }
    }

    // 기본 액션
    if (context.onGoBack) {
      actions.push({
        label: '이전으로',
        action: context.onGoBack
      });
    }

    // 액션이 없으면 기본 닫기 추가
    if (actions.length === 0) {
      actions.push({
        label: '확인',
        action: () => {}
      });
    }

    return actions;
  }
}

/**
 * React 에러 처리 훅
 */
export function useErrorHandler() {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [errorHistory, setErrorHistory] = useState<AppError[]>([]);

  const handleError = useCallback((error: any, context?: string) => {
    const appError = ErrorMessageGenerator.generate(error, context);
    
    console.group(`🚨 Error: ${appError.title}`);
    console.error('Type:', appError.type);
    console.error('Message:', appError.message);
    console.error('Context:', appError.context);
    console.error('Original Error:', appError.details);
    console.error('Recoverable:', appError.recoverable);
    console.error('Retryable:', appError.retryable);
    console.groupEnd();

    setCurrentError(appError);
    setErrorHistory(prev => [appError, ...prev.slice(0, 9)]); // 최근 10개만 유지

    // 외부 에러 로깅 서비스에 전송 (선택사항)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: appError.message,
        fatal: !appError.recoverable
      });
    }

    return appError;
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const retryLastAction = useCallback(async (actionFn: () => Promise<void>) => {
    if (!currentError?.retryable) return;

    try {
      await actionFn();
      clearError();
    } catch (retryError) {
      handleError(retryError, 'retry_failed');
    }
  }, [currentError, handleError, clearError]);

  return {
    currentError,
    errorHistory,
    handleError,
    clearError,
    retryLastAction
  };
}

// ErrorDisplay 컴포넌트는 별도 파일로 분리됨
// import { ErrorDisplay } from '../components/ErrorDisplay';

// TypeScript 전역 타입 확장
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}