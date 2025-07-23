import React, { useState, useEffect } from 'react';
import { SignUpData, SignUpStep, ValidationError } from '../types/auth';
import { validateSignUpData } from '../lib/validation';
import { SignUpProgress } from './SignUpProgress';
import { AccountInfoStep } from './signup/AccountInfoStep';
import { PersonalInfoStep } from './signup/PersonalInfoStep';
import { TermsStep } from './signup/TermsStep';
import { VerificationStep } from './signup/VerificationStep';
import { CompleteStep } from './signup/CompleteStep';

interface StepByStepSignUpProps {
  onBackToLogin: () => void;
}

const INITIAL_SIGNUP_DATA: SignUpData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  agreeToTerms: false,
  agreeToMarketing: false,
};

const SIGNUP_STEPS: SignUpStep[] = [
  {
    id: 1,
    title: '계정 정보',
    description: '이메일과 비밀번호',
    isCompleted: false,
    isCurrent: true,
  },
  {
    id: 2,
    title: '개인 정보',
    description: '이름과 연락처',
    isCompleted: false,
    isCurrent: false,
  },
  {
    id: 3,
    title: '약관 동의',
    description: '이용약관 확인',
    isCompleted: false,
    isCurrent: false,
  },
  {
    id: 4,
    title: '이메일 인증',
    description: '계정 활성화',
    isCompleted: false,
    isCurrent: false,
  },
  {
    id: 5,
    title: '완료',
    description: '가입 완료',
    isCompleted: false,
    isCurrent: false,
  },
];

export const StepByStepSignUp: React.FC<StepByStepSignUpProps> = ({
  onBackToLogin,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [signUpData, setSignUpData] = useState<SignUpData>(INITIAL_SIGNUP_DATA);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [steps, setSteps] = useState<SignUpStep[]>(SIGNUP_STEPS);

  // 현재 단계에 따른 유효성 검사
  useEffect(() => {
    const validateCurrentStep = () => {
      let stepErrors: ValidationError[] = [];

      switch (currentStep) {
        case 1: // 계정 정보
          stepErrors = validateSignUpData(signUpData).filter(error =>
            ['email', 'password', 'confirmPassword'].includes(error.field)
          );
          break;
        case 2: // 개인 정보
          stepErrors = validateSignUpData(signUpData).filter(error =>
            ['firstName', 'lastName', 'phoneNumber'].includes(error.field)
          );
          break;
        case 3: // 약관 동의
          stepErrors = validateSignUpData(signUpData).filter(error =>
            ['agreeToTerms'].includes(error.field)
          );
          break;
        default:
          stepErrors = [];
      }

      setErrors(stepErrors);
    };

    validateCurrentStep();
  }, [currentStep, signUpData]);

  // 단계 업데이트
  useEffect(() => {
    setSteps(prevSteps =>
      prevSteps.map((step, index) => ({
        ...step,
        isCompleted: step.id < currentStep,
        isCurrent: step.id === currentStep,
      }))
    );
  }, [currentStep]);

  const handleDataChange = (field: keyof SignUpData, value: string | boolean) => {
    setSignUpData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AccountInfoStep
            data={signUpData}
            errors={errors}
            onChange={handleDataChange}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <PersonalInfoStep
            data={signUpData}
            errors={errors}
            onChange={handleDataChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <TermsStep
            data={signUpData}
            errors={errors}
            onChange={handleDataChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <VerificationStep
            data={signUpData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <CompleteStep
            data={signUpData}
            onBackToLogin={onBackToLogin}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl font-bold">S</span>
        </div>
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          회원가입
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          단계별로 정보를 입력하여 계정을 만들어보세요
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[600px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
          {/* 진행 단계 표시 */}
          <SignUpProgress steps={steps} currentStep={currentStep} />
          
          {/* 현재 단계 렌더링 */}
          {renderCurrentStep()}
        </div>

        <p className="mt-10 text-center text-sm/6 text-gray-500">
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-semibold text-blue-600 hover:text-blue-500"
          >
            로그인하기
          </button>
        </p>
      </div>
    </div>
  );
};