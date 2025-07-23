import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { StepByStepSignUp } from './StepByStepSignUp';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { signIn, supabase } = useSupabase();
  const [showStepByStepSignUp, setShowStepByStepSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // 디버그 정보 추가 함수
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // 컴포넌트 마운트 시 디버그 정보 초기화
  useEffect(() => {
    addDebugInfo('LoginScreen mounted');
    addDebugInfo(`Current URL: ${window.location.href}`);
    addDebugInfo(`Origin: ${window.location.origin}`);
    addDebugInfo(`User Agent: ${navigator.userAgent}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    addDebugInfo('Google sign-in initiated');
    
    try {
      console.log('Starting Google OAuth...');
      addDebugInfo('Starting Google OAuth...');
      console.log('Current URL:', window.location.href);
      console.log('Origin:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: '*', // 모든 도메인 허용
          },
          skipBrowserRedirect: false,
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        addDebugInfo(`Google OAuth error: ${error.message}`);
        throw error;
      }
      
      console.log('Google OAuth response:', data);
      addDebugInfo(`Google OAuth response: ${JSON.stringify(data)}`);
      console.log('Google OAuth initiated successfully');
      addDebugInfo('Google OAuth initiated successfully');
      
      // OAuth는 리다이렉트를 통해 처리되므로 여기서는 로딩 상태를 유지
      // 하지만 일정 시간 후 로딩 상태를 해제하여 사용자가 다시 시도할 수 있도록 함
      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Google 로그인이 완료되지 않았습니다. 다시 시도해주세요.');
          addDebugInfo('Google OAuth timeout - login not completed');
        }
      }, 10000); // 10초 후 타임아웃
      
      // 컴포넌트 언마운트 시 타임아웃 정리
      return () => clearTimeout(timeoutId);
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      addDebugInfo(`Google sign-in error: ${error.message}`);
      let errorMessage = 'Google 로그인에 실패했습니다.';
      
      if (error.message) {
        if (error.message.includes('popup')) {
          errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
        } else if (error.message.includes('network')) {
          errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = '로그인이 취소되었습니다.';
        } else {
          errorMessage = `Google 로그인 실패: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleKakaoSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting Kakao OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('Kakao OAuth error:', error);
        throw error;
      }
      
      console.log('Kakao OAuth initiated successfully');
    } catch (error: any) {
      console.error('Kakao sign-in error:', error);
      setError(`카카오 로그인 실패: ${error.message}`);
      setLoading(false);
    }
  };

  // Step by Step 회원가입 화면 표시
  if (showStepByStepSignUp) {
    return (
      <StepByStepSignUp onBackToLogin={() => setShowStepByStepSignUp(false)} />
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl font-bold">S</span>
        </div>
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          구독 관리 앱에 로그인
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          아직 계정이 없으신가요?{' '}
          <button
            type="button"
            onClick={() => setShowStepByStepSignUp(true)}
            className="font-semibold text-blue-600 hover:text-blue-500"
          >
            가입하기
          </button>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                이메일 주소
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                비밀번호
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '처리 중...' : '로그인'}
              </button>
            </div>
          </form>

          <div>
            <div className="relative mt-10">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm/6 font-medium">
                <span className="bg-white px-6 text-gray-900">또는 다음으로 계속</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26540 14.29L1.27539 17.385C3.25539 21.31 7.31040 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                <span className="text-sm/6 font-semibold">Google</span>
              </button>

              <button
                onClick={handleKakaoSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-yellow-300 ring-inset hover:bg-yellow-300 focus-visible:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 3C7.03 3 3 6.14 3 10c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h1v-3.5h-1v-1.5c-1.71-1.39-3-3.56-3-6C4 7.46 7.58 4 12 4s8 3.46 8 7.5c0 2.44-1.29 4.61-3 6v1.5h-1V17c0-.55.45-1 1-1h1v3.5h-1v-1.26c1.81-1.27 3-3.36 3-5.74C21 6.14 16.97 3 12 3z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm/6 font-semibold">카카오톡</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm/6 text-gray-500">
          구독 관리를 시작하고 모든 구독 서비스를 한 곳에서 관리하세요.
        </p>
        
        {/* 디버그 정보 (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">디버그 정보:</h3>
            <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="mb-1">
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 