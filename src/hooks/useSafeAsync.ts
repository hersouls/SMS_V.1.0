import { useCallback, useRef, useEffect } from 'react';

// AbortController를 사용한 안전한 비동기 작업 훅
export const useSafeAsync = () => {
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // 컴포넌트 언마운트 시 진행 중인 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 안전한 비동기 실행 함수
  const execute = useCallback(async <T>(
    asyncFunction: (signal?: AbortSignal) => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      onFinally?: () => void;
    }
  ): Promise<T | null> => {
    // 이전 요청이 있다면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      const result = await asyncFunction(abortControllerRef.current.signal);
      
      // 컴포넌트가 마운트된 상태에서만 결과 처리
      if (mountedRef.current) {
        options?.onSuccess?.(result);
        return result;
      }
      
      return null;
    } catch (error) {
      // AbortError는 무시 (요청이 취소된 경우)
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      
      // 컴포넌트가 마운트된 상태에서만 에러 처리
      if (mountedRef.current) {
        options?.onError?.(error as Error);
      }
      
      throw error;
    } finally {
      // 컴포넌트가 마운트된 상태에서만 finally 실행
      if (mountedRef.current) {
        options?.onFinally?.();
      }
    }
  }, []);

  // 현재 진행 중인 요청 취소
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { execute, cancel, isMounted: () => mountedRef.current };
};

// 안전한 상태 업데이트를 위한 훅
export const useSafeState = <T>(initialState: T) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((setter: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: T | ((prev: T) => T)) => {
      if (mountedRef.current) {
        setter(value);
      }
    };
  }, []);

  return { setSafeState, isMounted: () => mountedRef.current };
};

// 디바운스된 함수를 위한 훅
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// 스로틀된 함수를 위한 훅
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef(0);
  const lastCallTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallRef.current >= delay) {
      callback(...args);
      lastCallRef.current = now;
    } else {
      if (lastCallTimerRef.current) {
        clearTimeout(lastCallTimerRef.current);
      }

      lastCallTimerRef.current = setTimeout(() => {
        callback(...args);
        lastCallRef.current = Date.now();
      }, delay - (now - lastCallRef.current));
    }
  }, [callback, delay]) as T;
};