# 🚨 메모리 누수 및 성능 문제 해결 가이드

## 🔴 주요 문제점들

### 1. useEffect 의존성 배열 누락
```typescript
// ❌ 잘못된 예시
useEffect(() => {
  fetchData();
}, []); // 의존성 배열이 비어있지만 fetchData는 외부 변수에 의존

// ✅ 올바른 예시
useEffect(() => {
  fetchData();
}, [fetchData]); // 명시적 의존성 배열
```

### 2. 이벤트 리스너 정리 누락
```typescript
// ❌ 잘못된 예시
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // 정리 함수 없음
}, []);

// ✅ 올바른 예시
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [handleResize]);
```

### 3. 불필요한 리렌더링
```typescript
// ❌ 잘못된 예시
const handleClick = () => {
  setCount(count + 1);
}; // 매번 새로운 함수 생성

// ✅ 올바른 예시
const handleClick = useCallback(() => {
  setCount(prev => prev + 1);
}, []); // 메모이제이션
```

## 💡 해결방안

### 📁 src/hooks/useMemorySafeApp.ts

메모리 안전한 훅들을 제공하여 일반적인 메모리 누수 문제를 방지합니다.

#### 주요 훅들:

1. **useSafeAsync**: 안전한 비동기 작업
2. **useSafeAudio**: 안전한 오디오 관리
3. **useSafeNotifications**: 안전한 알림 관리
4. **useSafeState**: 안전한 상태 업데이트
5. **useDebounce**: 디바운스 (성능 최적화)
6. **useSafeEventListener**: 안전한 이벤트 리스너
7. **useSafeInterval**: 안전한 인터벌
8. **useSafeTimeout**: 안전한 타임아웃
9. **useMemoryMonitor**: 메모리 사용량 모니터링
10. **useSafeLocalStorage**: 안전한 로컬 스토리지

## 🔧 사용 예시

### 1. 안전한 비동기 작업
```typescript
import { useSafeAsync } from '../hooks/useMemorySafeApp';

const MyComponent = () => {
  const { execute } = useSafeAsync();

  const fetchData = useCallback(async () => {
    await execute(
      async (signal) => {
        const response = await fetch('/api/data', { signal });
        return response.json();
      },
      {
        onSuccess: (data) => {
          setData(data);
        },
        onError: (error) => {
          console.error('Fetch failed:', error);
        }
      }
    );
  }, [execute]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
};
```

### 2. 안전한 오디오 관리
```typescript
import { useSafeAudio } from '../hooks/useMemorySafeApp';

const AudioPlayer = () => {
  const audio = useSafeAudio('/path/to/audio.mp3');

  return (
    <div>
      <button onClick={audio.togglePlay}>
        {audio.isPlaying ? '일시정지' : '재생'}
      </button>
      <input
        type="range"
        value={audio.volume}
        onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
      />
    </div>
  );
};
```

### 3. 안전한 알림 관리
```typescript
import { useSafeNotifications } from '../hooks/useMemorySafeApp';

const NotificationManager = () => {
  const { notifications, addNotification, removeNotification } = useSafeNotifications();

  const handleSuccess = () => {
    addNotification({
      type: 'success',
      title: '성공',
      message: '작업이 완료되었습니다.',
      duration: 3000
    });
  };

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.title}
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
    </div>
  );
};
```

### 4. 디바운스 (성능 최적화)
```typescript
import { useDebounce } from '../hooks/useMemorySafeApp';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // 검색 API 호출
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
};
```

### 5. 안전한 이벤트 리스너
```typescript
import { useSafeEventListener } from '../hooks/useMemorySafeApp';

const WindowListener = () => {
  useSafeEventListener('resize', () => {
    console.log('Window resized');
  }, window);

  useSafeEventListener('online', () => {
    console.log('Back online');
  }, window);
};
```

### 6. 메모리 모니터링
```typescript
import { useMemoryMonitor } from '../hooks/useMemorySafeApp';

const MemoryMonitor = () => {
  const memoryInfo = useMemoryMonitor();

  if (memoryInfo) {
    return (
      <div>
        <p>사용 중: {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</p>
        <p>총 힙: {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</p>
        <p>힙 제한: {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    );
  }

  return null;
};
```

## 🛠️ 기존 코드 개선 방법

### 1. useEffect 의존성 배열 수정
```typescript
// 기존 코드
useEffect(() => {
  loadData();
}, []);

// 개선된 코드
useEffect(() => {
  loadData();
}, [loadData]); // loadData를 useCallback으로 메모이제이션
```

### 2. 이벤트 리스너 정리 추가
```typescript
// 기존 코드
useEffect(() => {
  const handleResize = () => console.log('resized');
  window.addEventListener('resize', handleResize);
}, []);

// 개선된 코드
useEffect(() => {
  const handleResize = () => console.log('resized');
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 3. 콜백 함수 메모이제이션
```typescript
// 기존 코드
const handleClick = () => {
  setCount(count + 1);
};

// 개선된 코드
const handleClick = useCallback(() => {
  setCount(prev => prev + 1);
}, []);
```

## 📊 성능 모니터링

### 1. React DevTools Profiler 사용
- 컴포넌트 렌더링 시간 측정
- 불필요한 리렌더링 식별
- 메모리 사용량 추적

### 2. Chrome DevTools Memory 탭
- 메모리 힙 스냅샷 생성
- 메모리 누수 식별
- 가비지 컬렉션 분석

### 3. Lighthouse 성능 감사
- 전체적인 성능 점수
- 최적화 권장사항
- 메모리 사용량 분석

## 🚀 추가 최적화 팁

### 1. React.memo 사용
```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* 복잡한 렌더링 */}</div>;
});
```

### 2. useMemo 사용
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 3. 가상화 사용 (대용량 리스트)
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index]}
      </div>
    )}
  </List>
);
```

### 4. 코드 스플리팅
```typescript
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
  </Suspense>
);
```

## 🔍 디버깅 도구

### 1. ESLint 규칙 추가
```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error"
  }
}
```

### 2. React DevTools 설정
- Highlight updates when components render
- Record why each component rendered

### 3. 성능 모니터링 스크립트
```typescript
// 성능 모니터링
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance:', entry);
  }
});

performanceObserver.observe({ entryTypes: ['measure'] });
```

## 📝 체크리스트

- [ ] useEffect 의존성 배열 확인
- [ ] 이벤트 리스너 정리 함수 추가
- [ ] 콜백 함수 useCallback으로 메모이제이션
- [ ] 불필요한 상태 업데이트 제거
- [ ] 메모리 누수 가능성 있는 코드 검토
- [ ] 성능 모니터링 도구 설정
- [ ] 코드 스플리팅 적용
- [ ] 가상화 고려 (대용량 데이터)
- [ ] React.memo 적절히 사용
- [ ] useMemo로 계산 최적화

이 가이드를 따라 메모리 누수와 성능 문제를 효과적으로 해결할 수 있습니다.