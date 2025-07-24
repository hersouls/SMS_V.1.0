import React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { cn, validateExchangeRateState, safeFormatCurrency } from '../../lib/utils';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface ExchangeRateInfoProps {
  exchangeRate: number;
  isLoading: boolean;
  lastUpdate: Date | null;
  onRetry: () => void;
  className?: string;
}

const ExchangeRateInfo: React.FC<ExchangeRateInfoProps> = ({
  exchangeRate,
  isLoading,
  lastUpdate,
  onRetry,
  className
}) => {
  const validation = validateExchangeRateState(exchangeRate, isLoading, lastUpdate);

  const getStatusIcon = () => {
    switch (validation.status) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error':
        return <WifiOff className="w-4 h-4" />;
      case 'stale':
        return <Clock className="w-4 h-4" />;
      case 'valid':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (validation.status) {
      case 'loading':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'stale':
        return 'text-yellow-600 bg-yellow-100';
      case 'valid':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLastUpdateText = () => {
    if (!lastUpdate) return '업데이트 정보 없음';
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  return (
    <Card className={cn(
      'transition-all duration-300',
      validation.status === 'error' && 'border-red-200 bg-red-50/50',
      validation.status === 'stale' && 'border-yellow-200 bg-yellow-50/50',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">환율 정보</h4>
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            getStatusColor()
          )}>
            {getStatusIcon()}
            <span>
              {validation.status === 'loading' && '업데이트 중'}
              {validation.status === 'error' && '연결 오류'}
              {validation.status === 'stale' && '오래된 정보'}
              {validation.status === 'valid' && '실시간'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {/* 환율 표시 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">USD</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm font-medium text-gray-700">KRW</span>
            </div>
            <div className="text-right">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500">로딩 중...</span>
                </div>
              ) : validation.isValid ? (
                <span className="text-lg font-bold text-gray-900">
                  {safeFormatCurrency(exchangeRate, 'KRW', '환율 오류').replace('₩', '')}
                </span>
              ) : (
                <span className="text-sm text-red-600">연결 실패</span>
              )}
            </div>
          </div>

          {/* 마지막 업데이트 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{getLastUpdateText()}</span>
            {validation.status === 'error' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                다시 시도
              </Button>
            )}
          </div>

          {/* 오류 메시지 */}
          {validation.status === 'error' && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {validation.message}
            </div>
          )}

          {/* 경고 메시지 */}
          {validation.status === 'stale' && (
            <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
              {validation.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateInfo;