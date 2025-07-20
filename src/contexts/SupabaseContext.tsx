import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  const fetchProfile = useCallback(async (userId: string, sessionUser?: User) => {
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
  }, []);

  useEffect(() => {
    // Get initial session with timeout
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3초 후 강제로 로딩 종료

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeoutId);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Session fetch error:', error);
      clearTimeout(timeoutId);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
        await fetchProfile(session.user.id, session.user);
      } else {
        console.log('User logged out, clearing profile...');
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
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

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    // Update local profile state
    if (profile) {
      setProfile({ ...profile, ...updates });
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