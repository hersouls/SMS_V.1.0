import React from 'react';
import { Card, CardContent } from './card';
import { cn, isValidNumber } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'info' | 'error';
  isLoading?: boolean;
  error?: boolean;
  errorMessage?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  variant = 'default',
  isLoading = false,
  error = false,
  errorMessage
}) => {
  // 값 검증 및 안전한 표시
  const getDisplayValue = (): string => {
    if (isLoading) return '로딩 중...';
    if (error) return errorMessage || '계산 오류';
    
    // 숫자 검증
    if (typeof value === 'number') {
      if (!isValidNumber(value)) {
        return '계산 오류';
      }
      if (value === 0) return '₩0';
      if (!isFinite(value)) return '계산 오류';
    }
    
    // 문자열 검증
    if (typeof value === 'string') {
      if (value === 'NaN' || value === 'Infinity' || value === '-Infinity') {
        return '계산 오류';
      }
      if (value.includes('NaN') || value.includes('Infinity')) {
        return '계산 오류';
      }
    }
    
    return String(value);
  };

  const displayValue = getDisplayValue();
  const isErrorState = error || displayValue === '계산 오류';
  const finalVariant = isErrorState ? 'error' : variant;

  const variantStyles = {
    default: 'bg-white border-gray-200',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    error: 'bg-red-50 border-red-200'
  };

  const textStyles = {
    default: 'text-gray-900',
    gradient: 'text-white',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
    error: 'text-red-900'
  };

  const subtitleStyles = {
    default: 'text-gray-600',
    gradient: 'text-blue-100',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700',
    error: 'text-red-700'
  };

  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
      variantStyles[finalVariant],
      isLoading && 'opacity-75',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon && (
                <div className={cn(
                  'p-2 rounded-lg',
                  finalVariant === 'gradient' ? 'bg-white/20' : 'bg-gray-100',
                  isErrorState && 'bg-red-100'
                )}>
                  {icon}
                </div>
              )}
              <p className={cn('text-sm font-medium', subtitleStyles[finalVariant])}>
                {title}
              </p>
              {isErrorState && (
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  오류
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className={cn(
                'text-3xl font-bold', 
                textStyles[finalVariant],
                isLoading && 'animate-pulse',
                isErrorState && 'text-red-600'
              )}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    {displayValue}
                  </div>
                ) : (
                  displayValue
                )}
              </p>
              {subtitle && (
                <p className={cn('text-sm', subtitleStyles[finalVariant])}>
                  {subtitle}
                </p>
              )}
              {trend && !isErrorState && (
                <div className="flex items-center gap-1">
                  <span className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              )}
              {isErrorState && (
                <p className="text-xs text-red-600 mt-1">
                  새로고침하여 다시 시도해주세요
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;