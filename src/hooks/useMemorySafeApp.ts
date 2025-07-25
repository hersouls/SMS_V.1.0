import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * 메모리 안전한 비동기 작업 훅
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async <T>(
    asyncFn: (signal: AbortSignal) => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
      onFinally?: () => void;
    }
  ): Promise<T | null> => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새 AbortController 생성
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const result = await asyncFn(signal);
      
      // 컴포넌트가 언마운트되었는지 확인
      if (!isMountedRef.current) {
        return null;
      }

      options?.onSuccess?.(result);
      return result;
    } catch (error: any) {
      // AbortError는 정상적인 취소이므로 무시
      if (error.name === 'AbortError') {
        return null;
      }

      if (isMountedRef.current) {
        options?.onError?.(error);
      }
      throw error;
    } finally {
      if (isMountedRef.current) {
        options?.onFinally?.();
      }
    }
  }, []);

  return { execute, isMounted: () => isMountedRef.current };
}

/**
 * 안전한 오디오 관리 훅
 */
export function useSafeAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [hasError, setHasError] = useState(false);

  // 오디오 초기화
  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // 정리 함수
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      
      // 오디오 정리
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, [src]);

  // 볼륨 변경
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = useCallback(async () => {
    if (!audioRef.current || hasError) return false;
    
    try {
      await audioRef.current.play();
      return true;
    } catch (error) {
      console.warn('Audio play failed:', error);
      setHasError(true);
      return false;
    }
  }, [hasError]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  return {
    isPlaying,
    volume,
    hasError,
    setVolume,
    play,
    pause,
    togglePlay
  };
}

/**
 * 안전한 알림 관리 훅
 */
export function useSafeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const addNotification = useCallback((notification: any) => {
    const id = notification.id || Date.now().toString();
    const notificationWithId = { ...notification, id };

    setNotifications(prev => [notificationWithId, ...prev]);

    // 자동 제거 타이머 설정
    if (notification.autoHide !== false) {
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 4000);
      
      timeoutsRef.current.set(id, timeout);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // 해당 타이머 정리
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    
    // 모든 타이머 정리
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}

/**
 * 안전한 상태 업데이트 훅
 */
export function useSafeState<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setValue(newValue);
    }
  }, []);

  return [value, safeSetValue] as const;
}

/**
 * 디바운스 훅 (성능 최적화)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 안전한 Supabase 실시간 구독 훅
 */
export function useSafeRealtimeSubscription(
  supabase: any,
  table: string,
  filter?: string,
  onUpdate?: (payload: any) => void
) {
  const subscriptionRef = useRef<any>(null);
  const { execute } = useSafeAsync();

  useEffect(() => {
    if (!supabase) return;

    execute(
      async (signal) => {
        let query = supabase
          .channel(`realtime-${table}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: table,
              filter: filter 
            }, 
            (payload: any) => {
              if (!signal.aborted && onUpdate) {
                onUpdate(payload);
              }
            }
          );

        subscriptionRef.current = query;
        query.subscribe();
        
        return query;
      },
      {
        onError: (error) => {
          console.error('Realtime subscription error:', error);
        }
      }
    );

    // 정리 함수
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [supabase, table, filter, onUpdate, execute]);

  return subscriptionRef.current;
}

/**
 * 안전한 이벤트 리스너 훅
 */
export function useSafeEventListener(
  eventName: string,
  handler: (event: any) => void,
  element: HTMLElement | Window | Document = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: any) => savedHandler.current(event);

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * 안전한 인터벌 훅
 */
export function useSafeInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * 안전한 타임아웃 훅
 */
export function useSafeTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * 메모리 사용량 모니터링 훅
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

/**
 * 컴포넌트 언마운트 감지 훅
 */
export function useUnmountEffect(callback: () => void) {
  useEffect(() => {
    return callback;
  }, [callback]);
}

/**
 * 안전한 로컬 스토리지 훅
 */
export function useSafeLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

/**
 * 안전한 세션 스토리지 훅
 */
export function useSafeSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}