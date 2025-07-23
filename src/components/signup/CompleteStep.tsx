import React from 'react';
import { SignUpData } from '../../types/auth';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface CompleteStepProps {
  data: SignUpData;
  onBackToLogin: () => void;
}

export const CompleteStep: React.FC<CompleteStepProps> = ({
  data,
  onBackToLogin,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          회원가입이 완료되었습니다!
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          이메일 인증을 완료하면 서비스를 이용하실 수 있습니다.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          입력하신 정보
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>이름:</span>
            <span className="font-medium">{data.lastName} {data.firstName}</span>
          </div>
          <div className="flex justify-between">
            <span>이메일:</span>
            <span className="font-medium">{data.email}</span>
          </div>
          {data.phoneNumber && (
            <div className="flex justify-between">
              <span>전화번호:</span>
              <span className="font-medium">{data.phoneNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>마케팅 정보 수신:</span>
            <span className="font-medium">
              {data.agreeToMarketing ? '동의' : '거부'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          다음 단계
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. <strong>{data.email}</strong>로 전송된 인증 이메일을 확인해주세요.</p>
          <p>2. 이메일의 "계정 활성화" 버튼을 클릭하세요.</p>
          <p>3. 인증이 완료되면 로그인하여 서비스를 이용하실 수 있습니다.</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">
          인증 이메일을 받지 못하셨나요?
        </h4>
        <div className="text-sm text-yellow-800 space-y-1">
          <p>• 스팸 폴더를 확인해보세요</p>
          <p>• 이메일 주소가 정확한지 확인해보세요</p>
          <p>• 몇 분 후에도 이메일이 오지 않으면 고객센터에 문의해주세요</p>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={onBackToLogin}
          className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
};