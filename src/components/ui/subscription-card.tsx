import React from 'react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { cn, safeFormatCurrency, safeConvertToKRW, isValidNumber } from '../../lib/utils';
import { Calendar, ExternalLink, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import SafeImage from './safe-image';

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
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 서비스 아이콘 */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-white shadow-lg overflow-hidden hover:opacity-80 transition-opacity duration-200"
                style={{ backgroundColor: subscription.color || '#3B82F6' }}
                onClick={handleVisit}
              >
                {subscription.iconImage ? (
                  <SafeImage
                    src={subscription.iconImage}
                    alt={subscription.name}
                    fallback={<span className="text-white text-lg">{subscription.icon}</span>}
                    placeholder="bg-gray-100"
                  />
                ) : (
                  subscription.icon
                )}
              </div>
              {subscription.url && (
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ExternalLink className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              )}
              {hasError && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              )}
            </div>

            {/* 서비스 정보 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
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
              
              {/* 모바일에서는 전체 이름을 아래쪽에 표시 */}
              <p className="text-xs text-gray-400 block sm:hidden mt-1 line-clamp-2">
                {subscription.name}
              </p>
            </div>
          </div>

          {/* 가격 및 액션 버튼 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className={cn(
                "text-lg sm:text-2xl font-bold",
                hasError ? "text-red-600" : "text-gray-900"
              )}>
                {originalPrice}
              </p>
              {convertedPrice && (
                <p className={cn(
                  "text-xs sm:text-sm",
                  hasError ? "text-red-500" : "text-gray-500"
                )}>
                  {convertedPrice}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-500">/ 월</p>
              {hasError && (
                <p className="text-xs text-red-600 mt-1">
                  환율 정보 확인 필요
                </p>
              )}
            </div>
            
            {/* 데스크톱에서는 호버 시에만 표시 */}
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-10 w-10 text-gray-600 hover:text-blue-600"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-10 w-10 text-gray-600 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* 모바일에서는 액션 버튼을 하단에 배치 */}
        <div className="flex gap-2 mt-4 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex-1 h-10 text-sm"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="flex-1 h-10 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;