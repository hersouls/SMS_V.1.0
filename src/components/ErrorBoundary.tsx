import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorMessageGenerator, ErrorActionGenerator } from '../lib/errorHandlingSystem';
import { ErrorDisplay } from './ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = ErrorMessageGenerator.generate(error, 'error_boundary');
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = async () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const actions = ErrorActionGenerator.generateActions(this.state.error, {
        onRetry: this.handleRetry,
        onGoBack: this.handleGoBack
      });

      return (
        <ErrorDisplay
          error={this.state.error}
          actions={actions}
          onClose={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// 상태 오류를 감지하는 HOC
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// 상태 안전성을 위한 유틸리티 함수들
export const safeStateAccess = {
  // 안전한 배열 접근
  getArrayItem: function<T>(array: T[] | undefined | null, index: number): T | undefined {
    if (!array || !Array.isArray(array) || index < 0 || !(index < array.length)) {
      return undefined;
    }
    return array[index];
  },

  // 안전한 객체 속성 접근
  getObjectProperty: function<T, K extends keyof T>(obj: T | undefined | null, key: K): T[K] | undefined {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }
    return obj[key];
  },

  // 안전한 문자열 접근
  getString: function(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  },

  // 안전한 숫자 접근
  getNumber: function(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  // 안전한 불린 접근
  getBoolean: function(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    return Boolean(value);
  }
};