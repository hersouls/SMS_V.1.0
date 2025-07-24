import React from 'react';
import { SubscriptionFormData } from '../types/subscription';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface FieldValidation {
  isValid: boolean;
  errorMessage: string;
  warningMessage?: string;
}

// 날짜 형식 검증
export const validateDateFormat = (dateString: string, fieldName: string): FieldValidation => {
  if (!dateString) {
    return {
      isValid: false,
      errorMessage: `${fieldName}을(를) 입력해주세요`
    };
  }

  // YYYY-MM-DD 형식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} 형식이 올바르지 않습니다. (YYYY-MM-DD)`
    };
  }

  // 실제 유효한 날짜인지 검증
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      errorMessage: `${fieldName}이(가) 유효하지 않습니다`
    };
  }

  // 미래 날짜 검증 (갱신일의 경우)
  if (fieldName === '갱신일') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return {
        isValid: false,
        errorMessage: '갱신일은 오늘 이후로 설정해주세요'
      };
    }
  }

  return {
    isValid: true,
    errorMessage: ''
  };
};

// 가격 검증
export const validatePrice = (priceInput: any, currency: string): FieldValidation => {
  if (!priceInput && priceInput !== 0) {
    return {
      isValid: false,
      errorMessage: '가격을 입력해주세요'
    };
  }

  // 문자열에서 숫자만 추출
  const cleanPrice = String(priceInput).replace(/[^0-9.]/g, '');
  const numericPrice = parseFloat(cleanPrice);

  if (isNaN(numericPrice)) {
    return {
      isValid: false,
      errorMessage: '올바른 가격을 입력해주세요'
    };
  }

  if (numericPrice <= 0) {
    return {
      isValid: false,
      errorMessage: '가격은 0보다 커야 합니다'
    };
  }

  // 통화별 최대값 검증
  const maxValues = {
    KRW: 10000000, // 1천만원
    USD: 10000,    // 1만달러
    EUR: 10000,    // 1만유로
    JPY: 1000000   // 100만엔
  };

  if (numericPrice > maxValues[currency as keyof typeof maxValues]) {
    return {
      isValid: false,
      errorMessage: `가격이 너무 큽니다. 최대 ${maxValues[currency as keyof typeof maxValues].toLocaleString()} ${currency}까지 입력 가능합니다`
    };
  }

  return {
    isValid: true,
    errorMessage: ''
  };
};

// 결제일 검증
export const validatePaymentDate = (paymentDate: any, renewDate?: string): FieldValidation => {
  if (paymentDate === undefined || paymentDate === '') {
    return {
      isValid: true, // 선택사항
      errorMessage: ''
    };
  }

  const numericDay = parseInt(String(paymentDate).replace(/[^0-9]/g, ''));
  
  if (isNaN(numericDay)) {
    return {
      isValid: false,
      errorMessage: '결제일은 숫자로 입력해주세요'
    };
  }

  if (numericDay < 1 || numericDay > 31) {
    return {
      isValid: false,
      errorMessage: '결제일은 1일부터 31일 사이여야 합니다'
    };
  }

  // 갱신일이 있는 경우 월별 최대 일수 검증
  if (renewDate) {
    try {
      const renewDateObj = new Date(renewDate);
      const maxDaysInMonth = new Date(renewDateObj.getFullYear(), renewDateObj.getMonth() + 1, 0).getDate();
      
      if (numericDay > maxDaysInMonth) {
        return {
          isValid: false,
          errorMessage: `해당 월의 최대 일수는 ${maxDaysInMonth}일입니다`
        };
      }
    } catch (error) {
      // 갱신일이 유효하지 않은 경우 경고만 표시
      return {
        isValid: true,
        errorMessage: '',
        warningMessage: '갱신일을 먼저 설정하면 더 정확한 검증이 가능합니다'
      };
    }
  }

  return {
    isValid: true,
    errorMessage: ''
  };
};

