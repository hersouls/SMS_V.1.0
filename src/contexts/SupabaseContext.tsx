import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../lib/supabase';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  supabase: typeof supabase;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkProfileStatus: () => void;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Get initial session with timeout
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('Supabase session timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5초로 증가

    // URL에서 OAuth 콜백 파라미터 확인 (디버그용)
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Current path:', window.location.pathname);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      }
      setLoading(false);
    }).catch((error) => {
      if (!isMounted) return;
      
      console.error('Session fetch error:', error);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', event, {
        session: session ? 'exists' : 'null',
        user: session?.user ? 'exists' : 'null',
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('User logged in, fetching profile...');
        console.log('User metadata:', session.user.user_metadata);
        console.log('App metadata:', session.user.app_metadata);
        
        await fetchProfile(session.user.id, session.user);
        
        // OAuth 로그인 성공 후 URL 정리
        if (event === 'SIGNED_IN' && (session.user.app_metadata?.provider === 'google' || session.user.app_metadata?.provider === 'kakao')) {
          console.log('OAuth login successful, cleaning URL...');
          const currentURL = window.location.href;
          const urlObj = new URL(currentURL);
          
          // OAuth 콜백 파라미터가 있는 경우 정리
          if (urlObj.pathname === '/auth/callback' || 
              urlObj.searchParams.has('access_token') || 
              urlObj.searchParams.has('refresh_token') || 
              urlObj.searchParams.has('error') ||
              urlObj.searchParams.has('error_description') ||
              urlObj.searchParams.has('code') ||
              urlObj.searchParams.has('state')) {
            const cleanURL = `${urlObj.origin}/`;
            console.log('Cleaning URL from:', currentURL, 'to:', cleanURL);
            window.history.replaceState({}, document.title, cleanURL);
          }
          
          // OAuth 오류 처리
          if (urlObj.searchParams.has('error')) {
            const error = urlObj.searchParams.get('error');
            const errorDescription = urlObj.searchParams.get('error_description');
            console.error('OAuth error:', error, errorDescription);
            // 오류 메시지를 사용자에게 표시할 수 있도록 상태 업데이트
          }
        }
        
        // OAuth 오류 처리
        if (event === 'TOKEN_REFRESHED' && session?.user?.app_metadata?.provider === 'google') {
          console.log('Google token refreshed successfully');
        }
      } else {
        console.log('User logged out, clearing profile...');
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, sessionUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // 프로필이 존재하지 않는 경우 (PGRST116 에러)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          await createProfile(userId, sessionUser);
          return;
        }
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const createProfile = async (userId: string, sessionUser?: User) => {
    try {
      const currentUser = sessionUser || user;
      if (!currentUser) {
        console.error('No user information available for profile creation');
        return;
      }

      const userEmail = currentUser.email || '';
      const userName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '';
      const photoUrl = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || '';
      
      // Google 로그인의 경우 이름을 first_name과 last_name으로 분리
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log('Creating profile with data:', {
        id: userId,
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        photo_url: photoUrl,
      });

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        // 이미 존재하는 경우 다시 조회
        if (error.code === '23505') { // unique violation
          console.log('Profile already exists, fetching...');
          const { data: existingData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (existingData) {
            setProfile(existingData);
          }
        }
        return;
      }

      console.log('Profile created successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      let errorMessage = error.message;
      
      // 더 명확한 오류 메시지 제공
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해주세요.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('User not found')) {
        errorMessage = '등록되지 않은 이메일 주소입니다. 회원가입을 먼저 진행해주세요.';
      }
      
      const customError = new Error(errorMessage);
      customError.name = error.name;
      throw customError;
    }
    
    console.log('Sign in successful:', data);
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    console.log('SupabaseContext signOut called');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signOut error:', error);
      throw error;
    }
    console.log('Supabase signOut successful');
    // 로그아웃 후 상태 초기화
    setUser(null);
    setSession(null);
    setProfile(null);
    console.log('User state cleared');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    console.log('Updating profile in Supabase:', updates);
    console.log('Current user ID:', user.id);

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    console.log('Profile updated in Supabase:', data);

    // Update local profile state
    if (data) {
      console.log('Updating local profile state with:', data);
      setProfile(data);
    } else {
      console.warn('No data returned from Supabase update');
    }
  };

  const checkProfileStatus = () => {
    console.log('Current Profile State:', {
      user,
      session,
      profile,
      loading,
    });
  };

  const value: SupabaseContextType = {
    user,
    session,
    profile,
    loading,
    supabase,
    signIn,
    signUp,
    signOut,
    updateProfile,
    checkProfileStatus,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}; 
