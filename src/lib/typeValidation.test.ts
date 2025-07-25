import { 
  validateAndTransformFormData, 
  transformDatabaseToFrontend,
  normalizeObjectFields,
  FieldMapper,
  SafeSubscriptionData,
  DatabaseSubscriptionData
} from './typeValidation';

// 테스트용 Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'test-id', name: 'Test Service' },
          error: null
        }))
      }))
    }))
  }))
};

describe('Type Validation System', () => {
  describe('validateAndTransformFormData', () => {
    it('should validate and transform valid form data', () => {
      const validFormData = {
        user_id: 'user123',
        name: 'Netflix',
        price: 15000,
        currency: 'KRW',
        renew_date: '2024-01-15',
        payment_date: 15,
        payment_card: '신한카드',
        url: 'https://netflix.com',
        category: '엔터테인먼트',
        icon: '📺',
        icon_image_url: 'https://example.com/icon.png',
        color: '#E50914',
        is_active: true
      };

      const result = validateAndTransformFormData(validFormData);

      expect(result).toEqual({
        user_id: 'user123',
        name: 'Netflix',
        price: 15000,
        currency: 'KRW',
        renew_date: '2024-01-15',
        start_date: null,
        payment_date: 15,
        payment_card: '신한카드',
        url: 'https://netflix.com',
        category: '엔터테인먼트',
        icon: '📺',
        icon_image_url: 'https://example.com/icon.png',
        color: '#E50914',
        is_active: true
      });
    });

    it('should handle different image field names', () => {
      const formDataWithIconImage = {
        user_id: 'user123',
        name: 'Spotify',
        price: 12000,
        currency: 'KRW',
        renew_date: '2024-01-20',
        iconImage: 'https://example.com/spotify-icon.png'
      };

      const result = validateAndTransformFormData(formDataWithIconImage);

      expect(result.icon_image_url).toBe('https://example.com/spotify-icon.png');
    });

    it('should handle next_billing_date field name', () => {
      const formDataWithNextBilling = {
        user_id: 'user123',
        name: 'Disney+',
        price: 9000,
        currency: 'KRW',
        next_billing_date: '2024-01-25'
      };

      const result = validateAndTransformFormData(formDataWithNextBilling);

      expect(result.renew_date).toBe('2024-01-25');
    });

    it('should throw error for missing required fields', () => {
      const invalidFormData = {
        user_id: '',
        name: '',
        price: -100
      };

      expect(() => validateAndTransformFormData(invalidFormData)).toThrow('사용자 ID가 필요합니다.');
    });

    it('should throw error for invalid currency', () => {
      const invalidFormData = {
        user_id: 'user123',
        name: 'Test',
        price: 1000,
        currency: 'INVALID',
        renew_date: '2024-01-15'
      };

      expect(() => validateAndTransformFormData(invalidFormData)).toThrow('지원하지 않는 통화입니다: INVALID');
    });

    it('should throw error for invalid payment date', () => {
      const invalidFormData = {
        user_id: 'user123',
        name: 'Test',
        price: 1000,
        currency: 'KRW',
        renew_date: '2024-01-15',
        payment_date: 32
      };

      expect(() => validateAndTransformFormData(invalidFormData)).toThrow('결제일은 1일부터 31일 사이여야 합니다.');
    });

    it('should handle string price conversion', () => {
      const formDataWithStringPrice = {
        user_id: 'user123',
        name: 'Test',
        price: '15000',
        currency: 'KRW',
        renew_date: '2024-01-15'
      };

      const result = validateAndTransformFormData(formDataWithStringPrice);

      expect(result.price).toBe(15000);
    });
  });

  describe('transformDatabaseToFrontend', () => {
    it('should transform database data to frontend format', () => {
      const dbData: DatabaseSubscriptionData = {
        id: 'test-uuid',
        user_id: 'user123',
        name: 'Netflix',
        price: 15000,
        currency: 'KRW',
        renew_date: '2024-01-15',
        start_date: '2024-01-01',
        payment_date: 15,
        payment_card: '신한카드',
        url: 'https://netflix.com',
        category: '엔터테인먼트',
        icon: '📺',
        icon_image_url: 'https://example.com/icon.png',
        color: '#E50914',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const result = transformDatabaseToFrontend(dbData);

      expect(result).toEqual({
        id: undefined, // UUID를 number로 변환할 수 없음
        user_id: 'user123',
        name: 'Netflix',
        price: 15000,
        currency: 'KRW',
        renew_date: '2024-01-15',
        start_date: '2024-01-01',
        payment_date: 15,
        payment_card: '신한카드',
        url: 'https://netflix.com',
        category: '엔터테인먼트',
        icon: '📺',
        icon_image_url: 'https://example.com/icon.png',
        color: '#E50914',
        is_active: true
      });
    });
  });

  describe('normalizeObjectFields', () => {
    it('should normalize field names for database', () => {
      const frontendData = {
        renewDate: '2024-01-15',
        iconImage: 'https://example.com/icon.png',
        paymentDate: 15,
        name: 'Test Service'
      };

      const result = normalizeObjectFields(frontendData, 'toDatabase');

      expect(result).toEqual({
        renew_date: '2024-01-15',
        icon_image_url: 'https://example.com/icon.png',
        payment_date: 15,
        name: 'Test Service'
      });
    });

    it('should normalize field names for frontend', () => {
      const databaseData = {
        renew_date: '2024-01-15',
        icon_image_url: 'https://example.com/icon.png',
        payment_date: 15,
        name: 'Test Service'
      };

      const result = normalizeObjectFields(databaseData, 'toFrontend');

      expect(result).toEqual({
        renew_date: '2024-01-15',
        icon_image_url: 'https://example.com/icon.png',
        payment_date: 15,
        name: 'Test Service'
      });
    });
  });

  describe('FieldMapper', () => {
    it('should have correct database mappings', () => {
      expect(FieldMapper.toDatabase.renew_date).toBe('renew_date');
      expect(FieldMapper.toDatabase.next_billing_date).toBe('renew_date');
      expect(FieldMapper.toDatabase.renewDate).toBe('renew_date');
      expect(FieldMapper.toDatabase.iconImage).toBe('icon_image_url');
      expect(FieldMapper.toDatabase.iconImageUrl).toBe('icon_image_url');
      expect(FieldMapper.toDatabase.paymentDate).toBe('payment_date');
    });

    it('should have correct frontend mappings', () => {
      expect(FieldMapper.toFrontend.renew_date).toBe('renew_date');
      expect(FieldMapper.toFrontend.next_billing_date).toBe('renew_date');
      expect(FieldMapper.toFrontend.icon_image_url).toBe('icon_image_url');
      expect(FieldMapper.toFrontend.iconImage).toBe('icon_image_url');
    });
  });

  describe('URL validation', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://example.com/path?param=value'
      ];

      validUrls.forEach(url => {
        const formData = {
          user_id: 'user123',
          name: 'Test',
          price: 1000,
          currency: 'KRW',
          renew_date: '2024-01-15',
          url
        };

        expect(() => validateAndTransformFormData(formData)).not.toThrow();
      });
    });

    it('should handle URLs without protocol', () => {
      const formData = {
        user_id: 'user123',
        name: 'Test',
        price: 1000,
        currency: 'KRW',
        renew_date: '2024-01-15',
        url: 'example.com'
      };

      expect(() => validateAndTransformFormData(formData)).not.toThrow();
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'invalid-protocol://example.com'
      ];

      invalidUrls.forEach(url => {
        const formData = {
          user_id: 'user123',
          name: 'Test',
          price: 1000,
          currency: 'KRW',
          renew_date: '2024-01-15',
          url
        };

        expect(() => validateAndTransformFormData(formData)).toThrow('올바른 URL을 입력해주세요.');
      });
    });
  });

  describe('Date validation', () => {
    it('should validate correct date formats', () => {
      const validDates = [
        '2024-01-15',
        '2024-12-31',
        '2024-02-29' // 윤년
      ];

      validDates.forEach(date => {
        const formData = {
          user_id: 'user123',
          name: 'Test',
          price: 1000,
          currency: 'KRW',
          renew_date: date
        };

        expect(() => validateAndTransformFormData(formData)).not.toThrow();
      });
    });

    it('should handle different date formats', () => {
      const formData = {
        user_id: 'user123',
        name: 'Test',
        price: 1000,
        currency: 'KRW',
        renew_date: '2024/01/15'
      };

      const result = validateAndTransformFormData(formData);
      expect(result.renew_date).toBe('2024-01-15');
    });

    it('should reject invalid dates', () => {
      const invalidDates = [
        '2024-13-01', // 잘못된 월
        '2024-02-30', // 2월에 30일 없음
        'invalid-date',
        '2024-01-32'  // 잘못된 일
      ];

      invalidDates.forEach(date => {
        const formData = {
          user_id: 'user123',
          name: 'Test',
          price: 1000,
          currency: 'KRW',
          renew_date: date
        };

        expect(() => validateAndTransformFormData(formData)).toThrow('올바른 갱신 날짜를 입력해주세요.');
      });
    });
  });
});