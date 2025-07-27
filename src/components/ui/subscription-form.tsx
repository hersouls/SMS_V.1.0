import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '../../lib/utils';
import { Upload, X, Calendar, DollarSign, Globe } from 'lucide-react';

interface SubscriptionFormProps {
  subscription?: {
    id?: number;
    name: string;
    icon: string;
    iconImage?: string;
    price: number;
    currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
    renewDate: string;
    startDate: string;
    paymentDate?: string;
    paymentCard?: string;
    url?: string;
    color?: string;
    category?: string;
    isActive?: boolean;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  subscription,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    icon: subscription?.icon || '📱',
    icon_image_url: subscription?.iconImage || '',
    price: subscription?.price || 0,
    currency: subscription?.currency || 'KRW',
    renew_date: subscription?.renewDate || '',
    start_date: subscription?.startDate || '',
    payment_date: subscription?.paymentDate || '',
    payment_card: subscription?.paymentCard || '',
    url: subscription?.url || '',
    color: subscription?.color || '#3B82F6',
    category: subscription?.category || '',
    is_active: subscription?.isActive !== false
  });

  const [imagePreview, setImagePreview] = useState<string | null>(subscription?.iconImage || null);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({
          ...prev,
          icon_image_url: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      icon_image_url: ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 클라이언트 사이드 검증
    if (!formData.name.trim()) {
      alert('서비스명을 입력해주세요.');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      alert('올바른 가격을 입력해주세요.');
      return;
    }

    if (!formData.renew_date) {
      alert('갱신일을 선택해주세요.');
      return;
    }

    // 시작일이 비어있으면 오늘 날짜로 설정
    if (!formData.start_date) {
      formData.start_date = new Date().toISOString().split('T')[0];
    }

    // 결제일 검증
    if (formData.payment_date && (parseInt(formData.payment_date) < 1 || parseInt(formData.payment_date) > 31)) {
      alert('결제일은 1일부터 31일 사이여야 합니다.');
      return;
    }

    // URL 검증 (입력된 경우에만)
    if (formData.url && formData.url.trim() && !formData.url.match(/^https?:\/\/.+/)) {
      alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
      return;
    }
    
    // Supabase DB 스키마에 맞게 필드명 변환 (새 스키마)
    const submitData = {
      id: subscription?.id,
      name: formData.name.trim(),
      icon: formData.icon,
      icon_image_url: formData.icon_image_url || null,
      price: parseFloat(formData.price.toString()) || 0,
      currency: formData.currency,
      renew_date: formData.renew_date,
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      payment_date: formData.payment_date ? parseInt(formData.payment_date) : null,
      payment_card: formData.payment_card?.trim() || null,
      url: formData.url?.trim() || null,
      color: formData.color || '#3B82F6',
      category: formData.category?.trim() || null,
      is_active: formData.is_active !== false
    };

    // 데이터 검증 로그
    console.log('=== 폼 데이터 검증 ===');
    console.log('서비스명:', submitData.name, '길이:', submitData.name.length);
    console.log('가격:', submitData.price, '타입:', typeof submitData.price);
    console.log('갱신일:', submitData.renew_date, '타입:', typeof submitData.renew_date);
    console.log('시작일:', submitData.start_date, '타입:', typeof submitData.start_date);
    console.log('결제일:', submitData.payment_date, '타입:', typeof submitData.payment_date);
    console.log('아이콘 이미지:', submitData.icon_image_url ? '있음' : '없음');
    
    console.log('구독 폼 제출 데이터 (검증 완료, DB 스키마 매핑):', submitData);
    console.log('폼 데이터 원본:', formData);
    console.log('제출 시점:', new Date().toISOString());
    onSubmit(submitData);
  };

  const currencyOptions = [
    { value: 'KRW', label: '원화 (₩)' },
    { value: 'USD', label: '달러 ($)' },
    { value: 'EUR', label: '유로 (€)' },
    { value: 'JPY', label: '엔화 (¥)' }
  ];

  const categoryOptions = [
    { value: 'streaming', label: '스트리밍' },
    { value: 'software', label: '소프트웨어' },
    { value: 'cloud', label: '클라우드' },
    { value: 'music', label: '음악' },
    { value: 'gaming', label: '게임' },
    { value: 'productivity', label: '생산성' },
    { value: 'education', label: '교육' },
    { value: 'other', label: '기타' }
  ];

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
    '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {subscription ? '구독 편집' : '새 구독 추가'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">서비스명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="예: Netflix, Spotify"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 아이콘 및 색상 */}
            <div className="space-y-4">
              <Label>아이콘 및 색상</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    className="w-20 text-center text-lg"
                    maxLength={2}
                  />
                  <span className="text-sm text-gray-500">또는</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('icon-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      이미지 업로드
                    </Button>
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {imagePreview && (
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="아이콘 미리보기"
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="text-sm text-gray-500">이미지가 업로드되었습니다</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>색상 선택</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        formData.color === color ? "border-gray-900 scale-110" : "border-gray-300 hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 가격 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">가격 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">월 구독료 *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">통화</Label>
                <Select value={formData.currency} onValueChange={(value: any) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 날짜 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">날짜 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                <Label htmlFor="start_date">시작일</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="renew_date">갱신일 *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="renew_date"
                    type="date"
                    value={formData.renew_date}
                    onChange={(e) => handleInputChange('renew_date', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_date">결제일</Label>
                <Input
                  id="payment_date"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.payment_date}
                  onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  placeholder="1-31"
                />
              </div>
            </div>
          </div>

          {/* 추가 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">추가 정보</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">서비스 URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_card">결제 카드</Label>
                <Input
                  id="payment_card"
                  value={formData.payment_card}
                  onChange={(e) => handleInputChange('payment_card', e.target.value)}
                  placeholder="예: 신한카드, 체크카드"
                />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : (subscription ? '수정' : '추가')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubscriptionForm;