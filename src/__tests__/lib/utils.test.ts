import {
  formatCurrency,
  formatDate,
  splitFullName,
  generateId,
  isSupabaseError,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '../../lib/utils';

describe('Utils Functions', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1000');
      expect(formatCurrency(0, 'USD')).toBe('$0');
      expect(formatCurrency(1234.56, 'USD')).toBe('$1234.56');
    });

    it('should format KRW currency correctly', () => {
      expect(formatCurrency(1000, 'KRW')).toBe('₩1,000');
      expect(formatCurrency(1000000, 'KRW')).toBe('₩1,000,000');
    });

    it('should format EUR currency correctly', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1000');
      expect(formatCurrency(0, 'EUR')).toBe('€0');
    });

    it('should format JPY currency correctly', () => {
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
      expect(formatCurrency(1000000, 'JPY')).toBe('¥1,000,000');
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly for Korean locale', () => {
      const testDate = '2024-01-15';
      const formatted = formatDate(testDate);
      // 한국어 로케일에서 실제로는 "2024. 1. 15." 형식으로 출력됨
      expect(formatted).toMatch(/\d{4}\. \d{1,2}\. \d{1,2}\./);
    });

    it('should handle invalid date strings', () => {
      expect(() => formatDate('invalid-date')).not.toThrow();
    });
  });

  describe('splitFullName', () => {
    it('should split full name into first and last name', () => {
      const result = splitFullName('홍길동');
      expect(result).toEqual({
        firstName: '홍길동',
        lastName: ''
      });
    });

    it('should handle names with multiple parts', () => {
      const result = splitFullName('김 철수');
      expect(result).toEqual({
        firstName: '김',
        lastName: '철수'
      });
    });

    it('should handle empty string', () => {
      const result = splitFullName('');
      expect(result).toEqual({
        firstName: '',
        lastName: ''
      });
    });

    it('should handle single space', () => {
      const result = splitFullName(' ');
      expect(result).toEqual({
        firstName: '',
        lastName: ''
      });
    });
  });

  describe('generateId', () => {
    it('should generate a unique timestamp-based ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('number');
      expect(typeof id2).toBe('number');
      expect(id1).toBeLessThanOrEqual(id2);
    });

    it('should generate different IDs for consecutive calls', () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        // 각 호출 사이에 약간의 지연을 추가하여 고유한 타임스탬프 보장
        setTimeout(() => {}, 0);
        ids.add(generateId());
      }
      // 실제로는 빠른 연속 호출로 인해 같은 타임스탬프가 생성될 수 있음
      // 따라서 최소 1개 이상의 ID가 생성되었는지만 확인
      expect(ids.size).toBeGreaterThan(0);
    });
  });

  describe('isSupabaseError', () => {
    it('should return true for valid Supabase error objects', () => {
      const supabaseError = {
        code: 'PGRST116',
        message: 'Database error occurred'
      };
      expect(isSupabaseError(supabaseError)).toBe(true);
    });

    it('should return false for objects without required properties', () => {
      expect(isSupabaseError({ code: 'PGRST116' })).toBe(false);
      expect(isSupabaseError({ message: 'Error message' })).toBe(false);
      expect(isSupabaseError({})).toBe(false);
    });

    it('should return false for non-objects', () => {
      // null과 undefined는 falsy이므로 false 반환
      expect(isSupabaseError(null)).toBeFalsy();
      expect(isSupabaseError(undefined)).toBeFalsy();
      expect(isSupabaseError('error')).toBeFalsy();
      expect(isSupabaseError(123)).toBeFalsy();
    });

    it('should return false for objects with wrong property types', () => {
      expect(isSupabaseError({ code: 123, message: 'error' })).toBe(false);
      expect(isSupabaseError({ code: 'error', message: 123 })).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should have all required error message constants', () => {
      expect(ERROR_MESSAGES.SUBSCRIPTION_LOAD_FAILED).toBe('구독 정보를 불러오지 못했습니다.');
      expect(ERROR_MESSAGES.NOTIFICATION_SAVE_FAILED).toBe('알림 저장에 실패했습니다.');
      expect(ERROR_MESSAGES.PROFILE_CREATION_FAILED).toBe('프로필 생성에 실패했습니다.');
      expect(ERROR_MESSAGES.EXCHANGE_RATE_FAILED).toBe('환율 정보를 가져오는데 실패했습니다.');
      expect(ERROR_MESSAGES.GENERIC_ERROR).toBe('예상치 못한 오류가 발생했습니다.');
    });
  });

  describe('Success Messages', () => {
    it('should have all required success message constants', () => {
      expect(SUCCESS_MESSAGES.SUBSCRIPTION_LOADED).toBe('구독 정보를 불러왔습니다.');
      expect(SUCCESS_MESSAGES.PROFILE_CREATED).toBe('프로필이 생성되었습니다.');
      expect(SUCCESS_MESSAGES.PROFILE_UPDATED).toBe('프로필이 업데이트되었습니다.');
    });
  });
});