// 📁 src/lib/typeValidation.ts

export interface SafeSubscriptionData {
  id?: number;
  user_id: string;
  name: string;
  price: number;
  currency: 'USD' | 'KRW' | 'EUR' | 'JPY' | 'CNY';
  renew_date: string; // YYYY-MM-DD 형식
  start_date?: string | null;
  payment_date?: number | null; // 1-31
  payment_card?: string | null;
  url?: string | null;
  category?: string | null;
  icon?: string | null;
  icon_image_url?: string | null;
  color?: string;
  is_active?: boolean;
}

export interface DatabaseSubscriptionData {
  id: string; // UUID로 변경
  user_id: string;
  name: string;
  price: number;
  currency: string;
  renew_date: string; // renew_date로 통일
  start_date?: string;
  payment_date?: number;
  payment_card?: string;
  url?: string;
  category?: string;
  icon?: string;
  icon_image_url?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 폼 데이터를 안전한 구독 데이터로 변환
 */
export function validateAndTransformFormData(formData: any): SafeSubscriptionData {
  // 필수 필드 검증
  if (!formData.name || typeof formData.name !== 'string') {
    throw new Error('구독 이름이 필요합니다.');
  }
  
  if (!formData.user_id || typeof formData.user_id !== 'string') {
    throw new Error('사용자 ID가 필요합니다.');
  }

  // 가격 검증 및 변환
  let price: number;
  if (typeof formData.price === 'string') {
    price = parseFloat(formData.price);
  } else if (typeof formData.price === 'number') {
    price = formData.price;
  } else {
    throw new Error('올바른 가격을 입력해주세요.');
  }

  if (isNaN(price) || price <= 0) {
    throw new Error('가격은 0보다 큰 값이어야 합니다.');
  }

  // 통화 검증
  const validCurrencies = ['USD', 'KRW', 'EUR', 'JPY', 'CNY'];
  const currency = String(formData.currency || 'USD').toUpperCase();
  if (!validCurrencies.includes(currency)) {
    throw new Error(`지원하지 않는 통화입니다: ${currency}`);
  }

  // 날짜 검증 - renew_date와 next_billing_date 모두 처리
  const renewDate = validateDate(formData.renew_date || formData.next_billing_date || formData.renewDate);
  if (!renewDate) {
    throw new Error('올바른 갱신 날짜를 입력해주세요.');
  }

  // 결제일 검증
  let paymentDate: number | null = null;
  if (formData.payment_date !== undefined && formData.payment_date !== null) {
    paymentDate = parseInt(String(formData.payment_date));
    if (isNaN(paymentDate) || paymentDate < 1 || paymentDate > 31) {
      throw new Error('결제일은 1일부터 31일 사이여야 합니다.');
    }
  }

  // URL 검증
  let url: string | null = null;
  if (formData.url) {
    url = String(formData.url).trim();
    if (url && !isValidUrl(url)) {
      throw new Error('올바른 URL을 입력해주세요.');
    }
  }

  return {
    user_id: formData.user_id,
    name: String(formData.name).trim(),
    price,
    currency: currency as any,
    renew_date: renewDate,
    start_date: validateDate(formData.start_date) || null,
    payment_date: paymentDate,
    payment_card: formData.payment_card ? String(formData.payment_card).trim() : null,
    url,
    category: formData.category ? String(formData.category).trim() : null,
    icon: formData.icon ? String(formData.icon) : null,
    icon_image_url: getImageUrl(formData), // 다양한 이미지 필드 처리
    color: String(formData.color || '#3B82F6'),
    is_active: Boolean(formData.is_active !== false)
  };
}

/**
 * 다양한 이미지 필드 처리
 */
function getImageUrl(formData: any): string | null {
  // 여러 가능한 이미지 필드명을 확인
  const imageFields = [
    'icon_image_url',
    'iconImageUrl', 
    'iconImage',
    'image_url',
    'imageUrl',
    'photo_url',
    'photoUrl'
  ];

  for (const field of imageFields) {
    if (formData[field] && typeof formData[field] === 'string') {
      return formData[field].trim();
    }
  }
  
  return null;
}

/**
 * 날짜 문자열 검증 및 정규화
 */
function validateDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  const dateStr = String(dateValue);
  
  // YYYY-MM-DD 형식 확인
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    // 다른 형식을 YYYY-MM-DD로 변환 시도
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0];
  }
  
  // 유효한 날짜인지 확인
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return dateStr;
}

/**
 * URL 유효성 검증
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    // http:// 또는 https://가 없는 경우 추가해서 재시도
    try {
      new URL('https://' + urlString);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 데이터베이스 응답을 프론트엔드 형식으로 변환
 */
export function transformDatabaseToFrontend(dbData: DatabaseSubscriptionData): SafeSubscriptionData {
  return {
    id: parseInt(dbData.id) || undefined, // UUID를 number로 변환 시도
    user_id: dbData.user_id,
    name: dbData.name,
    price: dbData.price,
    currency: dbData.currency as any,
    renew_date: dbData.renew_date, // renew_date로 통일
    start_date: dbData.start_date || null,
    payment_date: dbData.payment_date || null,
    url: dbData.url || null,
    category: dbData.category || null,
    icon: dbData.icon || null,
    icon_image_url: dbData.icon_image_url || null,
    color: dbData.color || '#3B82F6',
    is_active: dbData.is_active
  };
}

/**
 * 에러 타입 가드
 */
export function isValidationError(error: any): error is Error {
  return error instanceof Error && error.message.includes('검증') || 
         error.message.includes('입력') || 
         error.message.includes('필요');
}

/**
 * 안전한 구독 추가 함수
 */
export async function safeAddSubscription(
  supabase: any, 
  formData: any
): Promise<{ data: any; error: string | null }> {
  try {
    // 1. 데이터 검증 및 변환
    const validatedData = validateAndTransformFormData(formData);
    
    // 2. 데이터베이스 형식으로 변환
    const dbData = {
      user_id: validatedData.user_id,
      name: validatedData.name,
      price: validatedData.price,
      currency: validatedData.currency,
      renew_date: validatedData.renew_date,
      start_date: validatedData.start_date,
      payment_date: validatedData.payment_date,
      payment_card: validatedData.payment_card,
      url: validatedData.url,
      category: validatedData.category,
      icon: validatedData.icon,
      icon_image_url: validatedData.icon_image_url,
      color: validatedData.color,
      is_active: validatedData.is_active
    };

    console.log('✅ 검증된 데이터:', dbData);

    // 3. Supabase에 직접 INSERT
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase 에러:', error);
      return { data: null, error: translateSupabaseError(error) };
    }

    return { data, error: null };

  } catch (validationError) {
    console.error('❌ 검증 에러:', validationError);
    return { 
      data: null, 
      error: isValidationError(validationError) 
        ? validationError.message 
        : '데이터 검증 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * Supabase 에러 메시지 번역
 */
function translateSupabaseError(error: any): string {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('duplicate') || message.includes('unique')) {
    return '이미 존재하는 구독 이름입니다. 다른 이름을 사용해주세요.';
  }
  
  if (message.includes('foreign key')) {
    return '사용자 정보가 올바르지 않습니다. 다시 로그인해주세요.';
  }
  
  if (message.includes('check constraint')) {
    return '입력 데이터가 유효하지 않습니다. 다시 확인해주세요.';
  }
  
  if (message.includes('not-null')) {
    return '필수 정보가 누락되었습니다.';
  }
  
  return '구독 추가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * 타입 안전한 필드 매핑 유틸리티
 */
export const FieldMapper = {
  // 프론트엔드 -> 데이터베이스 매핑
  toDatabase: {
    renew_date: 'renew_date',
    next_billing_date: 'renew_date',
    renewDate: 'renew_date',
    icon_image_url: 'icon_image_url',
    iconImage: 'icon_image_url',
    iconImageUrl: 'icon_image_url',
    payment_date: 'payment_date',
    paymentDate: 'payment_date'
  },

  // 데이터베이스 -> 프론트엔드 매핑
  toFrontend: {
    renew_date: 'renew_date',
    next_billing_date: 'renew_date',
    icon_image_url: 'icon_image_url',
    iconImage: 'icon_image_url'
  }
};

/**
 * 필드명 정규화
 */
export function normalizeFieldName(fieldName: string, direction: 'toDatabase' | 'toFrontend' = 'toDatabase'): string {
  const mapper = FieldMapper[direction];
  return mapper[fieldName as keyof typeof mapper] || fieldName;
}

/**
 * 객체의 모든 필드명을 정규화
 */
export function normalizeObjectFields<T extends Record<string, any>>(
  obj: T, 
  direction: 'toDatabase' | 'toFrontend' = 'toDatabase'
): Record<string, any> {
  const normalized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normalizeFieldName(key, direction);
    normalized[normalizedKey] = value;
  }
  
  return normalized;
}