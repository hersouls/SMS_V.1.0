import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthState, AuthState } from '../lib/authManager';
import { supabase } from '../lib/supabase';

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  diagnoseIssues: () => Promise<{ issues: string[]; recommendations: string[] }>;
  // 기존 SupabaseContext와의 호환성을 위한 추가 속성들
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  checkProfileStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuthState(supabase);

  // 기존 SupabaseContext와의 호환성을 위한 메서드들
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const updateProfile = async (updates: any) => {
    if (!authState.user) throw new Error('사용자가 로그인되지 않았습니다.');
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authState.user.id);
    
    if (error) throw error;
    await authState.refreshProfile();
  };

  const checkProfileStatus = () => {
    // 프로필 상태 확인 로직
    console.log('Profile status check:', authState.profile);
  };

  const diagnoseIssues = async (): Promise<{ issues: string[]; recommendations: string[] }> => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // OAuth 설정 확인
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      issues.push('Google OAuth Client ID가 설정되지 않았습니다.');
      recommendations.push('환경 변수 REACT_APP_GOOGLE_CLIENT_ID를 설정하세요.');
    }

    // Supabase 설정 확인
    if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
      issues.push('Supabase 설정이 완료되지 않았습니다.');
      recommendations.push('환경 변수 REACT_APP_SUPABASE_URL과 REACT_APP_SUPABASE_ANON_KEY를 설정하세요.');
    }

    // 인증 상태 확인
    if (!authState.isAuthenticated) {
      issues.push('사용자가 로그인되지 않았습니다.');
      recommendations.push('Google 로그인을 시도해보세요.');
    }

    return { issues, recommendations };
  };

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    updateProfile,
    checkProfileStatus,
    diagnoseIssues,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}