import React from 'react';
import { AppError, ErrorAction } from '../lib/errorHandlingSystem';

interface ErrorDisplayProps {
  error: AppError;
  actions?: ErrorAction[];
  onClose?: () => void;
}

export function ErrorDisplay({ 
  error, 
  actions = [],
  onClose 
}: ErrorDisplayProps) {
  const getErrorIcon = (type: AppError['type']) => {
    const icons = {
      validation: '⚠️',
      network: '🌐',
      auth: '🔐',
      database: '💾',
      permission: '🚫',
      unknown: '❌'
    };
    return icons[type] || icons.unknown;
  };

  const getErrorColor = (type: AppError['type']) => {
    const colors = {
      validation: 'orange',
      network: 'blue',
      auth: 'purple',
      database: 'red',
      permission: 'gray',
      unknown: 'red'
    };
    return colors[type] || colors.unknown;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{getErrorIcon(error.type)}</span>
          <h3 className="text-lg font-semibold text-gray-900">{error.title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{error.message}</p>
        
        {/* 개발 모드에서 상세 정보 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4">
            <summary className="text-sm text-gray-500 cursor-pointer">
              개발자 정보
            </summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
        
        <div className="flex space-x-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`px-4 py-2 rounded-md ${
                action.primary
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {action.label}
            </button>
          ))}
          
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}