import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentUser, 
  getCurrentSession, 
  onAuthStateChange, 
  signOut 
} from '../lib/googleAuth';

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    picture?: string;
  };
  app_metadata?: {
    provider?: string;
  };
}

export interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthActions {
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [userResult, sessionResult] = await Promise.all([
        getCurrentUser(),
        getCurrentSession()
      ]);

      if (userResult.success && sessionResult.success) {
        setState(prev => ({
          ...prev,
          user: userResult.user,
          session: sessionResult.session,
          isAuthenticated: !!userResult.user,
          isLoading: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: userResult.error || sessionResult.error || null,
        }));
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 오류:', error);
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : '사용자 정보를 가져올 수 없습니다.',
      }));
    }
  }, []);

  // 로그아웃
  const handleSignOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await signOut();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }));
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || '로그아웃에 실패했습니다.',
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 초기 인증 상태 확인 및 리스너 설정
  useEffect(() => {
    console.log('useAuth: 초기화 시작');

    // 초기 사용자 정보 로드
    refreshUser();

    // 인증 상태 변화 리스너 설정
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('useAuth: 인증 상태 변화', { event, userEmail: session?.user?.email });

      switch (event) {
        case 'SIGNED_IN':
          setState(prev => ({
            ...prev,
            user: session?.user || null,
            session: session,
            isAuthenticated: !!session?.user,
            isLoading: false,
            error: null,
          }));
          break;

        case 'SIGNED_OUT':
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          }));
          break;

        case 'TOKEN_REFRESHED':
          setState(prev => ({
            ...prev,
            session: session,
            isLoading: false,
          }));
          break;

        case 'USER_UPDATED':
          setState(prev => ({
            ...prev,
            user: session?.user || null,
            session: session,
            isLoading: false,
          }));
          break;

        default:
          console.log('useAuth: 처리되지 않은 인증 이벤트', event);
      }
    });

    // 클린업 함수
    return () => {
      console.log('useAuth: 리스너 정리');
      subscription?.unsubscribe();
    };
  }, [refreshUser]);

  // 디버그 로그 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useAuth 상태 변화:', {
        isAuthenticated: state.isAuthenticated,
        userEmail: state.user?.email,
        isLoading: state.isLoading,
        hasError: !!state.error,
      });
    }
  }, [state.isAuthenticated, state.user?.email, state.isLoading, state.error]);

  return {
    ...state,
    signOut: handleSignOut,
    refreshUser,
    clearError,
  };
};