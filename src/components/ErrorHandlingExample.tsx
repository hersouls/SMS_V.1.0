import React, { useState } from 'react';
import { useErrorHandler, ErrorActionGenerator } from '../lib/errorHandlingSystem';
import { ErrorDisplay } from './ErrorDisplay';
import { useNetworkStatus } from '../lib/networkRecovery';
import { subscriptionErrorHandlers } from '../lib/supabaseWithErrorHandling';

export const ErrorHandlingExample: React.FC = () => {
  const { currentError, handleError, clearError, retryLastAction } = useErrorHandler();
  const { isOnline, testConnection } = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);

  // 네트워크 에러 시뮬레이션
  const simulateNetworkError = () => {
    handleError(new Error('Network connection failed'), 'network_simulation');
  };

  // 데이터베이스 에러 시뮬레이션
  const simulateDatabaseError = () => {
    handleError(new Error('duplicate key value violates unique constraint'), 'database_simulation');
  };

  // 인증 에러 시뮬레이션
  const simulateAuthError = () => {
    handleError(new Error('401 Unauthorized'), 'auth_simulation');
  };

  // 권한 에러 시뮬레이션
  const simulatePermissionError = () => {
    handleError(new Error('403 Forbidden'), 'permission_simulation');
  };

  // 검증 에러 시뮬레이션
  const simulateValidationError = () => {
    handleError(new Error('check constraint "price_positive" is violated by some row'), 'validation_simulation');
  };

  // 실제 API 호출 테스트
  const testRealApiCall = async () => {
    setIsLoading(true);
    try {
      // 존재하지 않는 사용자 ID로 테스트
      const { data, error } = await subscriptionErrorHandlers.fetchSubscriptions('non-existent-user');
      
      if (error) {
        handleError(error, 'real_api_call');
      } else {
        console.log('API call successful:', data);
      }
    } catch (error) {
      handleError(error, 'real_api_call_exception');
    } finally {
      setIsLoading(false);
    }
  };

  // 네트워크 연결 테스트
  const testNetworkConnection = async () => {
    setIsLoading(true);
    try {
      const isConnected = await testConnection();
      if (!isConnected) {
        handleError(new Error('서버에 연결할 수 없습니다.'), 'network_test');
      } else {
        console.log('네트워크 연결 성공');
      }
    } catch (error) {
      handleError(error, 'network_test_exception');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          에러 처리 시스템 테스트
        </h1>

        {/* 네트워크 상태 표시 */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <span className="mr-2">{isOnline ? '🌐' : '📡'}</span>
            {isOnline ? '온라인' : '오프라인'}
          </div>
        </div>

        {/* 에러 시뮬레이션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={simulateNetworkError}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            🌐 네트워크 에러
          </button>
          
          <button
            onClick={simulateDatabaseError}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            💾 데이터베이스 에러
          </button>
          
          <button
            onClick={simulateAuthError}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            🔐 인증 에러
          </button>
          
          <button
            onClick={simulatePermissionError}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            🚫 권한 에러
          </button>
          
          <button
            onClick={simulateValidationError}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            ⚠️ 검증 에러
          </button>
          
          <button
            onClick={testRealApiCall}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? '🔄 테스트 중...' : '🔗 실제 API 호출'}
          </button>
          
          <button
            onClick={testNetworkConnection}
            disabled={isLoading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? '🔄 연결 확인 중...' : '🌐 네트워크 연결 테스트'}
          </button>
        </div>

        {/* 에러 정보 표시 */}
        {currentError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              현재 에러 정보
            </h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>타입:</strong> {currentError.type}</p>
              <p><strong>제목:</strong> {currentError.title}</p>
              <p><strong>메시지:</strong> {currentError.message}</p>
              <p><strong>복구 가능:</strong> {currentError.recoverable ? '예' : '아니오'}</p>
              <p><strong>재시도 가능:</strong> {currentError.retryable ? '예' : '아니오'}</p>
              <p><strong>컨텍스트:</strong> {currentError.context}</p>
              <p><strong>시간:</strong> {currentError.timestamp.toLocaleString()}</p>
            </div>
            <button
              onClick={clearError}
              className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            >
              에러 지우기
            </button>
          </div>
        )}

        {/* 에러 처리 시스템 설명 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            에러 처리 시스템 기능
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span><strong>자동 에러 분류:</strong> 네트워크, 데이터베이스, 인증, 권한, 검증 에러를 자동으로 분류</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span><strong>사용자 친화적 메시지:</strong> 기술적 에러를 이해하기 쉬운 메시지로 변환</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span><strong>자동 재시도:</strong> 네트워크 에러 등에 대해 지수 백오프로 자동 재시도</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span><strong>복구 액션:</strong> 에러 타입에 따른 적절한 복구 액션 제공</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span><strong>네트워크 모니터링:</strong> 실시간 네트워크 상태 감시</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span><strong>에러 로깅:</strong> 개발 모드에서 상세한 에러 정보 표시</span>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 표시 모달 */}
      {currentError && (
        <ErrorDisplay
          error={currentError}
          actions={ErrorActionGenerator.generateActions(currentError, {
            onRetry: () => retryLastAction(async () => {
              console.log('재시도 중...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }),
            onRefresh: () => window.location.reload(),
            onGoBack: () => window.history.back()
          })}
          onClose={clearError}
        />
      )}
    </div>
  );
};