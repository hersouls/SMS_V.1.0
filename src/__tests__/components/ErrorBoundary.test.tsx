import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// 에러를 발생시키는 테스트 컴포넌트
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal component</div>;
};

// window.location.reload를 모킹
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // console.error를 모킹하여 테스트 출력을 깔끔하게 유지
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Normal rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should render error UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.')).toBeInTheDocument();
      expect(screen.getByText('페이지 새로고침')).toBeInTheDocument();
    });

    it('should call window.location.reload when refresh button is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText('페이지 새로고침');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('should log error to console when error occurs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Development mode features', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('개발자 정보 (개발 모드에서만 표시)')).toBeInTheDocument();
      
      const detailsElement = screen.getByText('개발자 정보 (개발 모드에서만 표시)');
      fireEvent.click(detailsElement);

      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('should log detailed error information in development mode', () => {
      const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleGroupSpy).toHaveBeenCalledWith('Error Details');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error Info:', expect.any(Object));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Component Stack:', expect.any(String));
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
  });

  describe('Production mode features', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('개발자 정보 (개발 모드에서만 표시)')).not.toBeInTheDocument();
    });

    it('should not log detailed error information in production mode', () => {
      const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleGroupSpy).not.toHaveBeenCalled();
      expect(consoleGroupEndSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error boundary state management', () => {
    it('should update state when error occurs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // 처음에는 정상 렌더링
      expect(screen.getByText('Normal component')).toBeInTheDocument();

      // 에러가 발생하는 컴포넌트로 변경
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // 에러 UI가 렌더링되어야 함
      expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    });

    it('should maintain error state after error occurs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();

      // 에러가 발생하지 않는 컴포넌트로 변경해도 에러 상태 유지
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // 여전히 에러 UI가 표시되어야 함
      expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText('페이지 새로고침');
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton.tagName).toBe('BUTTON');
    });

    it('should have proper heading structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByText('문제가 발생했습니다');
      expect(heading.tagName).toBe('H3');
    });
  });
});