// 상태 디버깅을 위한 유틸리티 함수들

export interface StateSnapshot {
  timestamp: string;
  subscriptions: {
    count: number;
    totalPrice: number;
    activeCount: number;
  };
  notifications: {
    count: number;
    types: Record<string, number>;
  };
  currentScreen: string;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

export interface StateChange {
  property: string;
  previousValue: any;
  newValue: any;
  timestamp: string;
  stack?: string;
}

// 상태 스냅샷 생성
export const createStateSnapshot = (state: any): StateSnapshot => {
  return {
    timestamp: new Date().toISOString(),
    subscriptions: {
      count: state.subscriptions?.length || 0,
      totalPrice: state.subscriptions?.reduce((sum: number, sub: any) => sum + (sub.price || 0), 0) || 0,
      activeCount: state.subscriptions?.filter((sub: any) => sub.isActive !== false).length || 0
    },
    notifications: {
      count: state.notifications?.length || 0,
      types: state.notifications?.reduce((acc: Record<string, number>, notif: any) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {}) || {}
    },
    currentScreen: state.currentScreen || 'unknown',
    loading: {
      auth: state.loading?.auth || false,
      subscriptions: state.loading?.subscriptions || false,
      profile: state.loading?.profile || false
    },
    errors: {
      subscriptions: state.errors?.subscriptions || null,
      notifications: state.errors?.notifications || null,
      profile: state.errors?.profile || null
    }
  };
};

// 상태 변화 감지
export const detectStateChanges = (previousState: any, currentState: any): StateChange[] => {
  const changes: StateChange[] = [];
  
  const compareObjects = (prev: any, curr: any, path: string = '') => {
    if (prev === curr) return;
    
    if (Array.isArray(prev) && Array.isArray(curr)) {
      if (prev.length !== curr.length) {
        changes.push({
          property: `${path}.length`,
          previousValue: prev.length,
          newValue: curr.length,
          timestamp: new Date().toISOString()
        });
      }
      
      prev.forEach((item, index) => {
        compareObjects(item, curr[index], `${path}[${index}]`);
      });
    } else if (typeof prev === 'object' && typeof curr === 'object' && prev && curr) {
      const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
      
      allKeys.forEach(key => {
        const prevValue = prev[key];
        const currValue = curr[key];
        
        if (prevValue !== currValue) {
          changes.push({
            property: path ? `${path}.${key}` : key,
            previousValue: prevValue,
            newValue: currValue,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
          });
        }
      });
    } else if (prev !== curr) {
      changes.push({
        property: path,
        previousValue: prev,
        newValue: curr,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
    }
  };
  
  compareObjects(previousState, currentState);
  return changes;
};

// 상태 무결성 검증
export const validateStateIntegrity = (state: any): string[] => {
  const issues: string[] = [];
  
  // 구독 상태 검증
  if (state.subscriptions) {
    if (!Array.isArray(state.subscriptions)) {
      issues.push('subscriptions가 배열이 아닙니다');
    } else {
      state.subscriptions.forEach((sub: any, index: number) => {
        if (!sub.id) issues.push(`구독 ${index}: ID 누락`);
        if (!sub.name) issues.push(`구독 ${index}: 이름 누락`);
        if (typeof sub.price !== 'number' || isNaN(sub.price)) {
          issues.push(`구독 ${index}: 가격 타입 오류 (${sub.price})`);
        }
        if (!sub.currency) issues.push(`구독 ${index}: 통화 누락`);
        if (!sub.renewDate) issues.push(`구독 ${index}: 갱신일 누락`);
      });
    }
  }
  
  // 알림 상태 검증
  if (state.notifications) {
    if (!Array.isArray(state.notifications)) {
      issues.push('notifications가 배열이 아닙니다');
    } else {
      state.notifications.forEach((notif: any, index: number) => {
        if (!notif.id) issues.push(`알림 ${index}: ID 누락`);
        if (!['success', 'error', 'warning', 'info'].includes(notif.type)) {
          issues.push(`알림 ${index}: 잘못된 타입 (${notif.type})`);
        }
        if (!notif.title) issues.push(`알림 ${index}: 제목 누락`);
        if (!notif.message) issues.push(`알림 ${index}: 메시지 누락`);
      });
    }
  }
  
  // 화면 상태 검증
  const validScreens = ['main', 'add', 'edit', 'manage', 'detail', 'notifications', 'alarm-history', 'profile'];
  if (!validScreens.includes(state.currentScreen)) {
    issues.push(`잘못된 화면 상태: ${state.currentScreen}`);
  }
  
  // 로딩 상태 검증
  if (state.loading) {
    Object.entries(state.loading).forEach(([key, value]) => {
      if (typeof value !== 'boolean') {
        issues.push(`로딩 상태 ${key}: 불린 타입이 아닙니다 (${typeof value})`);
      }
    });
  }
  
  return issues;
};

// 성능 측정
export const measureStateUpdatePerformance = (updateFunction: () => void, label: string = 'State Update') => {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize;
  
  updateFunction();
  
  const endTime = performance.now();
  const endMemory = performance.memory?.usedJSHeapSize;
  
  const duration = endTime - startTime;
  const memoryDelta = startMemory && endMemory ? endMemory - startMemory : 0;
  
  console.log(`⚡ ${label}:`, {
    duration: `${duration.toFixed(2)}ms`,
    memoryDelta: memoryDelta ? `${(memoryDelta / 1024).toFixed(2)}KB` : 'N/A'
  });
  
  return { duration, memoryDelta };
};

// 브라우저 콘솔에서 사용할 디버깅 도구
export const createStateDebugger = (getState: () => any) => {
  let previousState: any = null;
  let changeHistory: StateChange[] = [];
  
  const debugger = {
    // 현재 상태 스냅샷
    getSnapshot: () => {
      const state = getState();
      return createStateSnapshot(state);
    },
    
    // 상태 변화 감지 시작
    startWatching: () => {
      previousState = JSON.parse(JSON.stringify(getState()));
      console.log('✅ 상태 변화 모니터링이 활성화되었습니다');
      
      // 주기적으로 상태 변화 확인
      const interval = setInterval(() => {
        const currentState = getState();
        const changes = detectStateChanges(previousState, currentState);
        
        if (changes.length > 0) {
          changes.forEach(change => {
            console.log(`🔄 상태 변경: ${change.property}`, {
              이전값: change.previousValue,
              새값: change.newValue,
              시간: change.timestamp
            });
          });
          
          changeHistory.push(...changes);
          previousState = JSON.parse(JSON.stringify(currentState));
        }
      }, 100);
      
      return () => clearInterval(interval);
    },
    
    // 상태 무결성 검사
    validateIntegrity: () => {
      const state = getState();
      const issues = validateStateIntegrity(state);
      
      if (issues.length > 0) {
        console.warn('🚨 상태 무결성 문제 발견:', issues);
      } else {
        console.log('✅ 상태 무결성 검사 통과');
      }
      
      return issues;
    },
    
    // 변화 히스토리
    getChangeHistory: () => changeHistory,
    
    // 메모리 사용량 체크
    checkMemoryUsage: () => {
      if (performance.memory) {
        const memory = performance.memory;
        console.log('💾 메모리 사용량:', {
          사용중: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          총할당: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          제한: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        });
      }
    },
    
    // 성능 측정
    measureUpdate: (updateFunction: () => void, label?: string) => {
      return measureStateUpdatePerformance(updateFunction, label);
    },
    
    // 상태 초기화
    reset: () => {
      previousState = null;
      changeHistory = [];
      console.log('🔄 상태 디버거가 초기화되었습니다');
    }
  };
  
  return debugger;
};

// 전역 디버거 인스턴스
let globalStateDebugger: ReturnType<typeof createStateDebugger> | null = null;

export const setGlobalStateDebugger = (debugger: ReturnType<typeof createStateDebugger>) => {
  globalStateDebugger = debugger;
  
  // 브라우저 전역 객체에 노출
  if (typeof window !== 'undefined') {
    (window as any).moonwaveDebugger = debugger;
  }
};

export const getGlobalStateDebugger = () => globalStateDebugger;