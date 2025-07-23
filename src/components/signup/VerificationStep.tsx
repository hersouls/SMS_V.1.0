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

  const handleSendVerificationEmail = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phoneNumber,
            agree_to_marketing: data.agreeToMarketing,
          },
        },
      });

      if (error) {
        throw error;
      }

      setIsEmailSent(true);
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: data.email,
      });

      if (error) {
        throw error;
      }

      setError('인증 이메일이 다시 전송되었습니다.');
    } catch (error: any) {
      console.error('Resend error:', error);
      setError(error.message || '이메일 재전송 중 오류가 발생했습니다.');
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
                  인증 이메일 전송 완료
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    <strong>{data.email}</strong>로 인증 이메일을 보냈습니다.
                  </p>
                  <p className="mt-1">
                    이메일을 확인하여 계정을 활성화해주세요.
                  </p>
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
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isLoading}
              className="mt-3 text-sm text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
            >
              {isLoading ? '전송 중...' : '인증 이메일 다시 보내기'}
            </button>
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
          disabled={!isEmailSent}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          완료
        </button>
      </div>
    </div>
  );
};