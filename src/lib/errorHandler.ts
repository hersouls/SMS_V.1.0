export interface ErrorResult {
  userMessage: string;
  technicalError: unknown;
  shouldRetry?: boolean;
  retryDelay?: number;
}

export const handleError = (error: unknown, context: string): ErrorResult => {
  console.error(`Error in ${context}:`, error);
  
  let userMessage = '오류가 발생했습니다.';
  let shouldRetry = false;
  let retryDelay = 0;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      userMessage = '네트워크 연결을 확인해주세요.';
      shouldRetry = true;
      retryDelay = 2000;
    } else if (message.includes('duplicate') || message.includes('unique')) {
      userMessage = '이미 존재하는 항목입니다.';
    } else if (message.includes('foreign key')) {
      userMessage = '사용자 정보가 올바르지 않습니다. 다시 로그인해주세요.';
    } else if (message.includes('check constraint')) {
      if (message.includes('price')) {
        userMessage = '가격은 0보다 큰 값이어야 합니다.';
      } else if (message.includes('payment_date')) {
        userMessage = '결제일은 1일부터 31일 사이여야 합니다.';
      } else {
        userMessage = '입력 데이터가 제약 조건을 만족하지 않습니다.';
      }
    } else if (message.includes('timeout')) {
      userMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
      shouldRetry = true;
      retryDelay = 3000;
    } else if (message.includes('not-null constraint')) {
      userMessage = '필수 정보가 누락되었습니다. 모든 필수 항목을 입력해주세요.';
    } else if (message.includes('invalid input syntax')) {
      userMessage = '입력 데이터 형식이 올바르지 않습니다. 다시 확인해주세요.';
    } else if (message.includes('column') && message.includes('does not exist')) {
      userMessage = '데이터베이스 스키마 오류가 발생했습니다. 관리자에게 문의해주세요.';
    } else if (message.includes('unauthorized') || message.includes('401')) {
      userMessage = '인증이 필요합니다. 다시 로그인해주세요.';
    } else if (message.includes('forbidden') || message.includes('403')) {
      userMessage = '접근 권한이 없습니다.';
    } else if (message.includes('not found') || message.includes('404')) {
      userMessage = '요청한 데이터를 찾을 수 없습니다.';
    } else if (message.includes('server error') || message.includes('500')) {
      userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      shouldRetry = true;
      retryDelay = 5000;
    } else {
      userMessage = `오류가 발생했습니다: ${error.message}`;
    }
  } else if (typeof error === 'string') {
    userMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    userMessage = String((error as any).message);
  }
  
  return { 
    userMessage, 
    technicalError: error,
    shouldRetry,
    retryDelay
  };
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('server error') ||
           message.includes('500');
  }
  return false;
};

export const getRetryDelay = (attempt: number, baseDelay: number = 1000): number => {
  return baseDelay * Math.pow(2, attempt); // Exponential backoff
};