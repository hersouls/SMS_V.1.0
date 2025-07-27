import React, { useState } from 'react';
import GoogleLoginButton from './GoogleLoginButton';
import { useAuth } from '../hooks/useAuth';
import { testGoogleOAuthSetup } from '../lib/googleAuth';

const GoogleAuthDemo: React.FC = () => {
  const { user, session, isLoading, isAuthenticated, error, signOut, clearError } = useAuth();
  const [setupTestResult, setSetupTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestSetup = async () => {
    setIsTesting(true);
    setSetupTestResult(null);
    
    try {
      const result = await testGoogleOAuthSetup();
      setSetupTestResult(result);
    } catch (error) {
      setSetupTestResult({
        success: false,
        error: error instanceof Error ? error.message : '테스트 중 오류가 발생했습니다.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLoginSuccess = (session: any) => {
    console.log('로그인 성공 콜백:', session);
  };

  const handleLoginError = (error: string) => {
    console.error('로그인 오류 콜백:', error);
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      console.error('로그아웃 실패:', result.error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google OAuth 데모
        </h1>
        <p className="text-gray-600">
          Google 인증 설정을 테스트하고 로그인을 시도해보세요.
        </p>
      </div>

      {/* 설정 테스트 섹션 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🔧 설정 테스트
        </h2>
        
        <button
          onClick={handleTestSetup}
          disabled={isTesting}
          className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              테스트 중...
            </>
          ) : (
            '설정 테스트 실행'
          )}
        </button>

        {setupTestResult && (
          <div className={`p-4 rounded-md ${
            setupTestResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {setupTestResult.success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  setupTestResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {setupTestResult.success ? '설정 성공' : '설정 오류'}
                </h3>
                <div className={`mt-2 text-sm ${
                  setupTestResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {setupTestResult.message || setupTestResult.error}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 인증 상태 섹션 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          👤 현재 인증 상태
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">로딩 중...</span>
          </div>
        ) : isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {user.user_metadata?.picture && (
                <img
                  src={user.user_metadata.picture}
                  alt="프로필"
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
                {user.app_metadata?.provider && (
                  <p className="text-xs text-gray-500">
                    Provider: {user.app_metadata.provider}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">로그인되지 않음</p>
            
            <GoogleLoginButton
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              className="max-w-sm"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">인증 오류</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-500"
                >
                  오류 지우기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🐛 디버그 정보
          </h2>
          
          <div className="space-y-2 text-sm">
            <div><strong>환경변수 확인:</strong></div>
            <div className="ml-4 space-y-1 font-mono text-xs">
              <div>REACT_APP_SUPABASE_URL: {process.env.REACT_APP_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}</div>
              <div>REACT_APP_SUPABASE_ANON_KEY: {process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}</div>
              <div>REACT_APP_GOOGLE_CLIENT_ID: {process.env.REACT_APP_GOOGLE_CLIENT_ID ? '✅ 설정됨' : '❌ 없음'}</div>
            </div>
            
            <div className="mt-4"><strong>인증 상태:</strong></div>
            <pre className="ml-4 bg-white p-2 rounded border text-xs overflow-auto">
              {JSON.stringify({
                isAuthenticated,
                isLoading,
                hasUser: !!user,
                hasSession: !!session,
                userEmail: user?.email,
                hasError: !!error
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthDemo;