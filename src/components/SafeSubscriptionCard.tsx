import React, { useCallback, useMemo } from 'react';
import { Subscription } from '../types/subscription';
import { safeStateAccess } from './ErrorBoundary';

interface SafeSubscriptionCardProps {
  subscription: Subscription | null | undefined;
  onEdit?: (subscription: Subscription) => void;
  onDelete?: (id: number) => void;
  onSelect?: (subscription: Subscription) => void;
  isSelected?: boolean;
  isEditing?: boolean;
}

export const SafeSubscriptionCard: React.FC<SafeSubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  isEditing = false
}) => {
  // 안전한 데이터 접근
  const safeData = useMemo(() => {
    if (!subscription) {
      return {
        id: 0,
        name: '로딩 중...',
        icon: '📱',
        price: 0,
        currency: 'KRW' as const,
        renewDate: '',
        isActive: true,
        color: '#3B82F6'
      };
    }

    return {
      id: safeStateAccess.getNumber(subscription.id, 0),
      name: safeStateAccess.getString(subscription.name),
      icon: safeStateAccess.getString(subscription.icon) || '📱',
      price: safeStateAccess.getNumber(subscription.price, 0),
      currency: safeStateAccess.getString(subscription.currency) as 'KRW' | 'USD' | 'EUR' | 'JPY' || 'KRW',
      renewDate: safeStateAccess.getString(subscription.renewDate),
      isActive: safeStateAccess.getBoolean(subscription.isActive),
      color: safeStateAccess.getString(subscription.color) || '#3B82F6'
    };
  }, [subscription]);

  // 이벤트 핸들러들
  const handleEdit = useCallback(() => {
    if (!subscription || !onEdit) {
      console.warn('구독 정보가 없거나 편집 핸들러가 없습니다');
      return;
    }

    try {
      onEdit(subscription);
    } catch (error) {
      console.error('구독 편집 중 오류:', error);
    }
  }, [subscription, onEdit]);

  const handleDelete = useCallback(() => {
    if (!subscription || !onDelete) {
      console.warn('구독 정보가 없거나 삭제 핸들러가 없습니다');
      return;
    }

    try {
      if (window.confirm(`"${safeData.name}" 구독을 삭제하시겠습니까?`)) {
        onDelete(safeData.id);
      }
    } catch (error) {
      console.error('구독 삭제 중 오류:', error);
    }
  }, [subscription, onDelete, safeData.name, safeData.id]);

  const handleSelect = useCallback(() => {
    if (!subscription || !onSelect) {
      console.warn('구독 정보가 없거나 선택 핸들러가 없습니다');
      return;
    }

    try {
      onSelect(subscription);
    } catch (error) {
      console.error('구독 선택 중 오류:', error);
    }
  }, [subscription, onSelect]);

  // 날짜 포맷팅
  const formattedRenewDate = useMemo(() => {
    if (!safeData.renewDate) return '날짜 없음';
    
    try {
      const date = new Date(safeData.renewDate);
      if (isNaN(date.getTime())) return '잘못된 날짜';
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '날짜 오류';
    }
  }, [safeData.renewDate]);

  // 가격 포맷팅
  const formattedPrice = useMemo(() => {
    try {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: safeData.currency
      }).format(safeData.price);
    } catch (error) {
      console.error('가격 포맷팅 오류:', error);
      return `${safeData.price} ${safeData.currency}`;
    }
  }, [safeData.price, safeData.currency]);

  // 구독이 만료되었는지 확인
  const isExpired = useMemo(() => {
    if (!safeData.renewDate) return false;
    
    try {
      const renewDate = new Date(safeData.renewDate);
      const today = new Date();
      return renewDate < today;
    } catch (error) {
      console.error('만료일 계산 오류:', error);
      return false;
    }
  }, [safeData.renewDate]);

  // 구독이 곧 만료되는지 확인 (7일 이내)
  const isExpiringSoon = useMemo(() => {
    if (!safeData.renewDate) return false;
    
    try {
      const renewDate = new Date(safeData.renewDate);
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return renewDate <= sevenDaysFromNow && renewDate >= today;
    } catch (error) {
      console.error('만료 예정일 계산 오류:', error);
      return false;
    }
  }, [safeData.renewDate]);

  // 구독이 없거나 로딩 중인 경우
  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md p-6 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}
        ${isExpired ? 'border-l-4 border-red-500' : ''}
        ${isExpiringSoon ? 'border-l-4 border-yellow-500' : ''}
        ${!safeData.isActive ? 'opacity-60' : ''}
      `}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${safeData.color}20` }}
          >
            {safeData.icon}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {safeData.name}
            </h3>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="font-medium">{formattedPrice}</span>
              <span>•</span>
              <span>{formattedRenewDate}</span>
            </div>
            
            {/* 상태 표시 */}
            <div className="flex items-center space-x-2 mt-2">
              {!safeData.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  비활성
                </span>
              )}
              
              {isExpired && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  만료됨
                </span>
              )}
              
              {isExpiringSoon && !isExpired && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  곧 만료
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              disabled={isEditing}
              className={`
                p-2 rounded-md transition-colors
                ${isEditing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }
              `}
              title="편집"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};