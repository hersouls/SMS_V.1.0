import { SignUpData, ValidationError } from '../types/auth';

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
  if (name.length < 2) return `${fieldName}은(는) 최소 2자 이상이어야 합니다.`;
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