// URL 검증
export const validateUrl = (url: string): FieldValidation => {
  if (!url || url.trim() === '') {
    return {
      isValid: true, // 선택사항
      errorMessage: ''
    };
  }

  try {
    let normalizedUrl = url.trim();
    
    // 프로토콜이 없는 경우 https:// 추가
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    new URL(normalizedUrl);
    
    return {
      isValid: true,
      errorMessage: ''
    };
  } catch {
    return {
      isValid: false,
      errorMessage: '올바른 URL 형식을 입력해주세요'
    };
  }
};

// 서비스명 중복 검증
export const validateServiceName = (
  name: string, 
  existingSubscriptions: Array<{ id: string; name: string }>,
  editingId?: string
): FieldValidation => {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      errorMessage: '서비스명을 입력해주세요'
    };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length > 50) {
    return {
      isValid: false,
      errorMessage: '서비스명은 50자 이하여야 합니다'
    };
  }

  // 중복 검사
  const normalizedName = trimmedName.toLowerCase();
  const duplicate = existingSubscriptions.find(sub => 
    sub.name.toLowerCase().trim() === normalizedName && 
    sub.id !== editingId
  );

  if (duplicate) {
    return {
      isValid: false,
      errorMessage: `"${trimmedName}" 구독이 이미 존재합니다`
    };
  }

  return {
    isValid: true,
    errorMessage: ''
  };
};

// 통화 검증
export const validateCurrency = (currency: string): FieldValidation => {
  const validCurrencies = ['KRW', 'USD', 'EUR', 'JPY'];
  
  if (!currency || !validCurrencies.includes(currency)) {
    return {
      isValid: false,
      errorMessage: '지원하지 않는 통화입니다'
    };
  }

  return {
    isValid: true,
    errorMessage: ''
  };
};

