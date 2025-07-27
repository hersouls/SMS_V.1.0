import { supabase } from './supabase';

/**
 * Google OAuth 로그인 함수
 */
export const signInWithGoogle = async () => {
  try {
    console.log('Google OAuth 로그인 시작...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Google 로그인 오류:', error);
      return { success: false, error: error.message };
    }

    console.log('Google OAuth URL 생성됨:', data?.url);
    return { success: true, data };
  } catch (error) {
    console.error('Google 로그인 예외:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    };
  }
};

/**
 * 인증 콜백 처리 함수
 */
export const handleAuthCallback = async () => {
  try {
    console.log('인증 콜백 처리 시작...');
    
    // URL에서 인증 정보 자동 처리 (Supabase가 자동으로 처리)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('인증 콜백 오류:', error);
      return { success: false, error: error.message };
    }

    if (data.session) {
      console.log('인증 성공:', {
        userId: data.session.user.id,
        email: data.session.user.email,
        provider: data.session.user.app_metadata?.provider
      });
      return { success: true, session: data.session, user: data.session.user };
    }

    console.log('세션이 아직 생성되지 않음, 잠시 후 다시 시도...');
    return { success: false, error: '세션을 찾을 수 없습니다.' };
  } catch (error) {
    console.error('인증 콜백 예외:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 로그아웃 함수
 */
export const signOut = async () => {
  try {
    console.log('로그아웃 시작...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('로그아웃 오류:', error);
      return { success: false, error: error.message };
    }

    console.log('로그아웃 성공');
    return { success: true };
  } catch (error) {
    console.error('로그아웃 예외:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 현재 인증 상태 확인
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('사용자 정보 조회 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('사용자 정보 조회 예외:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '사용자 정보 조회 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 현재 세션 확인
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('세션 조회 오류:', error);
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session };
  } catch (error) {
    console.error('세션 조회 예외:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '세션 조회 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 인증 상태 변화 리스너 설정
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('인증 상태 변화:', event, session?.user?.email);
    callback(event, session);
  });
};

/**
 * Google OAuth 설정 테스트
 */
export const testGoogleOAuthSetup = async () => {
  try {
    console.log('Google OAuth 설정 테스트 시작...');
    
    // 환경 변수 확인
    const requiredEnvVars = {
      REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
      REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
      REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return {
        success: false,
        error: `누락된 환경 변수: ${missingVars.join(', ')}`
      };
    }

    // Supabase 연결 테스트
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        success: false,
        error: `Supabase 연결 오류: ${error.message}`
      };
    }

    console.log('Google OAuth 설정 테스트 완료');
    return {
      success: true,
      message: 'Google OAuth 설정이 올바르게 구성되었습니다.',
      currentSession: data.session
    };
  } catch (error) {
    console.error('Google OAuth 설정 테스트 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google OAuth 설정 테스트 중 오류가 발생했습니다.'
    };
  }
};