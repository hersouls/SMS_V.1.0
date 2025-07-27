import { supabase } from '../lib/supabase';

/**
 * OAuth 콜백 URL을 처리하고 authorization code를 세션으로 교환합니다.
 */
export const handleOAuthCallback = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Handling OAuth callback...');
    console.log('Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // 오류 확인
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return { success: false, error: `OAuth 오류: ${errorDescription || error}` };
    }
    
    // Authorization code가 있는 경우 처리
    if (authCode) {
      console.log('Authorization code found:', authCode);
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return { success: false, error: `코드 교환 오류: ${exchangeError.message}` };
      }
      
      if (data.session) {
        console.log('Code exchange successful, user logged in');
        
        // URL 정리
        const cleanURL = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, document.title, cleanURL);
        
        return { success: true };
      }
    }
    
    // 기존 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { success: false, error: `세션 오류: ${sessionError.message}` };
    }
    
    if (session) {
      console.log('Existing session found');
      return { success: true };
    }
    
    return { success: false, error: '로그인 세션을 찾을 수 없습니다.' };
    
  } catch (error: any) {
    console.error('OAuth callback handling error:', error);
    return { success: false, error: `콜백 처리 오류: ${error.message}` };
  }
};

/**
 * 현재 URL이 OAuth 콜백인지 확인합니다.
 */
export const isOAuthCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') || urlParams.has('error');
};

/**
 * URL에서 OAuth 파라미터를 정리합니다.
 */
export const cleanOAuthURL = (): void => {
  const currentUrl = new URL(window.location.href);
  
  // OAuth 관련 파라미터 제거
  currentUrl.searchParams.delete('code');
  currentUrl.searchParams.delete('state');
  currentUrl.searchParams.delete('error');
  currentUrl.searchParams.delete('error_description');
  currentUrl.searchParams.delete('access_token');
  currentUrl.searchParams.delete('refresh_token');
  currentUrl.searchParams.delete('token_type');
  currentUrl.searchParams.delete('expires_in');
  
  // hash에서 OAuth 파라미터 제거
  if (currentUrl.hash) {
    const hashParams = new URLSearchParams(currentUrl.hash.substring(1));
    hashParams.delete('access_token');
    hashParams.delete('refresh_token');
    hashParams.delete('token_type');
    hashParams.delete('expires_in');
    
    const remainingHash = hashParams.toString();
    currentUrl.hash = remainingHash ? `#${remainingHash}` : '';
  }
  
  const cleanURL = currentUrl.toString();
  window.history.replaceState({}, document.title, cleanURL);
  console.log('URL cleaned to:', cleanURL);
};