import React, { useState } from 'react';
import { 
  validateAndTransformFormData, 
  safeAddSubscription, 
  normalizeObjectFields,
  SafeSubscriptionData 
} from '../lib/typeValidation';
import { supabase } from '../lib/supabase';

interface SubscriptionFormProps {
  userId: string;
  onSuccess?: (data: SafeSubscriptionData) => void;
  onError?: (error: string) => void;
}

export const SubscriptionFormWithTypeValidation: React.FC<SubscriptionFormProps> = ({
  userId,
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    currency: 'KRW',
    renew_date: '',
    start_date: '',
    payment_date: '',
    payment_card: '',
    url: '',
    category: '',
    icon: '📱',
    icon_image_url: '',
    color: '#3B82F6',
    is_active: true
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // 타입별 값 처리
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // 에러 초기화
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    try {
      // 1. 폼 데이터에 user_id 추가
      const dataWithUserId = {
        ...formData,
        user_id: userId
      };

      // 2. 필드명 정규화 (프론트엔드 -> 데이터베이스)
      const normalizedData = normalizeObjectFields(dataWithUserId, 'toDatabase');

      console.log('📝 원본 폼 데이터:', dataWithUserId);
      console.log('🔄 정규화된 데이터:', normalizedData);

      // 3. 안전한 구독 추가
      const { data, error } = await safeAddSubscription(supabase, normalizedData);

      if (error) {
        setErrors([error]);
        onError?.(error);
        return;
      }

      if (data) {
        console.log('✅ 구독 추가 성공:', data);
        onSuccess?.(data);
        
        // 폼 초기화
        setFormData({
          name: '',
          price: '',
          currency: 'KRW',
          renew_date: '',
          start_date: '',
          payment_date: '',
          payment_card: '',
          url: '',
          category: '',
          icon: '📱',
          icon_image_url: '',
          color: '#3B82F6',
          is_active: true
        });
      }

    } catch (error) {
      console.error('❌ 예상치 못한 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setErrors([errorMessage]);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">새 구독 추가</h2>
      
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-semibold mb-2">오류가 발생했습니다:</h3>
          <ul className="list-disc list-inside text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 서비스명 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            서비스명 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: Netflix, Spotify"
          />
        </div>

        {/* 가격 */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            가격 *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* 통화 */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            통화 *
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="KRW">KRW (원)</option>
            <option value="USD">USD (달러)</option>
            <option value="EUR">EUR (유로)</option>
            <option value="JPY">JPY (엔)</option>
            <option value="CNY">CNY (위안)</option>
          </select>
        </div>

        {/* 갱신일 */}
        <div>
          <label htmlFor="renew_date" className="block text-sm font-medium text-gray-700 mb-1">
            갱신일 *
          </label>
          <input
            type="date"
            id="renew_date"
            name="renew_date"
            value={formData.renew_date}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 시작일 */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
            시작일
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 결제일 */}
        <div>
          <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
            결제일 (1-31)
          </label>
          <input
            type="number"
            id="payment_date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleInputChange}
            min="1"
            max="31"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 15"
          />
        </div>

        {/* 결제 카드 */}
        <div>
          <label htmlFor="payment_card" className="block text-sm font-medium text-gray-700 mb-1">
            결제 카드
          </label>
          <input
            type="text"
            id="payment_card"
            name="payment_card"
            value={formData.payment_card}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 신한카드, 체크카드"
          />
        </div>

        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            서비스 URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            카테고리
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 엔터테인먼트, 생산성"
          />
        </div>

        {/* 아이콘 */}
        <div>
          <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
            아이콘
          </label>
          <input
            type="text"
            id="icon"
            name="icon"
            value={formData.icon}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="📱"
          />
        </div>

        {/* 아이콘 이미지 URL */}
        <div>
          <label htmlFor="icon_image_url" className="block text-sm font-medium text-gray-700 mb-1">
            아이콘 이미지 URL
          </label>
          <input
            type="url"
            id="icon_image_url"
            name="icon_image_url"
            value={formData.icon_image_url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/icon.png"
          />
        </div>

        {/* 색상 */}
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            색상
          </label>
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            className="w-full h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 활성화 여부 */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            활성 구독
          </label>
        </div>

        {/* 제출 버튼 */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? '추가 중...' : '구독 추가'}
          </button>
        </div>
      </form>
    </div>
  );
};