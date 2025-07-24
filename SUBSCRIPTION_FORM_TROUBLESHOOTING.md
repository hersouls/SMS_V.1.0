# 구독 폼 오류 해결 가이드

## 🚨 주요 오류 유형별 해결책

### 1️⃣ 필드 타입 불일치 오류

#### 날짜 형식 오류
**문제**: `Error: invalid input syntax for type date: "15/01/2025"`

**해결책**:
```javascript
// ❌ 잘못된 형식
const wrongDate = "15/01/2025"; // DD/MM/YYYY

// ✅ 올바른 형식
const correctDate = "2025-01-15"; // YYYY-MM-DD
```

**강화된 검증**:
```javascript
// src/lib/enhancedValidation.ts
export const validateDateFormat = (dateString: string, fieldName: string): FieldValidation => {
  if (!dateString) {
    return { isValid: false, errorMessage: `${fieldName}을(를) 입력해주세요` };
  }

  // YYYY-MM-DD 형식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { isValid: false, errorMessage: `${fieldName} 형식이 올바르지 않습니다. (YYYY-MM-DD)` };
  }

  // 실제 유효한 날짜인지 검증
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, errorMessage: `${fieldName}이(가) 유효하지 않습니다` };
  }

  return { isValid: true, errorMessage: '' };
};
```

#### 가격 형식 오류
**문제**: `"$15.99" → NaN`, `"15,000" → NaN`

**해결책**:
```javascript
// src/lib/enhancedValidation.ts
export const validatePrice = (priceInput: any, currency: string): FieldValidation => {
  // 문자열에서 숫자만 추출
  const cleanPrice = String(priceInput).replace(/[^0-9.]/g, '');
  const numericPrice = parseFloat(cleanPrice);

  if (isNaN(numericPrice) || numericPrice <= 0) {
    return { isValid: false, errorMessage: '올바른 가격을 입력해주세요' };
  }

  return { isValid: true, errorMessage: '' };
};
```

**통화별 입력 처리**:
```javascript
// 한국원: 천 단위 구분자 자동 추가
const handlePriceChange = (value: string) => {
  let numericValue = value.replace(/[^0-9.]/g, '');
  
  if (formData.currency === 'KRW') {
    const number = parseFloat(numericValue);
    if (!isNaN(number)) {
      numericValue = number.toLocaleString('ko-KR');
    }
  }
  
  updateField('price', numericValue);
};
```

#### 결제일 범위 오류
**문제**: `payment_date: 32 → Error: value out of range (1-31)`

**해결책**:
```javascript
export const validatePaymentDate = (paymentDate: any, renewDate?: string): FieldValidation => {
  if (paymentDate === undefined || paymentDate === '') {
    return { isValid: true, errorMessage: '' }; // 선택사항
  }

  const numericDay = parseInt(String(paymentDate).replace(/[^0-9]/g, ''));
  
  if (isNaN(numericDay) || numericDay < 1 || numericDay > 31) {
    return { isValid: false, errorMessage: '결제일은 1일부터 31일 사이여야 합니다' };
  }

  // 월별 최대 일수 검증
  if (renewDate) {
    const renewDateObj = new Date(renewDate);
    const maxDaysInMonth = new Date(renewDateObj.getFullYear(), renewDateObj.getMonth() + 1, 0).getDate();
    
    if (numericDay > maxDaysInMonth) {
      return { isValid: false, errorMessage: `해당 월의 최대 일수는 ${maxDaysInMonth}일입니다` };
    }
  }

  return { isValid: true, errorMessage: '' };
};
```

### 2️⃣ 필수 필드 누락 오류

#### DB 제약 조건 위반
**문제**: `ERROR: null value in column "name" violates not-null constraint`

**해결책**:
```javascript
// src/lib/enhancedValidation.ts
export const validateSubscriptionFormEnhanced = (formData: any): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // 필수 필드 검증
  const requiredFields = [
    { field: 'name', label: '서비스명', value: formData.name?.trim() },
    { field: 'price', label: '가격', value: formData.price },
    { field: 'currency', label: '통화', value: formData.currency },
    { field: 'renew_date', label: '갱신일', value: formData.renew_date }
  ];

  requiredFields.forEach(({ field, label, value }) => {
    if (!value || value === '') {
      errors[field] = `${label}을(를) 입력해주세요`;
    }
  });

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
};
```

