import { useState, useEffect, useRef, useCallback } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  timezone?: string;
  currency_preference?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * 안전한 인증 관리자
 */
export class SafeAuthManager {
  private supabase: any;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * 프로필 자동 생성 (재시도 로직 포함)
   */
  async createProfileWithRetry(user: any, attempt = 1): Promise<UserProfile> {
    try {
      console.log(`프로필 생성 시도 ${attempt}/${this.retryAttempts}:`, user.id);

      // 사용자 메타데이터에서 정보 추출
      const metadata = user.user_metadata || {};
      const appMetadata = user.app_metadata || {};
      
      // 이름 분리 로직
      const { firstName, lastName } = this.extractNames(
        metadata.full_name || 
        metadata.name || 
        `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim()
      );

      const profileData = {
        id: user.id,
        email: user.email,
        first_name: firstName || metadata.given_name || null,
        last_name: lastName || metadata.family_name || null,
        full_name: metadata.full_name || metadata.name || null,
        avatar_url: metadata.avatar_url || metadata.picture || null,
        phone: metadata.phone || null,
        timezone: 'Asia/Seoul',
        currency_preference: 'KRW'
      };

      console.log('생성할 프로필 데이터:', profileData);

      // 먼저 기존 프로필 확인
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        console.log('기존 프로필 발견:', existingProfile);
        return existingProfile;
      }

      // 새 프로필 생성
      const { data, error } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error(`프로필 생성 실패 (시도 ${attempt}):`, error);

        // 중복 키 에러인 경우 기존 프로필 조회
        if (error.code === '23505') {
          const { data: duplicate } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (duplicate) {
            console.log('중복으로 인한 기존 프로필 반환:', duplicate);
            return duplicate;
          }
        }

        // 재시도 로직
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
          return this.createProfileWithRetry(user, attempt + 1);
        }

        throw new Error(`프로필 생성 실패: ${error.message}`);
      }

      console.log('프로필 생성 성공:', data);
      return data;

    } catch (error) {
      console.error(`프로필 생성 중 예외 발생 (시도 ${attempt}):`, error);

      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
        return this.createProfileWithRetry(user, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * 이름 분리 로직
   */
  private extractNames(fullName: string): { firstName: string | null; lastName: string | null } {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: null, lastName: null };
    }

    const trimmed = fullName.trim();
    if (!trimmed) {
      return { firstName: null, lastName: null };
    }

    // 한글 이름인 경우 (공백이 없는 경우가 많음)
    if (/^[가-힣]+$/.test(trimmed)) {
      if (trimmed.length === 2) {
        return { firstName: trimmed[0], lastName: trimmed[1] };
      } else if (trimmed.length === 3) {
        return { firstName: trimmed[0], lastName: trimmed.slice(1) };
      } else if (trimmed.length >= 4) {
        return { firstName: trimmed.slice(0, 2), lastName: trimmed.slice(2) };
      }
    }

    // 공백으로 분리된 이름
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: null };
    } else if (parts.length === 2) {
      return { firstName: parts[0], lastName: parts[1] };
    } else {
      // 3개 이상인 경우 첫 번째를 firstName, 나머지를 lastName
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }
  }

  /**
   * 프로필 조회 (캐시 및 재시도 포함)
   */
  async getProfileWithRetry(userId: string, attempt = 1): Promise<UserProfile | null> {
    try {
      console.log(`프로필 조회 시도 ${attempt}/${this.retryAttempts}:`, userId);

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 프로필이 없음
          console.log('프로필이 존재하지 않음:', userId);
          return null;
        }

        console.error(`프로필 조회 실패 (시도 ${attempt}):`, error);

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
          return this.getProfileWithRetry(userId, attempt + 1);
        }

        throw new Error(`프로필 조회 실패: ${error.message}`);
      }

      console.log('프로필 조회 성공:', data);
      return data;

    } catch (error) {
      console.error(`프로필 조회 중 예외 발생 (시도 ${attempt}):`, error);

      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
        return this.getProfileWithRetry(userId, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * 안전한 로그인 처리
   */
  async handleAuthStateChange(event: string, session: any): Promise<{
    user: any | null;
    profile: UserProfile | null;
    error: string | null;
  }> {
    try {
      console.log('인증 상태 변경:', event, session?.user?.id);

      if (event === 'SIGNED_OUT' || !session?.user) {
        return { user: null, profile: null, error: null };
      }

      const user = session.user;

      // 프로필 조회
      let profile = await this.getProfileWithRetry(user.id);

      // 프로필이 없으면 생성
      if (!profile) {
        console.log('프로필이 없어서 자동 생성 중...');
        profile = await this.createProfileWithRetry(user);
      }

      return { user, profile, error: null };

    } catch (error) {
      console.error('인증 상태 처리 중 오류:', error);
      return { 
        user: session?.user || null, 
        profile: null, 
        error: error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.' 
      };
    }
  }

  /**
   * OAuth 연동 진단
   */
  async diagnoseOAuthIssues(): Promise<{
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Supabase 설정 확인
      if (!this.supabase) {
        issues.push('Supabase 클라이언트가 초기화되지 않음');
        recommendations.push('환경 변수를 확인하고 Supabase를 재초기화하세요');
      }

      // 2. 현재 세션 확인
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError) {
        issues.push(`세션 조회 오류: ${sessionError.message}`);
        recommendations.push('브라우저 저장소를 지우고 다시 로그인해보세요');
      }

      // 3. Google Provider 설정 확인 (프론트엔드에서 가능한 범위)
      if (typeof window !== 'undefined') {
        const redirectUrl = window.location.origin;
        console.log('현재 리다이렉트 URL:', redirectUrl);
        
        if (!redirectUrl.includes('https') && !redirectUrl.includes('localhost')) {
          issues.push('HTTP에서 OAuth가 작동하지 않을 수 있음');
          recommendations.push('HTTPS 또는 localhost에서 테스트하세요');
        }
      }

      // 4. 환경 변수 확인
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        issues.push('Supabase 환경 변수가 설정되지 않음');
        recommendations.push('.env 파일에 REACT_APP_SUPABASE_URL과 REACT_APP_SUPABASE_ANON_KEY를 설정하세요');
      }

    } catch (error) {
      issues.push(`진단 중 오류: ${error}`);
      recommendations.push('브라우저 콘솔에서 추가 오류를 확인하세요');
    }

    return { issues, recommendations };
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 인증 상태 관리 훅
 */
export function useAuthState(supabase: any) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  const authManager = useRef(new SafeAuthManager(supabase));

  useEffect(() => {
    if (!supabase) return;

    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const result = await authManager.current.handleAuthStateChange('SIGNED_IN', session);
          setAuthState({
            user: result.user,
            profile: result.profile,
            session,
            isLoading: false,
            isAuthenticated: !!result.user,
            error: result.error
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false
          }));
        }
      } catch (error) {
        console.error('초기 인증 상태 확인 실패:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '인증 초기화 실패'
        }));
      }
    };

    initializeAuth();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state change event:', event);

        setAuthState(prev => ({ ...prev, isLoading: true }));

        const result = await authManager.current.handleAuthStateChange(event, session);
        
        setAuthState({
          user: result.user,
          profile: result.profile,
          session,
          isLoading: false,
          isAuthenticated: !!result.user,
          error: result.error
        });
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: `Google 로그인 실패: ${error.message}`
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google 로그인 중 오류 발생'
      }));
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await supabase.auth.signOut();
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '로그아웃 실패'
      }));
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!authState.user) return;

    try {
      const profile = await authManager.current.getProfileWithRetry(authState.user.id);
      setAuthState(prev => ({ ...prev, profile, error: null }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '프로필 새로고침 실패'
      }));
    }
  }, [authState.user]);

  return {
    ...authState,
    signInWithGoogle,
    signOut,
    refreshProfile,
    diagnoseIssues: () => authManager.current.diagnoseOAuthIssues()
  };
}