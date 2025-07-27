import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../contexts/SupabaseContext';

export const AuthCallback: React.FC = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback...');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Hash:', window.location.hash);
        
        // URL 파라미터와 hash fragments 모두 확인
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        console.log('URL params:', Object.fromEntries(urlParams.entries()));
        console.log('Hash params:', Object.fromEntries(hashParams.entries()));
        
        // 오류 확인 (URL params와 hash 모두에서)
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setError(`OAuth 오류: ${errorDescription || error}`);
          setLoading(false);
          return;
        }

        // authorization code가 있는 경우 Supabase에 교환 요청
        const code = urlParams.get('code');
        if (code) {
          console.log('Authorization code found, exchanging for session...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setError(`코드 교환 오류: ${exchangeError.message}`);
            setLoading(false);
            return;
          }
          
          if (data.session) {
            console.log('Code exchange successful, user logged in');
            // URL 정리
            window.history.replaceState({}, document.title, '/');
            navigate('/', { replace: true });
            return;
          }
        }

        // 기존 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(`세션 오류: ${sessionError.message}`);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('Auth callback successful, user logged in');
          // URL 정리
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        } else {
          console.log('No session found after callback');
          
          // 잠시 기다린 후 다시 시도 (Supabase auth가 처리 중일 수 있음)
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              console.log('Session found on retry');
              window.history.replaceState({}, document.title, '/');
              navigate('/', { replace: true });
            } else {
              setError('로그인 세션을 찾을 수 없습니다. 다시 시도해주세요.');
              setLoading(false);
            }
          }, 2000);
        }
        
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError(`콜백 처리 오류: ${error.message}`);
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [supabase, navigate]);

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
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
};