import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  useSafeAsync, 
  useSafeAudio, 
  useSafeNotifications, 
  useSafeState, 
  useDebounce, 
  useSafeEventListener,
  useSafeInterval,
  useSafeTimeout,
  useMemoryMonitor,
  useSafeLocalStorage
} from '../hooks/useMemorySafeApp';

/**
 * 메모리 안전한 컴포넌트 예시
 * 
 * 🔴 해결된 문제들:
 * 1. useEffect 의존성 배열 누락
 * 2. 이벤트 리스너 정리 누락
 * 3. 불필요한 리렌더링
 * 4. 메모리 누수 방지
 */
const MemorySafeExample: React.FC = () => {
  // 🔧 안전한 상태 관리
  const [searchTerm, setSearchTerm] = useSafeState('');
  const [isLoading, setIsLoading] = useSafeState(false);
  const [data, setData] = useSafeState<any[]>([]);
  
  // 🔧 디바운스된 검색어 (성능 최적화)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // 🔧 안전한 비동기 작업
  const { execute, isMounted } = useSafeAsync();
  
  // 🔧 안전한 알림 관리
  const { notifications, addNotification, removeNotification, clearAllNotifications } = useSafeNotifications();
  
  // 🔧 안전한 오디오 관리
  const audio = useSafeAudio('/path/to/audio.mp3');
  
  // 🔧 안전한 로컬 스토리지
  const [userPreferences, setUserPreferences] = useSafeLocalStorage('user-preferences', {
    theme: 'light',
    language: 'ko',
    notifications: true
  });
  
  // 🔧 메모리 모니터링
  const memoryInfo = useMemoryMonitor();
  
  // 🔧 refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ 올바른 의존성 배열을 가진 useEffect
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setData([]);
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const result = await execute(
          async (signal) => {
            const response = await fetch(`/api/search?q=${debouncedSearchTerm}`, {
              signal
            });
            
            if (!response.ok) {
              throw new Error('Search failed');
            }
            
            return response.json();
          },
          {
            onSuccess: (data) => {
              setData(data);
              addNotification({
                type: 'success',
                title: '검색 완료',
                message: `${data.length}개의 결과를 찾았습니다.`,
                duration: 3000
              });
            },
            onError: (error) => {
              console.error('Search error:', error);
              addNotification({
                type: 'error',
                title: '검색 실패',
                message: '검색 중 오류가 발생했습니다.',
                duration: 5000
              });
            },
            onFinally: () => {
              setIsLoading(false);
            }
          }
        );
      } catch (error) {
        console.error('Search failed:', error);
      }
    };
    
    fetchData();
  }, [debouncedSearchTerm, execute, setData, setIsLoading, addNotification]); // ✅ 명시적 의존성 배열
  
  // ✅ 안전한 이벤트 리스너
  useSafeEventListener('resize', () => {
    console.log('Window resized');
  }, window);
  
  // ✅ 안전한 인터벌 (컴포넌트 언마운트 시 자동 정리)
  useSafeInterval(() => {
    console.log('Periodic task executed');
  }, 5000);
  
  // ✅ 안전한 타임아웃
  useSafeTimeout(() => {
    console.log('Delayed task executed');
  }, 3000);
  
  // ✅ 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 모든 타이머 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // ✅ 메모이제이션된 콜백 함수들
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setData([]);
  }, [setSearchTerm, setData]);
  
  const handlePlayAudio = useCallback(async () => {
    const success = await audio.play();
    if (success) {
      addNotification({
        type: 'success',
        title: '오디오 재생',
        message: '오디오가 재생됩니다.',
        duration: 2000
      });
    }
  }, [audio, addNotification]);
  
  const handleUpdatePreferences = useCallback((updates: Partial<typeof userPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...updates }));
  }, [setUserPreferences]);
  
  // ✅ 조건부 렌더링으로 불필요한 리렌더링 방지
  const renderSearchResults = useCallback(() => {
    if (isLoading) {
      return <div className="text-center py-4">검색 중...</div>;
    }
    
    if (data.length === 0 && searchTerm) {
      return <div className="text-center py-4 text-gray-500">검색 결과가 없습니다.</div>;
    }
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="p-3 bg-white rounded shadow">
            {item.name}
          </div>
        ))}
      </div>
    );
  }, [isLoading, data, searchTerm]);
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">메모리 안전한 컴포넌트 예시</h1>
      
      {/* 🔧 검색 기능 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">검색 기능 (디바운스 적용)</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="검색어를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            초기화
          </button>
        </div>
        {renderSearchResults()}
      </div>
      
      {/* 🔧 오디오 컨트롤 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">오디오 컨트롤</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={audio.togglePlay}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {audio.isPlaying ? '일시정지' : '재생'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audio.volume}
            onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
            className="w-32"
          />
          <span>볼륨: {Math.round(audio.volume * 100)}%</span>
        </div>
        {audio.hasError && (
          <div className="text-red-500">오디오 로드 중 오류가 발생했습니다.</div>
        )}
      </div>
      
      {/* 🔧 알림 시스템 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">알림 시스템</h2>
        <div className="flex gap-2">
          <button
            onClick={() => addNotification({
              type: 'success',
              title: '성공 알림',
              message: '작업이 성공적으로 완료되었습니다.',
              duration: 3000
            })}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            성공 알림
          </button>
          <button
            onClick={() => addNotification({
              type: 'error',
              title: '오류 알림',
              message: '작업 중 오류가 발생했습니다.',
              duration: 5000
            })}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            오류 알림
          </button>
          <button
            onClick={clearAllNotifications}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            모든 알림 지우기
          </button>
        </div>
        
        {/* 알림 목록 */}
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-md ${
                notification.type === 'success' ? 'bg-green-100 border border-green-300' :
                notification.type === 'error' ? 'bg-red-100 border border-red-300' :
                notification.type === 'warning' ? 'bg-yellow-100 border border-yellow-300' :
                'bg-blue-100 border border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{notification.title}</h4>
                  <p className="text-sm">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 🔧 사용자 설정 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">사용자 설정 (로컬 스토리지)</h2>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={userPreferences.notifications}
              onChange={(e) => handleUpdatePreferences({ notifications: e.target.checked })}
              className="mr-2"
            />
            알림 받기
          </label>
          <select
            value={userPreferences.theme}
            onChange={(e) => handleUpdatePreferences({ theme: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="light">라이트 테마</option>
            <option value="dark">다크 테마</option>
          </select>
        </div>
      </div>
      
      {/* 🔧 메모리 모니터링 */}
      {memoryInfo && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">메모리 사용량</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-100 rounded">
              <div className="font-semibold">사용 중</div>
              <div>{(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <div className="p-3 bg-gray-100 rounded">
              <div className="font-semibold">총 힙 크기</div>
              <div>{(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <div className="p-3 bg-gray-100 rounded">
              <div className="font-semibold">힙 제한</div>
              <div>{(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔧 컴포넌트 상태 표시 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">컴포넌트 상태</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-blue-100 rounded">
            <div className="font-semibold">마운트 상태</div>
            <div>{isMounted() ? '마운트됨' : '언마운트됨'}</div>
          </div>
          <div className="p-3 bg-green-100 rounded">
            <div className="font-semibold">오디오 상태</div>
            <div>{audio.isPlaying ? '재생 중' : '정지됨'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorySafeExample;