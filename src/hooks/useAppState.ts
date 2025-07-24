import { useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { Subscription } from '../types/subscription';
import { Notification } from './useNotifications';

// 상태 타입 정의
export interface AppState {
  // 구독 관련 상태
  subscriptions: Subscription[];
  isAddingSubscription: boolean;
  isUpdatingSubscription: boolean;
  editingSubscription: Subscription | null;
  selectedSubscription: Subscription | null;
  
  // 알림 관련 상태
  notifications: Notification[];
  showNotification: boolean;
  alarmHistory: any[];
  
  // 화면 상태
  currentScreen: 'main' | 'add' | 'edit' | 'manage' | 'detail' | 'notifications' | 'alarm-history' | 'profile';
  
  // 사용자 상태
  profile: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
    coverPhoto?: string;
  };
  
  // 로딩 상태
  loading: {
    auth: boolean;
    subscriptions: boolean;
    profile: boolean;
  };
  
  // 오류 상태
  errors: {
    subscriptions: string | null;
    notifications: string | null;
    profile: string | null;
  };
}

// 액션 타입 정의
export type AppAction =
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }
  | { type: 'DELETE_SUBSCRIPTION'; payload: number }
  | { type: 'SET_LOADING'; key: keyof AppState['loading']; value: boolean }
  | { type: 'SET_ERROR'; key: keyof AppState['errors']; value: string | null }
  | { type: 'SET_CURRENT_SCREEN'; payload: AppState['currentScreen'] }
  | { type: 'SET_EDITING_SUBSCRIPTION'; payload: Subscription | null }
  | { type: 'SET_SELECTED_SUBSCRIPTION'; payload: Subscription | null }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_SHOW_NOTIFICATION'; payload: boolean }
  | { type: 'SET_ALARM_HISTORY'; payload: any[] }
  | { type: 'UPDATE_PROFILE'; payload: Partial<AppState['profile']> }
  | { type: 'RESET_STATE' };

// 초기 상태
const initialState: AppState = {
  subscriptions: [],
  isAddingSubscription: false,
  isUpdatingSubscription: false,
  editingSubscription: null,
  selectedSubscription: null,
  notifications: [],
  showNotification: false,
  alarmHistory: [],
  currentScreen: 'main',
  profile: {
    username: '',
    firstName: '',
    lastName: '',
    email: ''
  },
  loading: {
    auth: false,
    subscriptions: false,
    profile: false
  },
  errors: {
    subscriptions: null,
    notifications: null,
    profile: null
  }
};

// 리듀서 함수
const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };
      
    case 'ADD_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: [action.payload, ...state.subscriptions],
        isAddingSubscription: false,
        currentScreen: 'main',
        editingSubscription: null
      };
      
    case 'UPDATE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.map(sub =>
          sub.id === action.payload.id ? action.payload : sub
        ),
        isUpdatingSubscription: false,
        currentScreen: 'main',
        editingSubscription: null
      };
      
    case 'DELETE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.filter(sub => sub.id !== action.payload)
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.key]: action.value }
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.key]: action.value }
      };
      
    case 'SET_CURRENT_SCREEN':
      return { ...state, currentScreen: action.payload };
      
    case 'SET_EDITING_SUBSCRIPTION':
      return { ...state, editingSubscription: action.payload };
      
    case 'SET_SELECTED_SUBSCRIPTION':
      return { ...state, selectedSubscription: action.payload };
      
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 4)],
        showNotification: true
      };
      
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        showNotification: false
      };
      
    case 'SET_SHOW_NOTIFICATION':
      return { ...state, showNotification: action.payload };
      
    case 'SET_ALARM_HISTORY':
      return { ...state, alarmHistory: action.payload };
      
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: { ...state.profile, ...action.payload }
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
};

// 안전한 상태 업데이트를 위한 커스텀 훅
export const useAppState = () => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const mountedRef = useRef(true);

  // 마운트 상태 추적
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 안전한 디스패치 함수
  const safeDispatch = useCallback((action: AppAction) => {
    if (mountedRef.current) {
      dispatch(action);
    }
  }, []);

  // 액션 생성자들
  const actions = useMemo(() => ({
    // 구독 관련 액션
    setSubscriptions: (subscriptions: Subscription[]) =>
      safeDispatch({ type: 'SET_SUBSCRIPTIONS', payload: subscriptions }),
      
    addSubscription: (subscription: Subscription) =>
      safeDispatch({ type: 'ADD_SUBSCRIPTION', payload: subscription }),
      
    updateSubscription: (subscription: Subscription) =>
      safeDispatch({ type: 'UPDATE_SUBSCRIPTION', payload: subscription }),
      
    deleteSubscription: (id: number) =>
      safeDispatch({ type: 'DELETE_SUBSCRIPTION', payload: id }),
      
    setEditingSubscription: (subscription: Subscription | null) =>
      safeDispatch({ type: 'SET_EDITING_SUBSCRIPTION', payload: subscription }),
      
    setSelectedSubscription: (subscription: Subscription | null) =>
      safeDispatch({ type: 'SET_SELECTED_SUBSCRIPTION', payload: subscription }),
      
    // 로딩 상태 액션
    setLoading: (key: keyof AppState['loading'], value: boolean) =>
      safeDispatch({ type: 'SET_LOADING', key, value }),
      
    // 오류 상태 액션
    setError: (key: keyof AppState['errors'], value: string | null) =>
      safeDispatch({ type: 'SET_ERROR', key, value }),
      
    // 화면 상태 액션
    setCurrentScreen: (screen: AppState['currentScreen']) =>
      safeDispatch({ type: 'SET_CURRENT_SCREEN', payload: screen }),
      
    // 알림 관련 액션
    addNotification: (notification: Notification) =>
      safeDispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
      
    removeNotification: (id: string) =>
      safeDispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
      
    clearNotifications: () =>
      safeDispatch({ type: 'CLEAR_NOTIFICATIONS' }),
      
    setShowNotification: (show: boolean) =>
      safeDispatch({ type: 'SET_SHOW_NOTIFICATION', payload: show }),
      
    setAlarmHistory: (history: any[]) =>
      safeDispatch({ type: 'SET_ALARM_HISTORY', payload: history }),
      
    // 프로필 관련 액션
    updateProfile: (updates: Partial<AppState['profile']>) =>
      safeDispatch({ type: 'UPDATE_PROFILE', payload: updates }),
      
    // 상태 초기화
    resetState: () =>
      safeDispatch({ type: 'RESET_STATE' })
  }), [safeDispatch]);

  return { state, actions };
};