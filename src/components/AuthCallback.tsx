import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';
import { handleOAuthCallback, cleanOAuthURL } from '../utils/authUtils';

export const AuthCallback: React.FC = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('=== OAuth Callback Debug Info ===');
        console.log('Current URL:', window.location.href);
        
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const debugData = {
          url: window.location.href,
          search: window.location.search,
          hash: window.location.hash,
          searchParams: Object.fromEntries(urlParams.entries()),
          hashParams: Object.fromEntries(hashParams.entries()),
          timestamp: new Date().toISOString()
        };
        
        setDebugInfo(debugData);
        console.log('Debug data:', debugData);
        
        // URL에 인증 관련 파라미터가 있는지 확인
        const hasAuthCode = urlParams.has('code') || hashParams.has('access_token');
        const hasError = urlParams.has('error') || hashParams.has('error');
        
        if (!hasAuthCode && !hasError) {
          // 인증 파라미터가 없으면 세션만 확인
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Session found without auth params, redirecting');
            navigate('/', { replace: true });
            return;
          } else {
            setError('인증 파라미터를 찾을 수 없습니다. 다시 로그인해주세요.');
            setLoading(false);
            return;
          }
        }
        
        const result = await handleOAuthCallback();
        
        if (result.success) {
          console.log('OAuth callback successful, redirecting to home');
          cleanOAuthURL();
          // 약간의 지연 후 리다이렉트 (세션이 완전히 설정되도록)
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1000);
        } else {
          console.error('OAuth callback failed:', result.error);
          setError(result.error || '알 수 없는 오류가 발생했습니다.');
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Callback processing error:', error);
        setError(`처리 오류: ${error.message}`);
        setLoading(false);
      }
    };

    // 약간의 지연 후 처리 (페이지가 완전히 로드된 후)
    const timer = setTimeout(processCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          
          {debugInfo && process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
              <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                디버그 정보 (개발 모드)
              </summary>
              <pre className="text-sm text-gray-600 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
          
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              홈으로 돌아가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};