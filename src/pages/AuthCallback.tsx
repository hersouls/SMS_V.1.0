import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleAuthCallback } from '../lib/googleAuth';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('인증을 처리하고 있습니다...');

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        console.log('인증 콜백 페이지 로드됨');
        console.log('현재 URL:', window.location.href);
        
        // URL 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        console.log('URL 파라미터:', { code: code?.substring(0, 10) + '...', error });

        if (error) {
          console.error('OAuth 오류:', error);
          setStatus('error');
          setMessage(`인증 오류: ${error}`);
          
          // 3초 후 로그인 페이지로 리다이렉트
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
          return;
        }

        if (!code) {
          console.error('인증 코드가 없습니다');
          setStatus('error');
          setMessage('인증 코드를 찾을 수 없습니다.');
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
          return;
        }

        // 인증 처리
        const result = await handleAuthCallback();
        
        if (result.success) {
          console.log('인증 콜백 성공:', result.user?.email);
          setStatus('success');
          setMessage(`환영합니다, ${result.user?.email || '사용자'}님!`);
          
          // 성공 시 메인 페이지로 리다이렉트
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          console.error('인증 콜백 실패:', result.error);
          setStatus('error');
          setMessage(result.error || '인증 처리에 실패했습니다.');
          
          // 실패 시 로그인 페이지로 리다이렉트
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('인증 콜백 처리 예외:', error);
        setStatus('error');
        setMessage('인증 처리 중 오류가 발생했습니다.');
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    // 컴포넌트가 마운트된 후 잠시 대기 후 처리
    const timeoutId = setTimeout(processAuthCallback, 500);
    
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        );
      case 'success':
        return (
          <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center space-y-4">
            {/* 상태 아이콘 */}
            {getStatusIcon()}
            
            {/* 상태 메시지 */}
            <div className="text-center">
              <h2 className={`text-lg font-medium ${getStatusColor()}`}>
                {status === 'loading' && 'Google 인증 처리 중'}
                {status === 'success' && '인증 성공!'}
                {status === 'error' && '인증 오류'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
            </div>
            
            {/* 추가 정보 */}
            {status === 'loading' && (
              <p className="text-xs text-gray-500 text-center">
                잠시만 기다려주세요...
              </p>
            )}
            
            {status === 'success' && (
              <p className="text-xs text-gray-500 text-center">
                곧 메인 페이지로 이동합니다.
              </p>
            )}
            
            {status === 'error' && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  로그인 페이지로 돌아갑니다.
                </p>
                <button
                  onClick={() => navigate('/', { replace: true })}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  지금 돌아가기
                </button>
              </div>
            )}
          </div>
          
          {/* 디버그 정보 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
              <details>
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  디버그 정보 (개발 모드)
                </summary>
                <div className="mt-2 space-y-1 text-gray-500">
                  <div>현재 URL: {window.location.href}</div>
                  <div>상태: {status}</div>
                  <div>메시지: {message}</div>
                  <div>시간: {new Date().toLocaleTimeString()}</div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;