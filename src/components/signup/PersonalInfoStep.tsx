import React from 'react';
import { SignUpData, ValidationError } from '../../types/auth';
import { validateName, validatePhoneNumber } from '../../lib/validation';

interface PersonalInfoStepProps {
  data: SignUpData;
  errors: ValidationError[];
  onChange: (field: keyof SignUpData, value: string | boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  data,
  errors,
  onChange,
  onNext,
  onBack,
}) => {
  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const isStepValid = () => {
    return (
      !validateName(data.firstName, '이름') &&
      !validateName(data.lastName, '성') &&
      !validatePhoneNumber(data.phoneNumber || '')
    );
  };

  const handleNext = () => {
    if (isStepValid()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">개인 정보</h3>
        <p className="text-sm text-gray-600">
          서비스 이용을 위한 기본 정보를 입력해주세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">
            성 *
          </label>
          <div className="mt-1">
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={data.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              className={`block w-full rounded-md px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                getFieldError('lastName')
                  ? 'ring-red-300 focus:ring-red-500'
                  : 'ring-gray-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
              placeholder="김"
            />
            {getFieldError('lastName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('lastName')}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
            이름 *
          </label>
          <div className="mt-1">
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={data.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              className={`block w-full rounded-md px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ${
                getFieldError('firstName')
                  ? 'ring-red-300 focus:ring-red-500'
                  : 'ring-gray-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
              placeholder="철수"
            />
            {getFieldError('firstName') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('firstName')}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900">
          전화번호
        </label>
        <div className="mt-1">
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={data.phoneNumber || ''}
            onChange={(e) => onChange('phoneNumber', e.target.value)}
            className={`block w-full rounded-md px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ${
              getFieldError('phoneNumber')
                ? 'ring-red-300 focus:ring-red-500'
                : 'ring-gray-300 focus:ring-blue-500'
            } focus:outline-none focus:ring-2`}
            placeholder="010-1234-5678"
          />
          {getFieldError('phoneNumber') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phoneNumber')}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            선택사항입니다. 비상연락망으로 사용됩니다.
          </p>
        </div>
      </div>

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