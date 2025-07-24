import React from 'react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { cn, safeFormatCurrency, safeConvertToKRW, isValidNumber } from '../../lib/utils';
import { Calendar, ExternalLink, Edit2, Trash2, AlertTriangle } from 'lucide-react';

interface SubscriptionCardProps {
  subscription: {
    id: number;
    name: string;
    icon: string;
    iconImage?: string;
    price: number;
    currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
    paymentDate?: string;
    url?: string;
    color?: string;
    category?: string;
    isActive?: boolean;
  };
  onEdit: (subscription: any) => void;
  onDelete: (id: number) => void;
  className?: string;
  exchangeRate?: number;
  showConvertedPrice?: boolean;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  className,
  exchangeRate = 1300,
  showConvertedPrice = true
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(subscription);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(subscription.id);
  };

  const handleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subscription.url) {
      window.open(subscription.url, '_blank', 'noopener,noreferrer');
    }
  };

  // 안전한 가격 표시
  const getPriceDisplay = () => {
    const { price, currency } = subscription;
    
    // 가격 검증
    if (!isValidNumber(price)) {
      return {
        originalPrice: '가격 정보 없음',
        convertedPrice: null,
        hasError: true
      };
    }

    // 원본 가격 포맷팅
    const originalPrice = safeFormatCurrency(price, currency, '가격 오류');
    
    // 변환된 가격 계산 (KRW가 아닌 경우에만)
    let convertedPrice = null;
    let hasError = false;
    
    if (currency !== 'KRW' && showConvertedPrice) {
      try {
        const converted = safeConvertToKRW(price, currency, exchangeRate);
        if (isValidNumber(converted) && converted > 0) {
          convertedPrice = safeFormatCurrency(converted, 'KRW', '변환 오류');
        } else {
          hasError = true;
        }
      } catch (error) {
        console.error('Price conversion error:', error);
        hasError = true;
      }
    }

    return {
      originalPrice,
      convertedPrice,
      hasError
    };
  };

  const { originalPrice, convertedPrice, hasError } = getPriceDisplay();

  return (
    <Card className={cn(
      'group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 bg-white/80 backdrop-blur-sm',
      hasError && 'border-red-200 bg-red-50/50',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* 서비스 아이콘 */}
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg overflow-hidden hover:opacity-80 transition-opacity duration-200"
                style={{ backgroundColor: subscription.color || '#3B82F6' }}
                onClick={handleVisit}
              >
                {subscription.iconImage ? (
                  <img 
                    src={subscription.iconImage} 
                    alt={subscription.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  subscription.icon
                )}
              </div>
              {subscription.url && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ExternalLink className="w-3 h-3 text-white" />
                </div>
              )}
              {hasError && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* 서비스 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {subscription.name}
                </h3>
                {subscription.category && (
                  <Badge variant="secondary" className="text-xs">
                    {subscription.category}
                  </Badge>
                )}
                {subscription.isActive === false && (
                  <Badge variant="destructive" className="text-xs">
                    비활성
                  </Badge>
                )}
                {hasError && (
                  <Badge variant="destructive" className="text-xs">
                    계산 오류
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>매월 {subscription.paymentDate || '미설정'}일</span>
                </div>
              </div>
            </div>
          </div>

          {/* 가격 및 액션 버튼 */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={cn(
                "text-2xl font-bold",
                hasError ? "text-red-600" : "text-gray-900"
              )}>
                {originalPrice}
              </p>
              {convertedPrice && (
                <p className={cn(
                  "text-sm",
                  hasError ? "text-red-500" : "text-gray-500"
                )}>
                  {convertedPrice}
                </p>
              )}
              <p className="text-sm text-gray-500">/ 월</p>
              {hasError && (
                <p className="text-xs text-red-600 mt-1">
                  환율 정보 확인 필요
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8 text-gray-600 hover:text-blue-600"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-gray-600 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;