import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { UserProfile } from './UserProfile';

export function AuthTestPage() {
  const { isAuthenticated, isLoading, user, profile, error } = useAuth();
  const [diagnosticResult, setDiagnosticResult] = useState<{
    issues: string[];
    recommendations: string[];
  } | null>(null);

  const handleDiagnose = async () => {
    try {
      const { diagnoseIssues } = useAuth();
      const result = await diagnoseIssues();
      setDiagnosticResult(result);
    } catch (error) {
      console.error('진단 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">인증 시스템 테스트</h1>
          
          {/* 인증 상태 표시 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">인증 상태</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">로그인 상태</h3>
                <p className={`text-sm ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                  {isAuthenticated ? '로그인됨' : '로그인되지 않음'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">사용자 ID</h3>
                <p className="text-sm text-gray-600 font-mono">
                  {user?.id || '없음'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">이메일</h3>
                <p className="text-sm text-gray-600">
                  {user?.email || '없음'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">프로필 상태</h3>
                <p className={`text-sm ${profile ? 'text-green-600' : 'text-yellow-600'}`}>
                  {profile ? '프로필 있음' : '프로필 없음'}
                </p>
              </div>
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* 진단 버튼 */}
          <div className="mb-6">
            <button
              onClick={handleDiagnose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              OAuth 설정 진단
            </button>
          </div>

          {/* 진단 결과 */}
          {diagnosticResult && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">진단 결과</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    {diagnosticResult.issues.length > 0 ? (
                      <div>
                        <h4 className="font-medium">발견된 문제:</h4>
                        <ul className="list-disc list-inside mt-1">
                          {diagnosticResult.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                        {diagnosticResult.recommendations.length > 0 && (
                          <div className="mt-3">
                            <h4 className="font-medium">해결 방법:</h4>
                            <ul className="list-disc list-inside mt-1">
                              {diagnosticResult.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>현재 발견된 문제가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 로그인 폼 또는 프로필 */}
        {!isAuthenticated ? (
          <LoginForm />
        ) : (
          <UserProfile />
        )}
      </div>
    </div>
  );
}