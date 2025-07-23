import React, { useState } from 'react';
import { SignUpData } from '../../types/auth';
import { useSupabase } from '../../contexts/SupabaseContext';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface VerificationStepProps {
  data: SignUpData;
  onNext: () => void;
  onBack: () => void;
}

export const VerificationStep: React.FC<VerificationStepProps> = ({
  data,
  onNext,
  onBack,
}) => {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'error'>('pending');

  const handleSendVerificationEmail = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Sending verification email to:', data.email);
      
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phoneNumber,
            agree_to_marketing: data.agreeToMarketing,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      console.log('Sign up response:', signUpData);
      
      // 이메일 확인이 필요한 경우
      if (signUpData.user && !signUpData.session) {
        setIsEmailSent(true);
        console.log('Email verification required');
      } else if (signUpData.session) {
        // 자동 로그인된 경우
        console.log('User automatically signed in');
        setIsEmailSent(true);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      if (error.message) {
        if (error.message.includes('already registered')) {
          errorMessage = '이미 등록된 이메일 주소입니다. 로그인을 시도해주세요.';
        } else if (error.message.includes('invalid email')) {
          errorMessage = '올바른 이메일 주소를 입력해주세요.';
        } else if (error.message.includes('password')) {
          errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Resending verification email to:', data.email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      console.log('Verification email resent successfully');
      setError('인증 이메일이 다시 전송되었습니다. 이메일을 확인해주세요.');
    } catch (error: any) {
      console.error('Resend error:', error);
      let errorMessage = '이메일 재전송 중 오류가 발생했습니다.';
      
      if (error.message) {
        if (error.message.includes('not found')) {
          errorMessage = '등록되지 않은 이메일 주소입니다.';
        } else if (error.message.includes('too many requests')) {
          errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Checking verification status for:', data.email);
      
      // 현재 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session check error:', sessionError);
        throw sessionError;
      }

      if (session) {
        console.log('User is already authenticated');
        setVerificationStatus('verified');
        setIsEmailSent(true);
        return;
      }

      // 사용자 정보 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User check error:', userError);
        // 사용자가 로그인되지 않은 상태는 정상
        setVerificationStatus('pending');
        return;
      }

      if (user && user.email_confirmed_at) {
        console.log('Email is verified');
        setVerificationStatus('verified');
        setIsEmailSent(true);
      } else if (user && !user.email_confirmed_at) {
        console.log('Email verification pending');
        setVerificationStatus('pending');
      }
    } catch (error: any) {
      console.error('Verification status check error:', error);
      setVerificationStatus('error');
      setError('인증 상태 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">이메일 인증</h3>
        <p className="text-sm text-gray-600">
          입력하신 이메일 주소로 인증 메일을 보내드립니다.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              이메일 주소 확인
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>{data.email}</strong>로 인증 이메일을 전송합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isEmailSent ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSendVerificationEmail}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : '인증 이메일 보내기'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {verificationStatus === 'verified' ? '이메일 인증 완료' : '인증 이메일 전송 완료'}
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  {verificationStatus === 'verified' ? (
                    <>
                      <p>
                        <strong>{data.email}</strong>의 이메일 인증이 완료되었습니다!
                      </p>
                      <p className="mt-1">
                        이제 로그인하여 서비스를 이용할 수 있습니다.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>{data.email}</strong>로 인증 이메일을 보냈습니다.
                      </p>
                      <p className="mt-1">
                        이메일을 확인하여 계정을 활성화해주세요.
                      </p>
                      <p className="mt-2 text-xs text-green-600">
                        • 스팸 폴더도 확인해보세요<br/>
                        • 이메일이 도착하지 않으면 아래 '다시 보내기' 버튼을 클릭하세요<br/>
                        • 인증 완료 후 로그인 페이지에서 로그인할 수 있습니다
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              인증 이메일을 받지 못하셨나요?
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• 스팸 폴더를 확인해보세요</p>
              <p>• 이메일 주소가 정확한지 확인해보세요</p>
              <p>• 아래 버튼을 클릭하여 이메일을 다시 보낼 수 있습니다</p>
            </div>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
              >
                {isLoading ? '전송 중...' : '인증 이메일 다시 보내기'}
              </button>
              <div className="text-xs text-gray-500">
                또는
              </div>
              <button
                type="button"
                onClick={checkVerificationStatus}
                disabled={isLoading}
                className="text-sm text-green-600 hover:text-green-500 underline disabled:opacity-50"
              >
                {isLoading ? '확인 중...' : '인증 상태 확인하기'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          이전
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isEmailSent || verificationStatus === 'error'}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verificationStatus === 'verified' ? '계속하기' : '완료'}
        </button>
      </div>
    </div>
  );
};