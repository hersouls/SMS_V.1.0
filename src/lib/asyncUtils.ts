import { useRef, useEffect } from 'react';

export interface AsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: unknown) => void;
  onFinally?: () => void;
  retryCount?: number;
  retryDelay?: number;
}

export const useAsyncOperation = () => {
  const mountedRef = useRef(true);
  const operationInProgressRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeAsync = async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    if (operationInProgressRef.current) {
      console.warn('Operation already in progress, skipping...');
      return null;
    }

    operationInProgressRef.current = true;
    let result: T | null = null;

    try {
      result = await operation();
      
      if (mountedRef.current) {
        options.onSuccess?.(result);
      }
      
      return result;
    } catch (error) {
      if (mountedRef.current) {
        options.onError?.(error);
      }
      throw error;
    } finally {
      operationInProgressRef.current = false;
      if (mountedRef.current) {
        options.onFinally?.();
      }
    }
  };

  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions & { maxRetries?: number } = {}
  ): Promise<T | null> => {
    const { maxRetries = 3, retryDelay = 1000, ...restOptions } = options;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await executeAsync(operation, restOptions);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries && isRetryableError(error)) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    throw lastError;
  };

  return {
    executeAsync,
    executeWithRetry,
    isMounted: () => mountedRef.current,
    isOperationInProgress: () => operationInProgressRef.current
  };
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('server error') ||
           message.includes('500') ||
           message.includes('fetch');
  }
  return false;
};

export const createAbortableOperation = () => {
  const abortController = new AbortController();
  
  const execute = async <T>(
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    return operation(abortController.signal);
  };
  
  const abort = () => {
    abortController.abort();
  };
  
  return { execute, abort, signal: abortController.signal };
};

export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
};

export const useTimeout = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    
    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
};