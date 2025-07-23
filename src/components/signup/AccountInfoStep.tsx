import React from 'react';
import { SignUpData, ValidationError } from '../../types/auth';
import { validateEmail, validatePassword, validateConfirmPassword } from '../../lib/validation';

interface AccountInfoStepProps {
  data: SignUpData;
  errors: ValidationError[];
  onChange: (field: keyof SignUpData, value: string | boolean) => void;
  onNext: () => void;
}

export const AccountInfoStep: React.FC<AccountInfoStepProps> = ({
  data,
  errors,
  onChange,
  onNext,
}) => {
  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const isStepValid = () => {
    return (
      !validateEmail(data.email) &&
      !validatePassword(data.password) &&
      !validateConfirmPassword(data.password, data.confirmPassword)
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">계정 정보</h3>
        <p className="text-sm text-gray-600">
          로그인에 사용할 이메일과 비밀번호를 입력해주세요.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
          이메일 주소 *
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            required
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={`block w-full rounded-md px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ${
              getFieldError('email')
                ? 'ring-red-300 focus:ring-red-500'
                : 'ring-gray-300 focus:ring-blue-500'
            } focus:outline-none focus:ring-2`}
            placeholder="your@email.com"
          />
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-900">
          비밀번호 *
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            required
            value={data.password}
            onChange={(e) => onChange('password', e.target.value)}
            className={`block w-full rounded-md px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ${
              getFieldError('password')
                ? 'ring-red-300 focus:ring-red-500'
                : 'ring-gray-300 focus:ring-blue-500'
            } focus:outline-none focus:ring-2`}
            placeholder="••••••••"
          />
          {getFieldError('password') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
          )}
          <div className="mt-2 text-xs text-gray-500">
            <p>비밀번호는 다음을 포함해야 합니다:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li className={data.password.length >= 8 ? 'text-green-600' : ''}>
                최소 8자 이상
              </li>
              <li className={/(?=.*[a-z])/.test(data.password) ? 'text-green-600' : ''}>
                소문자 1개 이상
              </li>
              <li className={/(?=.*[A-Z])/.test(data.password) ? 'text-green-600' : ''}>
                대문자 1개 이상
              </li>
              <li className={/(?=.*\d)/.test(data.password) ? 'text-green-600' : ''}>
                숫자 1개 이상
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">
          비밀번호 확인 *
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={data.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
            className={`block w-full rounded-md px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ${
              getFieldError('confirmPassword')
                ? 'ring-red-300 focus:ring-red-500'
                : 'ring-gray-300 focus:ring-blue-500'
            } focus:outline-none focus:ring-2`}
            placeholder="••••••••"
          />
          {getFieldError('confirmPassword') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('confirmPassword')}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
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