// 전체 폼 검증
export const validateSubscriptionFormEnhanced = (
  formData: Partial<SubscriptionFormData>,
  existingSubscriptions: Array<{ id: string; name: string }> = [],
  editingId?: string
): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // 서비스명 검증
  const nameValidation = validateServiceName(formData.name || '', existingSubscriptions, editingId);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.errorMessage;
  }

  // 가격 검증
  const priceValidation = validatePrice(formData.price, formData.currency || 'KRW');
  if (!priceValidation.isValid) {
    errors.price = priceValidation.errorMessage;
  }

  // 통화 검증
  const currencyValidation = validateCurrency(formData.currency || 'KRW');
  if (!currencyValidation.isValid) {
    errors.currency = currencyValidation.errorMessage;
  }

  // 갱신일 검증
  const renewDateValidation = validateDateFormat(formData.renew_date || '', '갱신일');
  if (!renewDateValidation.isValid) {
    errors.renew_date = renewDateValidation.errorMessage;
  }

  // 시작일 검증 (선택사항)
  if (formData.start_date) {
    const startDateValidation = validateDateFormat(formData.start_date, '시작일');
    if (!startDateValidation.isValid) {
      errors.start_date = startDateValidation.errorMessage;
    }
  }

  // 결제일 검증
  const paymentDateValidation = validatePaymentDate(formData.payment_date, formData.renew_date);
  if (!paymentDateValidation.isValid) {
    errors.payment_date = paymentDateValidation.errorMessage;
  }
  if (paymentDateValidation.warningMessage) {
    warnings.payment_date = paymentDateValidation.warningMessage;
  }

  // URL 검증
  const urlValidation = validateUrl(formData.url || '');
  if (!urlValidation.isValid) {
    errors.url = urlValidation.errorMessage;
  }

  // 카테고리 검증 (선택사항)
  if (formData.category && formData.category.length > 20) {
    errors.category = '카테고리는 20자 이하여야 합니다';
  }

  // 결제 카드 검증 (선택사항)
  if (formData.payment_card && formData.payment_card.length > 50) {
    errors.payment_card = '결제 카드는 50자 이하여야 합니다';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

// 데이터 정제 (DB 저장용)
export const sanitizeSubscriptionDataEnhanced = (data: any): Partial<SubscriptionFormData> => {
  const sanitized: Partial<SubscriptionFormData> = {};

  // 서비스명
  if (data.name) {
    sanitized.name = String(data.name).trim();
  }

  // 아이콘
  sanitized.icon = data.icon ? String(data.icon) : '📱';

  // 아이콘 이미지 URL
  if (data.icon_image_url) {
    sanitized.icon_image_url = String(data.icon_image_url).trim();
  }

  // 가격 (숫자만 추출하여 변환)
  if (data.price !== undefined) {
    const cleanPrice = String(data.price).replace(/[^0-9.]/g, '');
    sanitized.price = parseFloat(cleanPrice) || 0;
  }

  // 통화
  const validCurrencies = ['KRW', 'USD', 'EUR', 'JPY'];
  sanitized.currency = validCurrencies.includes(data.currency) ? data.currency : 'KRW';

  // 갱신일
  if (data.renew_date) {
    sanitized.renew_date = String(data.renew_date);
  }

  // 시작일
  if (data.start_date) {
    sanitized.start_date = String(data.start_date);
  }

  // 결제일
  if (data.payment_date !== undefined && data.payment_date !== '') {
    const numericDay = parseInt(String(data.payment_date).replace(/[^0-9]/g, ''));
    if (!isNaN(numericDay) && numericDay >= 1 && numericDay <= 31) {
      sanitized.payment_date = numericDay;
    }
  }

  // 결제 카드
  if (data.payment_card) {
    sanitized.payment_card = String(data.payment_card).trim();
  }

  // URL
  if (data.url) {
    let url = String(data.url).trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    sanitized.url = url;
  }

  // 색상
  sanitized.color = data.color ? String(data.color) : '#3B82F6';

  // 카테고리
  if (data.category) {
    sanitized.category = String(data.category).trim();
  }

  // 활성 상태
  sanitized.is_active = data.is_active !== false;

  return sanitized;
};

// 실시간 검증을 위한 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 필드별 실시간 검증 훅
export const useFieldValidation = (
  field: string,
  value: any,
  validationFn: (value: any) => FieldValidation,
  dependencies: any[] = []
) => {
  const [validation, setValidation] = React.useState<FieldValidation>({
    isValid: true,
    errorMessage: ''
  });

  const debouncedValidation = React.useMemo(
    () => debounce((val: any) => {
      const result = validationFn(val);
      setValidation(result);
    }, 300),
    [validationFn]
  );

  React.useEffect(() => {
    debouncedValidation(value);
  }, [value, ...dependencies]);

  return validation;
};

// 긴급 상황별 빠른 해결책
export const EMERGENCY_VALIDATION_BYPASS = {
  skipValidation: process.env.NODE_ENV === 'development',
  allowEmptyFields: false,
  useBasicTypeConversion: true
};

export const createMinimalTestData = (userId: string) => ({
  user_id: userId,
  name: "테스트 구독",
  price: 1000,
  currency: "KRW",
  renew_date: "2025-12-31",
  icon: "📱",
  color: "#3B82F6",
  is_active: true
});

export const sanitizeFormDataForEmergency = (formData: any) => {
  const cleanData = { ...formData };
  
  // 문제가 되는 필드들 안전하게 처리
  if (cleanData.payment_date === '' || isNaN(cleanData.payment_date)) {
    delete cleanData.payment_date; // DB에서 NULL 허용 시
  }
  
  if (cleanData.url && !cleanData.url.startsWith('http')) {
    cleanData.url = `https://${cleanData.url}`;
  }
  
  // 가격 정제
  if (cleanData.price) {
    const cleanPrice = String(cleanData.price).replace(/[^0-9.]/g, '');
    cleanData.price = parseFloat(cleanPrice) || 0;
  }
  
  return cleanData;
};