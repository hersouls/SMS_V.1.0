export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

export interface SignUpStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export type SignUpStepType = 
  | 'account-info'
  | 'personal-info'
  | 'terms'
  | 'verification'
  | 'complete';

export interface ValidationError {
  field: string;
  message: string;
}