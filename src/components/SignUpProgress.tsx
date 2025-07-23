import React from 'react';
import { SignUpStep } from '../types/auth';
import { CheckIcon } from '@heroicons/react/24/solid';

interface SignUpProgressProps {
  steps: SignUpStep[];
  currentStep: number;
}

export const SignUpProgress: React.FC<SignUpProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.isCompleted
                    ? 'bg-green-600 text-white'
                    : step.isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    step.isCompleted
                      ? 'text-green-600'
                      : step.isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  step.isCompleted ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};