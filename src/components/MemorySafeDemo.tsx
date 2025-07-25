import React, { useState, useEffect, useCallback } from 'react';
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
  useSafeLocalStorage,
  useSafeRealtimeSubscription
} from '../hooks/useMemorySafeApp';
import { Play, Pause, Volume2, VolumeX, Bell, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * 메모리 안전한 훅들 데모 컴포넌트
 * 
 * 이 컴포넌트는 메모리 누수 방지를 위한 안전한 훅들의 실제 사용 예시를 보여줍니다.
 */
const MemorySafeDemo: React.FC = () => {
  // 🔧 안전한 상태 관리
  const [searchTerm, setSearchTerm] = useSafeState('');
  const [isLoading, setIsLoading] = useSafeState(false);
  const [searchResults, setSearchResults] = useSafeState<any[]>([]);
  const [counter, setCounter] = useSafeState(0);
  
  // 🔧 디바운스된 검색어 (성능 최적화)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // 🔧 안전한 비동기 작업
  const { execute, isMounted } = useSafeAsync();
  
  // 🔧 안전한 알림 관리
  const { notifications, addNotification, removeNotification, clearAllNotifications } = useSafeNotifications();
  
  // 🔧 안전한 오디오 관리
  const audio = useSafeAudio('/path/to/demo-audio.mp3');
  
  // 🔧 안전한 로컬 스토리지
  const [userSettings, setUserSettings] = useSafeLocalStorage('demo-settings', {
    theme: 'light',
    autoPlay: false,
    notifications: true,
    volume: 0.5
  });
  
  // 🔧 메모리 모니터링
  const memoryInfo = useMemoryMonitor();
  
  // ✅ 안전한 이벤트 리스너들
  useSafeEventListener('resize', () => {
    console.log('Window resized');
  }, window);
  
  useSafeEventListener('online', () => {
    addNotification({
      type: 'success',
      title: '인터넷 연결',
      message: '인터넷에 다시 연결되었습니다.',
      duration: 3000
    });
  }, window);
  
  useSafeEventListener('offline', () => {
    addNotification({
      type: 'warning',
      title: '인터넷 연결 끊김',
      message: '인터넷 연결이 끊어졌습니다.',
      duration: 5000
    });
  }, window);
  
  // ✅ 안전한 인터벌 (컴포넌트 언마운트 시 자동 정리)
  useSafeInterval(() => {
    setCounter(prev => prev + 1);
  }, 1000);
  
  // ✅ 안전한 타임아웃
  useSafeTimeout(() => {
    addNotification({
      type: 'info',
      title: '환영합니다!',
      message: '메모리 안전한 데모에 오신 것을 환영합니다.',
      duration: 4000
    });
  }, 2000);
  
  // ✅ 검색 기능 (디바운스 적용)
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setSearchResults([]);
      return;
    }
    
    const performSearch = async () => {
      setIsLoading(true);
      
      try {
        await execute(
          async (signal) => {
            // 실제 API 호출 대신 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (signal.aborted) {
              throw new Error('Search cancelled');
            }
            
            return [
              { id: 1, name: `검색 결과 1 for "${debouncedSearchTerm}"` },
              { id: 2, name: `검색 결과 2 for "${debouncedSearchTerm}"` },
              { id: 3, name: `검색 결과 3 for "${debouncedSearchTerm}"` }
            ];
          },
          {
            onSuccess: (data) => {
              setSearchResults(data);
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
    
    performSearch();
  }, [debouncedSearchTerm, execute, setSearchResults, setIsLoading, addNotification]);
  
  // ✅ 메모이제이션된 콜백 함수들
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
  }, [setSearchTerm, setSearchResults]);
  
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
  
  const handleUpdateSettings = useCallback((updates: Partial<typeof userSettings>) => {
    setUserSettings(prev => ({ ...prev, ...updates }));
  }, [setUserSettings]);
  
  const handleTestNotification = useCallback((type: 'success' | 'error' | 'warning' | 'info') => {
    const notifications = {
      success: { title: '성공 알림', message: '작업이 성공적으로 완료되었습니다.' },
      error: { title: '오류 알림', message: '작업 중 오류가 발생했습니다.' },
      warning: { title: '경고 알림', message: '주의가 필요한 상황입니다.' },
      info: { title: '정보 알림', message: '유용한 정보입니다.' }
    };
    
    addNotification({
      type,
      title: notifications[type].title,
      message: notifications[type].message,
      duration: 4000
    });
  }, [addNotification]);
  
  // ✅ 조건부 렌더링으로 불필요한 리렌더링 방지
  const renderSearchResults = useCallback(() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">검색 중...</span>
        </div>
      );
    }
    
    if (searchResults.length === 0 && searchTerm) {
      return (
        <div className="text-center py-8 text-gray-500">
          검색 결과가 없습니다.
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {searchResults.map((item) => (
          <div key={item.id} className="p-3 bg-white rounded-lg shadow border">
            {item.name}
          </div>
        ))}
      </div>
    );
  }, [isLoading, searchResults, searchTerm]);
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <X className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">메모리 안전한 훅 데모</h1>
        <p className="text-gray-600">메모리 누수 방지를 위한 안전한 훅들의 실제 사용 예시</p>
      </div>
      
      {/* 🔧 검색 기능 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🔍 검색 기능 (디바운스 적용)</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="검색어를 입력하세요... (500ms 디바운스)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              초기화
            </button>
          </div>
          {renderSearchResults()}
        </div>
      </div>
      
      {/* 🔧 오디오 컨트롤 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🎵 오디오 컨트롤</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={audio.togglePlay}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {audio.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">볼륨:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audio.volume}
                  onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">{Math.round(audio.volume * 100)}%</span>
              </div>
            </div>
            
            <button
              onClick={handlePlayAudio}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              재생 테스트
            </button>
          </div>
          
          {audio.hasError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              오디오 로드 중 오류가 발생했습니다.
            </div>
          )}
        </div>
      </div>
      
      {/* 🔧 알림 시스템 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🔔 알림 시스템</h2>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTestNotification('success')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              성공 알림
            </button>
            <button
              onClick={() => handleTestNotification('error')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              오류 알림
            </button>
            <button
              onClick={() => handleTestNotification('warning')}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              경고 알림
            </button>
            <button
              onClick={() => handleTestNotification('info')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              정보 알림
            </button>
            <button
              onClick={clearAllNotifications}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              모든 알림 지우기
            </button>
          </div>
          
          {/* 알림 목록 */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.type === 'success' ? 'bg-green-50 border-green-200' :
                  notification.type === 'error' ? 'bg-red-50 border-red-200' :
                  notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div>
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 🔧 사용자 설정 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">⚙️ 사용자 설정 (로컬 스토리지)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={userSettings.notifications}
                onChange={(e) => handleUpdateSettings({ notifications: e.target.checked })}
                className="mr-2"
              />
              알림 받기
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={userSettings.autoPlay}
                onChange={(e) => handleUpdateSettings({ autoPlay: e.target.checked })}
                className="mr-2"
              />
              자동 재생
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">테마</label>
              <select
                value={userSettings.theme}
                onChange={(e) => handleUpdateSettings({ theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">라이트 테마</option>
                <option value="dark">다크 테마</option>
                <option value="auto">시스템 설정</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">기본 볼륨</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={userSettings.volume}
              onChange={(e) => handleUpdateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>0%</span>
              <span>{Math.round(userSettings.volume * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🔧 실시간 카운터 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">⏱️ 실시간 카운터 (안전한 인터벌)</h2>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{counter}</div>
          <p className="text-gray-600">1초마다 자동으로 증가합니다 (컴포넌트 언마운트 시 자동 정리)</p>
        </div>
      </div>
      
      {/* 🔧 메모리 모니터링 */}
      {memoryInfo && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💾 메모리 사용량 모니터링</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="font-semibold text-gray-700">사용 중</div>
              <div className="text-2xl font-bold text-blue-600">
                {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="font-semibold text-gray-700">총 힙 크기</div>
              <div className="text-2xl font-bold text-green-600">
                {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="font-semibold text-gray-700">힙 제한</div>
              <div className="text-2xl font-bold text-purple-600">
                {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔧 컴포넌트 상태 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📊 컴포넌트 상태</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-100 rounded-lg">
            <div className="font-semibold text-blue-700">마운트 상태</div>
            <div className="text-lg">{isMounted() ? '✅ 마운트됨' : '❌ 언마운트됨'}</div>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <div className="font-semibold text-green-700">오디오 상태</div>
            <div className="text-lg">{audio.isPlaying ? '🎵 재생 중' : '⏸️ 정지됨'}</div>
          </div>
        </div>
      </div>
      
      {/* 🔧 기능 설명 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">ℹ️ 구현된 안전 기능들</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>useEffect 의존성 배열 명시</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>이벤트 리스너 자동 정리</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>콜백 함수 메모이제이션</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>비동기 작업 취소 처리</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>타이머 자동 정리</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>디바운스 성능 최적화</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>메모리 사용량 모니터링</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>컴포넌트 언마운트 감지</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorySafeDemo;