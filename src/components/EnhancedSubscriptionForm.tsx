import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubscriptionFormData } from '../types/subscription';
import { validateSubscriptionForm, sanitizeSubscriptionData } from '../lib/validation';

interface EnhancedSubscriptionFormProps {
  initialData?: Partial<SubscriptionFormData>;
  onSubmit: (data: SubscriptionFormData) => Promise<boolean>;
  onCancel: () => void;
  existingSubscriptions?: Array<{ id: string; name: string }>;
  isEditing?: boolean;
  editingId?: string;
}

interface FieldValidation {
  isValid: boolean;
  errorMessage: string;
  isTouched: boolean;
}

interface FormState {
  isSubmitting: boolean;
  isValidating: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
}

export const EnhancedSubscriptionForm: React.FC<EnhancedSubscriptionFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  existingSubscriptions = [],
  isEditing = false,
  editingId
}) => {
  const [formData, setFormData] = useState<Partial<SubscriptionFormData>>({
    name: '',
    price: 0,
    currency: 'KRW',
    renew_date: '',
    start_date: '',
    payment_date: undefined,
    payment_card: '',
    url: '',
    color: '#3B82F6',
    category: '',
    is_active: true,
    icon: '📱',
    ...initialData
  });

  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isValidating: false,
    errors: {},
    touched: {},
    isDirty: false
  });

  const [fieldValidations, setFieldValidations] = useState<Record<string, FieldValidation>>({});

  // 실시간 필드 검증
  const validateField = useCallback((field: string, value: any): FieldValidation => {
    let isValid = true;
    let errorMessage = '';

    try {
      switch (field) {
        case 'name':
          if (!value || value.toString().trim() === '') {
            isValid = false;
            errorMessage = '서비스명을 입력해주세요';
          } else if (value.toString().trim().length > 50) {
            isValid = false;
            errorMessage = '서비스명은 50자 이하여야 합니다';
          } else {
            // 중복 검사
            const normalizedName = value.toString().toLowerCase().trim();
            const duplicate = existingSubscriptions.find(sub => 
              sub.name.toLowerCase().trim() === normalizedName && 
              sub.id !== editingId
            );
            if (duplicate) {
              isValid = false;
              errorMessage = `"${value}" 구독이 이미 존재합니다`;
            }
          }
          break;

        case 'price':
          const cleanPrice = String(value).replace(/[^0-9.]/g, '');
          const numericPrice = parseFloat(cleanPrice);
          if (isNaN(numericPrice) || numericPrice <= 0) {
            isValid = false;
            errorMessage = '올바른 가격을 입력해주세요';
          }
          break;

        case 'renew_date':
          if (!value) {
            isValid = false;
            errorMessage = '갱신일을 선택해주세요';
          } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            isValid = false;
            errorMessage = '올바른 날짜 형식을 선택해주세요 (YYYY-MM-DD)';
          } else {
            const selectedDate = new Date(value);
            const today = new Date();
            if (selectedDate < today) {
              isValid = false;
              errorMessage = '갱신일은 오늘 이후로 설정해주세요';
            }
          }
          break;

        case 'payment_date':
          if (value !== undefined && value !== '') {
            const numericDay = parseInt(String(value).replace(/[^0-9]/g, ''));
            if (isNaN(numericDay) || numericDay < 1 || numericDay > 31) {
              isValid = false;
              errorMessage = '결제일은 1일부터 31일 사이여야 합니다';
            } else if (formData.renew_date) {
              // 월별 최대 일수 검증
              const renewDate = new Date(formData.renew_date);
              const maxDaysInMonth = new Date(renewDate.getFullYear(), renewDate.getMonth() + 1, 0).getDate();
              if (numericDay > maxDaysInMonth) {
                isValid = false;
                errorMessage = `해당 월의 최대 일수는 ${maxDaysInMonth}일입니다`;
              }
            }
          }
          break;

        case 'url':
          if (value && value.toString().trim() !== '') {
            try {
              let url = value.toString().trim();
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`;
              }
              new URL(url);
            } catch {
              isValid = false;
              errorMessage = '올바른 URL 형식을 입력해주세요';
            }
          }
          break;
      }
    } catch (error) {
      isValid = false;
      errorMessage = '검증 중 오류가 발생했습니다';
    }

    return { isValid, errorMessage, isTouched: true };
  }, [existingSubscriptions, editingId, formData.renew_date]);

  // 필드 업데이트 및 검증
  const updateField = useCallback((field: keyof SubscriptionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormState(prev => ({ 
      ...prev, 
      isDirty: true,
      touched: { ...prev.touched, [field]: true }
    }));

    // 실시간 검증
    const validation = validateField(field, value);
    setFieldValidations(prev => ({
      ...prev,
      [field]: validation
    }));

    // 전체 오류 상태 업데이트
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: validation.isValid ? '' : validation.errorMessage
      }
    }));
  }, [validateField]);

  // 전체 폼 검증
  const validateAllFields = useCallback((): boolean => {
    const requiredFields = [
      { field: 'name', label: '서비스명', value: formData.name?.trim() },
      { field: 'price', label: '가격', value: formData.price },
      { field: 'currency', label: '통화', value: formData.currency },
      { field: 'renew_date', label: '갱신일', value: formData.renew_date }
    ];

    const newErrors: Record<string, string> = {};
    let isValid = true;

    // 필수 필드 검증
    requiredFields.forEach(({ field, label, value }) => {
      if (!value || value === '') {
        newErrors[field] = `${label}을(를) 입력해주세요`;
        isValid = false;
      }
    });

    // 개별 필드 검증
    Object.keys(formData).forEach(field => {
      const validation = validateField(field, formData[field as keyof SubscriptionFormData]);
      if (!validation.isValid) {
        newErrors[field] = validation.errorMessage;
        isValid = false;
      }
    });

    setFormState(prev => ({ ...prev, errors: newErrors }));
    return isValid;
  }, [formData, validateField]);

  // 폼 제출
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formState.isSubmitting) return; // 중복 제출 방지
    
    setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));
    
    try {
      // 전체 검증
      if (!validateAllFields()) {
        throw new Error('입력 정보를 확인해주세요');
      }

      // 데이터 정제
      const sanitizedData = sanitizeSubscriptionData(formData);
      
      // 제출
      const success = await onSubmit(sanitizedData as SubscriptionFormData);
      
      if (success) {
        // 성공 시 폼 초기화
        setFormData({
          name: '',
          price: 0,
          currency: 'KRW',
          renew_date: '',
          start_date: '',
          payment_date: undefined,
          payment_card: '',
          url: '',
          color: '#3B82F6',
          category: '',
          is_active: true,
          icon: '📱'
        });
        setFormState({
          isSubmitting: false,
          isValidating: false,
          errors: {},
          touched: {},
          isDirty: false
        });
        setFieldValidations({});
      }
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        errors: { submit: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' }
      }));
    }
  }, [formData, formState.isSubmitting, validateAllFields, onSubmit]);

  // 가격 입력 처리 (통화별)
  const handlePriceChange = useCallback((value: string) => {
    let numericValue = value.replace(/[^0-9.]/g, '');
    
    // 한국원인 경우 천 단위 구분자 추가
    if (formData.currency === 'KRW') {
      const number = parseFloat(numericValue);
      if (!isNaN(number)) {
        numericValue = number.toLocaleString('ko-KR');
      }
    }
    
    updateField('price', numericValue);
  }, [formData.currency, updateField]);

  // 중복 검사 제안
  const getDuplicateSuggestions = useMemo(() => {
    if (!formData.name) return [];
    
    const baseName = formData.name.trim();
    return [
      `${baseName} (개인용)`,
      `${baseName} Premium`,
      `${baseName} Family`,
      `${baseName} Pro`,
      `${baseName} Business`
    ];
  }, [formData.name]);

  // 필드별 오류 상태
  const getFieldError = (field: string): string => {
    return formState.errors[field] || fieldValidations[field]?.errorMessage || '';
  };

  const isFieldValid = (field: string): boolean => {
    return !getFieldError(field) && formState.touched[field];
  };

  const isFieldInvalid = (field: string): boolean => {
    return !!getFieldError(field) && formState.touched[field];
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {isEditing ? '구독 수정' : '새 구독 추가'}
        </h3>
        
        {/* 전체 오류 표시 */}
        {formState.errors.submit && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  제출 오류
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {formState.errors.submit}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 서비스명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              서비스명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                isFieldInvalid('name') ? 'border-red-500 bg-red-50' : 
                isFieldValid('name') ? 'border-green-500 bg-green-50' : 'border-gray-300'
              }`}
              placeholder="예: Netflix, Spotify"
              required
            />
            {isFieldInvalid('name') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {getFieldError('name')}
              </p>
            )}
            
            {/* 중복 제안 */}
            {isFieldInvalid('name') && getDuplicateSuggestions.length > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700 mb-2">추천 이름:</p>
                <div className="flex flex-wrap gap-2">
                  {getDuplicateSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => updateField('name', suggestion)}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded border border-yellow-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 가격 및 통화 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                가격 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-2 text-gray-500">
                  {formData.currency === 'KRW' ? '₩' : 
                   formData.currency === 'USD' ? '$' : 
                   formData.currency === 'EUR' ? '€' : '¥'}
                </span>
                <input
                  type="text"
                  value={formData.price || ''}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className={`block w-full border rounded-md shadow-sm pl-8 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isFieldInvalid('price') ? 'border-red-500 bg-red-50' : 
                    isFieldValid('price') ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                  placeholder={formData.currency === 'KRW' ? '15,000' : '15.99'}
                  required
                />
              </div>
              {isFieldInvalid('price') && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {getFieldError('price')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                통화 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency || 'KRW'}
                onChange={(e) => updateField('currency', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD (달러)</option>
                <option value="EUR">EUR (유로)</option>
                <option value="JPY">JPY (엔)</option>
              </select>
            </div>
          </div>

          {/* 날짜 필드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                갱신일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.renew_date || ''}
                onChange={(e) => updateField('renew_date', e.target.value)}
                className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isFieldInvalid('renew_date') ? 'border-red-500 bg-red-50' : 
                  isFieldValid('renew_date') ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {isFieldInvalid('renew_date') && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {getFieldError('renew_date')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                결제일
              </label>
              <input
                type="number"
                value={formData.payment_date || ''}
                onChange={(e) => updateField('payment_date', parseInt(e.target.value) || undefined)}
                className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isFieldInvalid('payment_date') ? 'border-red-500 bg-red-50' : 
                  isFieldValid('payment_date') ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
                min="1"
                max="31"
                placeholder="1-31"
              />
              {isFieldInvalid('payment_date') && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {getFieldError('payment_date')}
                </p>
              )}
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                시작일
              </label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => updateField('start_date', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                결제 카드
              </label>
              <input
                type="text"
                value={formData.payment_card || ''}
                onChange={(e) => updateField('payment_card', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 신한카드, 체크카드"
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              서비스 URL
            </label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => updateField('url', e.target.value)}
              className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                isFieldInvalid('url') ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
            />
            {isFieldInvalid('url') && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {getFieldError('url')}
              </p>
            )}
          </div>

          {/* 카테고리 및 색상 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                카테고리
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => updateField('category', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">카테고리 선택</option>
                <option value="streaming">스트리밍</option>
                <option value="music">음악</option>
                <option value="software">소프트웨어</option>
                <option value="cloud">클라우드</option>
                <option value="gaming">게임</option>
                <option value="education">교육</option>
                <option value="fitness">피트니스</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                색상
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => updateField('color', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => updateField('color', e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active !== false}
              onChange={(e) => updateField('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              활성 구독
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={formState.isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                formState.isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </div>
              ) : (
                isEditing ? '수정' : '추가'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};