**실시간 UI 피드백**:
```jsx
// 필드별 실시간 검증
const FieldValidation = ({ field, value, label, required }) => {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (required && (!value || value.toString().trim() === '')) {
      setIsValid(false);
      setErrorMessage(`${label}은(는) 필수 입력 항목입니다`);
    } else {
      setIsValid(true);
      setErrorMessage('');
    }
  }, [value, required, label]);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        className={`w-full border rounded-md px-3 py-2 ${
          !isValid ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
        value={value}
        onChange={onChange}
      />
      {!isValid && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};
```

### 3️⃣ 중복 데이터 오류

#### Unique Constraint 위반
**문제**: `ERROR: duplicate key value violates unique constraint "subscriptions_user_name_unique"`

**해결책**:
```javascript
// src/lib/enhancedValidation.ts
export const validateServiceName = (
  name: string, 
  existingSubscriptions: Array<{ id: string; name: string }>,
  editingId?: string
): FieldValidation => {
  if (!name || name.trim() === '') {
    return { isValid: false, errorMessage: '서비스명을 입력해주세요' };
  }

  const trimmedName = name.trim();
  
  // 중복 검사
  const normalizedName = trimmedName.toLowerCase();
  const duplicate = existingSubscriptions.find(sub => 
    sub.name.toLowerCase().trim() === normalizedName && 
    sub.id !== editingId // 수정 시 자기 자신 제외
  );

  if (duplicate) {
    return { isValid: false, errorMessage: `"${trimmedName}" 구독이 이미 존재합니다` };
  }

  return { isValid: true, errorMessage: '' };
};
```

**실시간 중복 검사 UI**:
```jsx
const ServiceNameInput = ({ value, onChange, subscriptions, currentId }) => {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const checkDuplicate = useCallback((name) => {
    const normalized = name.toLowerCase().trim();
    const existing = subscriptions.find(sub => 
      sub.name.toLowerCase().trim() === normalized && 
      sub.id !== currentId
    );
    
    if (existing) {
      setIsDuplicate(true);
      setSuggestions([
        `${name} (개인용)`,
        `${name} Premium`,
        `${name} Family`
      ]);
    } else {
      setIsDuplicate(false);
      setSuggestions([]);
    }
  }, [subscriptions, currentId]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-md px-3 py-2 ${
          isDuplicate ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder="예: Netflix, Spotify"
      />
      
      {isDuplicate && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <p className="text-sm text-yellow-700">
            이미 존재하는 서비스명입니다. 다른 이름을 사용해주세요.
          </p>
          {suggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-yellow-600">추천 이름:</p>
              <div className="flex gap-2 mt-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onChange(suggestion)}
                    className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 4️⃣ UI 상태 관리 오류

#### 로딩 상태 표시 오류
**문제**: 저장 버튼 클릭 후 로딩 상태가 해제되지 않음

**해결책**:
```javascript
// src/components/EnhancedSubscriptionForm.tsx
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (formState.isSubmitting) return; // 중복 제출 방지
  
  setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));
  
  try {
    // 전체 검증
    if (!validateAllFields()) {
      throw new Error('입력 정보를 확인해주세요');
    }

    // 제출
    const success = await onSubmit(formData);
    
    if (success) {
      // 성공 시 폼 초기화
      setFormData(initialFormData);
      setFormState({
        isSubmitting: false,
        isValidating: false,
        errors: {},
        touched: {},
        isDirty: false
      });
    }
  } catch (error) {
    setFormState(prev => ({ 
      ...prev, 
      isSubmitting: false,
      errors: { submit: error.message }
    }));
  }
}, [formData, formState.isSubmitting, validateAllFields, onSubmit]);
```

## 🧪 실시간 진단 도구

### 브라우저 Console 디버깅
```javascript
// 폼 데이터 실시간 모니터링
window.subscriptionFormDebug = {
  watchFormData: (formData) => {
    console.group('📝 폼 데이터 검증');
    console.log('원본 데이터:', formData);
    console.log('변환된 데이터:', {
      name: formData.name?.trim(),
      price: parseFloat(formData.price),
      currency: formData.currency,
      renewDate: formData.renewDate,
      paymentDate: parseInt(formData.paymentDate)
    });
    console.log('검증 결과:', validateFormData(formData));
    console.groupEnd();
  },

  testDatabaseInsert: async (formData) => {
    console.group('💾 DB 삽입 테스트');
    try {
      const insertData = transformFormDataForDB(formData);
      console.log('삽입할 데이터:', insertData);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .limit(0); // 실제 삽입하지 않음
        
      console.log('검증 결과:', error ? '❌ 실패' : '✅ 성공');
      if (error) console.error('오류:', error);
    } catch (error) {
      console.error('❌ 예외 발생:', error);
    }
    console.groupEnd();
  }
};

// 사용법
window.subscriptionFormDebug.watchFormData(currentFormData);
window.subscriptionFormDebug.testDatabaseInsert(currentFormData);
```

### 실시간 에러 모니터링
```jsx
// ErrorBoundary 확장으로 폼 에러 캐치
const SubscriptionFormWrapper = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-form-fallback">
          <h3>폼 처리 중 오류가 발생했습니다</h3>
          <p>페이지를 새로고침 후 다시 시도해주세요.</p>
        </div>
      }
      onError={(error, errorInfo) => {
        console.group('📝 폼 에러 발생');
        console.error('에러:', error);
        console.error('컴포넌트 스택:', errorInfo.componentStack);
        console.error('현재 폼 데이터:', getCurrentFormData());
        console.groupEnd();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## 🚨 긴급 상황별 빠른 해결책

### 상황 1: 폼이 아예 제출되지 않는 경우
```javascript
// 1. 기본 검증 비활성화
const EMERGENCY_BYPASS = {
  skipValidation: process.env.NODE_ENV === 'development',
  allowEmptyFields: false,
  useBasicTypeConversion: true
};

// 2. 최소한의 데이터로 테스트
const minimalTestData = {
  user_id: user.id,
  name: "테스트 구독",
  price: 1000,
  currency: "KRW",
  renew_date: "2025-12-31"
};
```

### 상황 2: 특정 필드에서 계속 오류가 발생하는 경우
```javascript
// 1. 해당 필드 임시 제거
const sanitizeFormData = (formData) => {
  const cleanData = { ...formData };
  
  // 문제가 되는 필드들 안전하게 처리
  if (cleanData.paymentDate === '' || isNaN(cleanData.paymentDate)) {
    delete cleanData.paymentDate; // DB에서 NULL 허용 시
  }
  
  if (cleanData.url && !cleanData.url.startsWith('http')) {
    cleanData.url = `https://${cleanData.url}`;
  }
  
  return cleanData;
};
```

### 상황 3: DB 연결은 되지만 저장이 안 되는 경우
```javascript
// 1. 원시 SQL로 직접 삽입 테스트
const testDirectInsert = async () => {
  const { data, error } = await supabase.rpc('insert_subscription_direct', {
    p_user_id: user.id,
    p_name: 'Test Subscription',
    p_price: 1000,
    p_currency: 'KRW',
    p_renew_date: '2025-12-31'
  });
  
  console.log('직접 삽입 결과:', { data, error });
};
```

## 📋 사용법

### 1. 강화된 폼 컴포넌트 사용
```jsx
import { EnhancedSubscriptionForm } from './components/EnhancedSubscriptionForm';

const MyComponent = () => {
  const handleSubmit = async (formData) => {
    // 강화된 검증이 자동으로 수행됩니다
    const success = await addSubscription(formData);
    return success;
  };

  return (
    <EnhancedSubscriptionForm
      onSubmit={handleSubmit}
      onCancel={() => setShowForm(false)}
      existingSubscriptions={subscriptions}
      isEditing={false}
    />
  );
};
```

### 2. 디버그 모드 활성화
```jsx
// 헤더의 디버그 버튼을 클릭하거나
<button onClick={() => setDebugMode(!debugMode)}>
  {debugMode ? '🔧 디버그 ON' : '🔧 디버그 OFF'}
</button>

// 브라우저 콘솔에서 직접 활성화
window.subscriptionFormDebug.enableDebugMode();
```

### 3. 실시간 모니터링
```javascript
// 브라우저 콘솔에서 사용 가능한 명령어들
window.subscriptionFormDebug.watchFormData(currentFormData);
window.subscriptionFormDebug.testDatabaseInsert(currentFormData);
window.formDebugUtils.prettyPrint(formData, '현재 폼 데이터');
window.formDebugUtils.compareFormData(beforeData, afterData);
```

## 🔧 추가 설정

### 환경 변수 설정
```bash
# .env.local
REACT_APP_DEBUG_MODE=true
REACT_APP_VALIDATION_STRICT=true
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
```

### 개발 모드에서 자동 디버그 활성화
```javascript
// src/lib/formDebugger.ts
if (process.env.NODE_ENV === 'development') {
  formDebugger.enableDebugMode();
}
```

## 📊 성능 모니터링

### 작업별 성능 측정
```javascript
// 자동으로 모든 작업의 성능을 측정합니다
const result = await performanceMonitor.measureOperation('addSubscription', async () => {
  return await addSubscription(formData);
});

// 성능 요약 확인
const summary = performanceMonitor.getPerformanceSummary();
console.log('성능 요약:', summary);
```

### 느린 작업 감지
```javascript
// 1초 이상 걸리는 작업은 자동으로 경고를 표시합니다
if (duration > 1000) {
  console.warn(`⚠️ 느린 작업 감지: ${operation} (${duration.toFixed(2)}ms)`);
}
```

## 🎯 모범 사례

### 1. 데이터 검증 순서
1. 클라이언트 측 실시간 검증
2. 서버 측 최종 검증
3. DB 제약 조건 검증

### 2. 에러 처리 계층
1. 필드별 실시간 검증
2. 폼 전체 검증
3. 서버 응답 에러 처리
4. 글로벌 에러 바운더리

### 3. 사용자 경험
1. 즉각적인 피드백
2. 명확한 에러 메시지
3. 제안 사항 제공
4. 진행 상태 표시

이 가이드를 따라하면 구독 폼의 모든 일반적인 오류를 예방하고 효과적으로 해결할 수 있습니다.