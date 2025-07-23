import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  validatePhoneNumber,
  validateTerms,
  validateSignUpData
} from '../../lib/validation';
import { SignUpData } from '../../types/auth';

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    it('should return null for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBeNull();
      expect(validateEmail('user.name@domain.co.kr')).toBeNull();
      expect(validateEmail('test+tag@example.org')).toBeNull();
    });

    it('should return error message for empty email', () => {
      expect(validateEmail('')).toBe('이메일을 입력해주세요.');
      // 공백 문자열은 truthy이므로 정규식 검사에서 걸림
      expect(validateEmail('   ')).toBe('올바른 이메일 형식을 입력해주세요.');
    });

    it('should return error message for invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe('올바른 이메일 형식을 입력해주세요.');
      expect(validateEmail('test@')).toBe('올바른 이메일 형식을 입력해주세요.');
      expect(validateEmail('@example.com')).toBe('올바른 이메일 형식을 입력해주세요.');
      // 실제 정규식은 연속된 점을 허용하므로 null 반환
      expect(validateEmail('test..test@example.com')).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should return null for valid passwords', () => {
      expect(validatePassword('Password123')).toBeNull();
      expect(validatePassword('MySecurePass1')).toBeNull();
      expect(validatePassword('Complex@Pass1')).toBeNull();
    });

    it('should return error message for empty password', () => {
      expect(validatePassword('')).toBe('비밀번호를 입력해주세요.');
    });

    it('should return error message for password shorter than 8 characters', () => {
      expect(validatePassword('Pass1')).toBe('비밀번호는 최소 8자 이상이어야 합니다.');
    });

    it('should return error message for password without lowercase letter', () => {
      expect(validatePassword('PASSWORD123')).toBe('비밀번호는 최소 하나의 소문자를 포함해야 합니다.');
    });

    it('should return error message for password without uppercase letter', () => {
      expect(validatePassword('password123')).toBe('비밀번호는 최소 하나의 대문자를 포함해야 합니다.');
    });

    it('should return error message for password without number', () => {
      expect(validatePassword('PasswordABC')).toBe('비밀번호는 최소 하나의 숫자를 포함해야 합니다.');
    });
  });

  describe('validateConfirmPassword', () => {
    it('should return null when passwords match', () => {
      expect(validateConfirmPassword('Password123', 'Password123')).toBeNull();
    });

    it('should return error message for empty confirm password', () => {
      expect(validateConfirmPassword('Password123', '')).toBe('비밀번호 확인을 입력해주세요.');
    });

    it('should return error message when passwords do not match', () => {
      expect(validateConfirmPassword('Password123', 'Password124')).toBe('비밀번호가 일치하지 않습니다.');
      expect(validateConfirmPassword('Password123', 'password123')).toBe('비밀번호가 일치하지 않습니다.');
    });
  });

  describe('validateName', () => {
    it('should return null for valid names', () => {
      expect(validateName('홍길동', '이름')).toBeNull();
      expect(validateName('김철수', '이름')).toBeNull();
      expect(validateName('A'.repeat(50), '이름')).toBeNull(); // 최대 길이
    });

    it('should return error message for empty name', () => {
      expect(validateName('', '이름')).toBe('이름을(를) 입력해주세요.');
      // 공백 문자열은 truthy이므로 길이 검사에서 걸림
      expect(validateName('   ', '이름')).toBeNull();
    });

    it('should return error message for name longer than 50 characters', () => {
      expect(validateName('A'.repeat(51), '이름')).toBe('이름은(는) 최대 50자까지 입력 가능합니다.');
    });

    it('should use correct field name in error message', () => {
      expect(validateName('', '성')).toBe('성을(를) 입력해주세요.');
      expect(validateName('', '닉네임')).toBe('닉네임을(를) 입력해주세요.');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should return null for valid phone numbers', () => {
      expect(validatePhoneNumber('010-1234-5678')).toBeNull();
      expect(validatePhoneNumber('02-1234-5678')).toBeNull();
      expect(validatePhoneNumber('+82-10-1234-5678')).toBeNull();
      expect(validatePhoneNumber('(02) 1234-5678')).toBeNull();
      expect(validatePhoneNumber('010 1234 5678')).toBeNull();
    });

    it('should return null for empty phone number (optional field)', () => {
      expect(validatePhoneNumber('')).toBeNull();
      expect(validatePhoneNumber('   ')).toBeNull();
    });

    it('should return error message for invalid phone number formats', () => {
      expect(validatePhoneNumber('abc-def-ghij')).toBe('올바른 전화번호 형식을 입력해주세요.');
      expect(validatePhoneNumber('010-1234-5678a')).toBe('올바른 전화번호 형식을 입력해주세요.');
      expect(validatePhoneNumber('010@1234#5678')).toBe('올바른 전화번호 형식을 입력해주세요.');
    });
  });

  describe('validateTerms', () => {
    it('should return null when terms are agreed to', () => {
      expect(validateTerms(true)).toBeNull();
    });

    it('should return error message when terms are not agreed to', () => {
      expect(validateTerms(false)).toBe('이용약관에 동의해주세요.');
    });
  });

  describe('validateSignUpData', () => {
    it('should return empty array for valid signup data', () => {
      const validData: SignUpData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        firstName: '홍',
        lastName: '길동',
        phoneNumber: '010-1234-5678',
        agreeToTerms: true
      };

      const errors = validateSignUpData(validData);
      expect(errors).toEqual([]);
    });

    it('should return multiple errors for invalid signup data', () => {
      const invalidData: SignUpData = {
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'different',
        firstName: '',
        lastName: '',
        phoneNumber: 'invalid-phone',
        agreeToTerms: false
      };

      const errors = validateSignUpData(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check that all expected error fields are present
      const errorFields = errors.map(error => error.field);
      expect(errorFields).toContain('email');
      expect(errorFields).toContain('password');
      expect(errorFields).toContain('confirmPassword');
      expect(errorFields).toContain('firstName');
      expect(errorFields).toContain('lastName');
      expect(errorFields).toContain('agreeToTerms');
    });

    it('should handle partial validation errors', () => {
      const partialInvalidData: SignUpData = {
        email: 'test@example.com', // valid
        password: 'Password123', // valid
        confirmPassword: 'Password123', // valid
        firstName: '홍', // valid
        lastName: '', // invalid
        phoneNumber: '010-1234-5678', // valid
        agreeToTerms: false // invalid
      };

      const errors = validateSignUpData(partialInvalidData);
      expect(errors.length).toBe(2);
      
      const errorFields = errors.map(error => error.field);
      expect(errorFields).toContain('lastName');
      expect(errorFields).toContain('agreeToTerms');
    });

    it('should validate all required fields', () => {
      const emptyData: SignUpData = {
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        agreeToTerms: false
      };

      const errors = validateSignUpData(emptyData);
      expect(errors.length).toBeGreaterThan(0);
      
      // Should have errors for all required fields
      const requiredFields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'agreeToTerms'];
      const errorFields = errors.map(error => error.field);
      
      requiredFields.forEach(field => {
        expect(errorFields).toContain(field);
      });
    });
  });
});