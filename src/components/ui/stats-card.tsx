import React from 'react';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';

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
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'info';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textStyles = {
    default: 'text-gray-900',
    gradient: 'text-white',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900'
  };

  const subtitleStyles = {
    default: 'text-gray-600',
    gradient: 'text-blue-100',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700'
  };

  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon && (
                <div className={cn(
                  'p-2 rounded-lg',
                  variant === 'gradient' ? 'bg-white/20' : 'bg-gray-100'
                )}>
                  {icon}
                </div>
              )}
              <p className={cn('text-sm font-medium', subtitleStyles[variant])}>
                {title}
              </p>
            </div>
            <div className="space-y-1">
              <p className={cn('text-3xl font-bold', textStyles[variant])}>
                {value}
              </p>
              {subtitle && (
                <p className={cn('text-sm', subtitleStyles[variant])}>
                  {subtitle}
                </p>
              )}
              {trend && (
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;