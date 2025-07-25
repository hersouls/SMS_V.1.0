# 🚨 에러 처리 시스템 가이드

## 📋 개요

이 문서는 구독 관리 앱의 중앙화된 에러 처리 시스템에 대한 가이드입니다. 이 시스템은 일관된 에러 메시지, 사용자 친화적인 UI 피드백, 그리고 네트워크 오류 복구 메커니즘을 제공합니다.

## 🏗️ 시스템 구조

### 1. 핵심 컴포넌트

```
src/lib/
├── errorHandlingSystem.ts    # 메인 에러 처리 시스템
├── networkRecovery.ts        # 네트워크 복구 메커니즘
└── supabaseWithErrorHandling.ts  # Supabase 에러 처리 래퍼
```

### 2. 에러 타입 분류

- **validation**: 입력 검증 오류
- **network**: 네트워크 연결 오류
- **auth**: 인증 관련 오류
- **database**: 데이터베이스 오류
- **permission**: 권한 오류
- **unknown**: 기타 알 수 없는 오류

## 🚀 사용법

### 1. 기본 에러 처리 훅 사용

```typescript
import { useErrorHandler } from './lib/errorHandlingSystem';

const MyComponent = () => {
  const { currentError, handleError, clearError, retryLastAction } = useErrorHandler();

  const handleApiCall = async () => {
    try {
      const result = await someApiCall();
      // 성공 처리
    } catch (error) {
      handleError(error, 'api_call_context');
    }
  };

  return (
    <div>
      {/* 에러 표시 */}
      {currentError && (
        <ErrorDisplay
          error={currentError}
          actions={ErrorActionGenerator.generateActions(currentError, {
            onRetry: () => retryLastAction(handleApiCall),
            onRefresh: () => window.location.reload(),
            onGoBack: () => window.history.back()
          })}
          onClose={clearError}
        />
      )}
    </div>
  );
};
```

### 2. 네트워크 상태 모니터링

```typescript
import { useNetworkStatus } from './lib/networkRecovery';

const MyComponent = () => {
  const { isOnline, testConnection } = useNetworkStatus();

  return (
    <div>
      {!isOnline && (
        <div className="bg-red-500 text-white p-2">
          오프라인 모드입니다
        </div>
      )}
    </div>
  );
};
```

### 3. Supabase 에러 처리 래퍼 사용

```typescript
import { subscriptionErrorHandlers } from './lib/supabaseWithErrorHandling';

const loadSubscriptions = async (userId: string) => {
  const { data, error } = await subscriptionErrorHandlers.fetchSubscriptions(userId);
  
  if (error) {
    // 에러는 이미 분류되고 사용자 친화적 메시지로 변환됨
    handleError(error, 'load_subscriptions');
    return;
  }
  
  // 성공 처리
  setSubscriptions(data);
};
```

## 🔧 고급 기능

### 1. 커스텀 에러 메시지

```typescript
import { ErrorMessageGenerator } from './lib/errorHandlingSystem';

// 특정 에러에 대한 맞춤 메시지 추가
const customError = ErrorMessageGenerator.generate(
  new Error('custom_error_type'),
  'my_context'
);
```

### 2. 네트워크 재시도 설정

```typescript
import { NetworkRetryManager } from './lib/networkRecovery';

const result = await NetworkRetryManager.withRetry(
  async () => {
    return await someApiCall();
  },
  {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  'api_context'
);
```

### 3. 에러 바운더리 사용

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
};
```

## 📊 에러 모니터링

### 1. 개발 모드에서 상세 정보

개발 모드에서는 에러 상세 정보가 자동으로 표시됩니다:

```typescript
// 개발 모드에서만 표시되는 상세 정보
{process.env.NODE_ENV === 'development' && (
  <details>
    <summary>개발자 정보</summary>
    <pre>{JSON.stringify(error.details, null, 2)}</pre>
  </details>
)}
```

### 2. 에러 로깅

```typescript
// 콘솔에 구조화된 에러 정보 출력
console.group(`🚨 Error: ${appError.title}`);
console.error('Type:', appError.type);
console.error('Message:', appError.message);
console.error('Context:', appError.context);
console.groupEnd();
```

## 🎯 에러 처리 모범 사례

### 1. 적절한 컨텍스트 제공

```typescript
// 좋은 예
handleError(error, 'user_profile_update');

// 나쁜 예
handleError(error);
```

### 2. 재시도 가능한 작업 식별

```typescript
// 네트워크 요청은 재시도 가능
const { data, error } = await subscriptionErrorHandlers.fetchSubscriptions(userId);

// 사용자 입력 검증은 재시도 불가
if (!isValidInput) {
  handleError(new Error('Invalid input'), 'form_validation');
  return;
}
```

### 3. 사용자 친화적 액션 제공

```typescript
const actions = ErrorActionGenerator.generateActions(error, {
  onRetry: () => retryLastAction(originalFunction),
  onLogin: () => navigate('/login'),
  onRefresh: () => window.location.reload(),
  onGoBack: () => window.history.back()
});
```

## 🔍 문제 해결

### 1. 일반적인 문제들

**Q: 에러가 제대로 분류되지 않아요**
A: 에러 메시지에 특정 키워드가 포함되어 있는지 확인하세요. 필요시 `ErrorClassifier`의 패턴을 확장할 수 있습니다.

**Q: 재시도가 너무 자주 발생해요**
A: `NetworkRetryManager`의 설정을 조정하세요. 특히 `maxAttempts`와 `baseDelay`를 확인하세요.

**Q: 에러 메시지가 사용자에게 적절하지 않아요**
A: `ErrorMessageGenerator`의 `getSpecificMessage` 메서드에 새로운 패턴을 추가하세요.

### 2. 디버깅 팁

1. **개발자 도구 확인**: 콘솔에서 구조화된 에러 정보를 확인
2. **네트워크 탭**: 실제 네트워크 요청 상태 확인
3. **에러 타입별 테스트**: 각 에러 타입을 시뮬레이션하여 동작 확인

## 📈 성능 최적화

### 1. 에러 히스토리 관리

```typescript
// 최근 10개의 에러만 유지
setErrorHistory(prev => [appError, ...prev.slice(0, 9)]);
```

### 2. 지연된 에러 처리

```typescript
// 무거운 작업 후 에러 처리
setTimeout(() => {
  handleError(error, 'heavy_operation');
}, 0);
```

## 🔄 업데이트 및 확장

### 1. 새로운 에러 타입 추가

```typescript
// errorHandlingSystem.ts
export interface AppError {
  type: 'validation' | 'network' | 'auth' | 'database' | 'permission' | 'unknown' | 'new_type';
  // ...
}
```

### 2. 새로운 에러 패턴 추가

```typescript
// ErrorClassifier 클래스
private static patterns = {
  // ... 기존 패턴들
  new_type: [
    /new_error_pattern/i,
    /another_pattern/i
  ]
};
```

### 3. 새로운 액션 추가

```typescript
// ErrorActionGenerator 클래스
static generateActions(error: AppError, context: {
  // ... 기존 컨텍스트
  onCustomAction?: () => void;
}): ErrorAction[] {
  // ... 기존 로직
  if (error.type === 'new_type' && context.onCustomAction) {
    actions.push({
      label: '커스텀 액션',
      action: context.onCustomAction
    });
  }
  return actions;
}
```

## 📚 추가 리소스

- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Network Error Handling](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

---

이 에러 처리 시스템을 통해 사용자 경험을 크게 개선하고, 개발자들이 에러를 더 효과적으로 관리할 수 있습니다.