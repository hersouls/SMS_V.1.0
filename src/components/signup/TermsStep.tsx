import React, { useState } from 'react';
import { SignUpData, ValidationError } from '../../types/auth';
import { validateTerms } from '../../lib/validation';

interface TermsStepProps {
  data: SignUpData;
  errors: ValidationError[];
  onChange: (field: keyof SignUpData, value: string | boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TermsStep: React.FC<TermsStepProps> = ({
  data,
  errors,
  onChange,
  onNext,
  onBack,
}) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const isStepValid = () => {
    return !validateTerms(data.agreeToTerms);
  };

  const handleNext = () => {
    if (isStepValid()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">약관 동의</h3>
        <p className="text-sm text-gray-600">
          서비스 이용을 위해 다음 약관에 동의해주세요.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={data.agreeToTerms}
              onChange={(e) => onChange('agreeToTerms', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agreeToTerms" className="font-medium text-gray-900">
              <span className="text-red-600">*</span> 이용약관 및 개인정보처리방침에 동의합니다
            </label>
            <div className="mt-1 space-x-2">
              <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                이용약관 보기
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacy(!showPrivacy)}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                개인정보처리방침 보기
              </button>
            </div>
          </div>
        </div>

        {getFieldError('agreeToTerms') && (
          <p className="text-sm text-red-600">{getFieldError('agreeToTerms')}</p>
        )}

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="agreeToMarketing"
              name="agreeToMarketing"
              type="checkbox"
              checked={data.agreeToMarketing}
              onChange={(e) => onChange('agreeToMarketing', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agreeToMarketing" className="font-medium text-gray-900">
              마케팅 정보 수신에 동의합니다 (선택사항)
            </label>
            <p className="text-gray-500">
              새로운 기능과 서비스 소식을 이메일로 받아보실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 약관 내용 모달 */}
      {showTerms && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">이용약관</h3>
              <div className="max-h-96 overflow-y-auto text-sm text-gray-600 space-y-4">
                <p>
                  <strong>제1조 (목적)</strong><br />
                  이 약관은 구독 관리 서비스(이하 "서비스")의 이용과 관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
                <p>
                  <strong>제2조 (정의)</strong><br />
                  1. "서비스"란 구독 서비스 관리를 위한 웹 애플리케이션을 의미합니다.<br />
                  2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원을 의미합니다.
                </p>
                <p>
                  <strong>제3조 (서비스의 제공)</strong><br />
                  서비스 제공자는 다음과 같은 서비스를 제공합니다:<br />
                  - 구독 서비스 등록 및 관리<br />
                  - 결제 일정 알림<br />
                  - 구독 비용 분석 및 리포트
                </p>
                <p>
                  <strong>제4조 (개인정보보호)</strong><br />
                  서비스 제공자는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하며, 개인정보의 수집, 이용, 제공 등에 관한 사항은 개인정보처리방침에서 정합니다.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">개인정보처리방침</h3>
              <div className="max-h-96 overflow-y-auto text-sm text-gray-600 space-y-4">
                <p>
                  <strong>1. 개인정보의 수집 및 이용목적</strong><br />
                  서비스 제공자는 다음의 목적을 위하여 개인정보를 처리합니다:<br />
                  - 서비스 제공 및 계정 관리<br />
                  - 고객 지원 및 문의 응답<br />
                  - 서비스 개선 및 신규 서비스 개발
                </p>
                <p>
                  <strong>2. 수집하는 개인정보 항목</strong><br />
                  - 필수항목: 이메일, 비밀번호, 이름<br />
                  - 선택항목: 전화번호, 프로필 이미지
                </p>
                <p>
                  <strong>3. 개인정보의 보유 및 이용기간</strong><br />
                  회원 탈퇴 시까지 (단, 관련 법령에 따라 보존이 필요한 경우 해당 기간까지)
                </p>
                <p>
                  <strong>4. 개인정보의 파기</strong><br />
                  개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
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
          onClick={handleNext}
          disabled={!isStepValid()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    </div>
  );
};