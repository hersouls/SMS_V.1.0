import { SignUpData, ValidationError } from '../types/auth';
import { SubscriptionFormData } from '../types/subscription';

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return '이메일을 입력해주세요.';
  if (!emailRegex.test(email)) return '올바른 이메일 형식을 입력해주세요.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  if (!/(?=.*[a-z])/.test(password)) return '비밀번호는 최소 하나의 소문자를 포함해야 합니다.';
  if (!/(?=.*[A-Z])/.test(password)) return '비밀번호는 최소 하나의 대문자를 포함해야 합니다.';
  if (!/(?=.*\d)/.test(password)) return '비밀번호는 최소 하나의 숫자를 포함해야 합니다.';
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return '비밀번호 확인을 입력해주세요.';
  if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.';
  return null;
};

export const validateName = (name: string, fieldName: string): string | null => {
  if (!name) return `${fieldName}을(를) 입력해주세요.`;
  if (name.length < 1) return `${fieldName}은(는) 최소 1자 이상이어야 합니다.`;
  if (name.length > 50) return `${fieldName}은(는) 최대 50자까지 입력 가능합니다.`;
  return null;
};

export const validatePhoneNumber = (phoneNumber: string): string | null => {
  if (!phoneNumber) return null; // 선택사항
  const phoneRegex = /^[0-9-+\s()]+$/;
  if (!phoneRegex.test(phoneNumber)) return '올바른 전화번호 형식을 입력해주세요.';
  return null;
};

export const validateTerms = (agreeToTerms: boolean): string | null => {
  if (!agreeToTerms) return '이용약관에 동의해주세요.';
  return null;
};

export const validateSignUpData = (data: SignUpData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // 이메일 검증
  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.push({ field: 'email', message: emailError });
  }

  // 비밀번호 검증
  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.push({ field: 'password', message: passwordError });
  }

  // 비밀번호 확인 검증
  const confirmPasswordError = validateConfirmPassword(data.password, data.confirmPassword);
  if (confirmPasswordError) {
    errors.push({ field: 'confirmPassword', message: confirmPasswordError });
  }

  // 이름 검증
  const firstNameError = validateName(data.firstName, '이름');
  if (firstNameError) {
    errors.push({ field: 'firstName', message: firstNameError });
  }

  const lastNameError = validateName(data.lastName, '성');
  if (lastNameError) {
    errors.push({ field: 'lastName', message: lastNameError });
  }

  // 전화번호 검증
  const phoneError = validatePhoneNumber(data.phoneNumber || '');
  if (phoneError) {
    errors.push({ field: 'phoneNumber', message: phoneError });
  }

  // 약관 동의 검증
  const termsError = validateTerms(data.agreeToTerms);
  if (termsError) {
    errors.push({ field: 'agreeToTerms', message: termsError });
  }

  return errors;
};

export const validateSubscriptionData = (data: any): data is SubscriptionFormData => {
  // Basic type checks
  if (!data || typeof data !== 'object') return false;
  
  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return false;
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    return false;
  }
  
  if (!data.renew_date || typeof data.renew_date !== 'string') {
    return false;
  }
  
  // Currency validation
  if (data.currency && !['KRW', 'USD', 'EUR', 'JPY'].includes(data.currency)) {
    return false;
  }
  
  // Date format validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (data.renew_date && !dateRegex.test(data.renew_date)) {
    return false;
  }
  
  if (data.start_date && !dateRegex.test(data.start_date)) {
    return false;
  }
  
  // Payment date validation
  if (data.payment_date !== undefined) {
    const paymentDate = parseInt(String(data.payment_date));
    if (isNaN(paymentDate) || paymentDate < 1 || paymentDate > 31) {
      return false;
    }
  }
  
  // URL validation (if provided)
  if (data.url && typeof data.url === 'string' && data.url.trim().length > 0) {
    try {
      new URL(data.url);
    } catch {
      return false;
    }
  }
  
  return true;
};

export const validateSubscriptionForm = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!formData.name || typeof formData.name !== 'string' || formData.name.trim().length === 0) {
    errors.push('서비스명은 필수입니다.');
  }
  
  if (!formData.price || typeof formData.price !== 'number' || formData.price <= 0) {
    errors.push('가격은 0보다 큰 값이어야 합니다.');
  }
  
  if (!formData.renew_date || typeof formData.renew_date !== 'string') {
    errors.push('갱신일은 필수입니다.');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.renew_date)) {
    errors.push('갱신일 형식이 올바르지 않습니다. (YYYY-MM-DD)');
  }
  
  if (formData.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.start_date)) {
    errors.push('시작일 형식이 올바르지 않습니다. (YYYY-MM-DD)');
  }
  
  if (formData.payment_date !== undefined) {
    const paymentDate = parseInt(String(formData.payment_date));
    if (isNaN(paymentDate) || paymentDate < 1 || paymentDate > 31) {
      errors.push('결제일은 1일부터 31일 사이여야 합니다.');
    }
  }
  
  if (formData.currency && !['KRW', 'USD', 'EUR', 'JPY'].includes(formData.currency)) {
    errors.push('지원하지 않는 통화입니다.');
  }
  
  if (formData.url && typeof formData.url === 'string' && formData.url.trim().length > 0) {
    try {
      new URL(formData.url);
    } catch {
      errors.push('올바른 URL 형식이 아닙니다.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeSubscriptionData = (data: any): Partial<SubscriptionFormData> => {
  return {
    name: data.name ? String(data.name).trim() : '',
    icon: data.icon ? String(data.icon) : '📱',
    icon_image_url: data.icon_image_url ? String(data.icon_image_url).trim() : undefined,
    price: data.price ? parseFloat(String(data.price)) || 0 : 0,
    currency: data.currency && ['KRW', 'USD', 'EUR', 'JPY'].includes(data.currency) 
      ? data.currency as 'KRW' | 'USD' | 'EUR' | 'JPY' 
      : 'KRW',
    renew_date: data.renew_date ? String(data.renew_date) : '',
    start_date: data.start_date ? String(data.start_date) : undefined,
    payment_date: data.payment_date ? parseInt(String(data.payment_date)) : undefined,
    payment_card: data.payment_card ? String(data.payment_card).trim() : undefined,
    url: data.url ? String(data.url).trim() : undefined,
    color: data.color ? String(data.color) : '#3B82F6',
    category: data.category ? String(data.category).trim() : undefined,
    is_active: data.is_active !== false
  };
};