// Utility functions for the subscription manager app

/**
 * Formats currency values based on the currency type
 */
export const formatCurrency = (amount: number, currency: 'USD' | 'KRW' | 'EUR' | 'JPY'): string => {
  const formatMap = {
    USD: (amount: number) => `$${amount}`,
    KRW: (amount: number) => `₩${amount.toLocaleString()}`,
    EUR: (amount: number) => `€${amount}`,
    JPY: (amount: number) => `¥${amount.toLocaleString()}`
  };

  return formatMap[currency](amount);
};

/**
 * Formats date strings for Korean locale
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ko-KR');
};

/**
 * Splits full name into first and last name
 */
export const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const nameParts = fullName.split(' ');
  return {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || ''
  };
};

/**
 * Generates a unique ID based on timestamp
 */
export const generateId = (): number => {
  return Date.now();
};

/**
 * Type guard for checking if error is a Supabase error
 */
export const isSupabaseError = (error: any): error is { code: string; message: string } => {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
};

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  SUBSCRIPTION_LOAD_FAILED: '구독 정보를 불러오지 못했습니다.',
  NOTIFICATION_SAVE_FAILED: '알림 저장에 실패했습니다.',
  PROFILE_CREATION_FAILED: '프로필 생성에 실패했습니다.',
  EXCHANGE_RATE_FAILED: '환율 정보를 가져오는데 실패했습니다.',
  GENERIC_ERROR: '예상치 못한 오류가 발생했습니다.'
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SUBSCRIPTION_LOADED: '구독 정보를 불러왔습니다.',
  PROFILE_CREATED: '프로필이 생성되었습니다.',
  PROFILE_UPDATED: '프로필이 업데이트되었습니다.'
} as const;