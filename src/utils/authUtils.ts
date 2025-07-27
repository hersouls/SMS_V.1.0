import { supabase } from '../lib/supabase';

/**
 * OAuth 콜백 URL을 처리하고 authorization code를 세션으로 교환합니다.
 */
export const handleOAuthCallback = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Handling OAuth callback...');
    console.log('Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // URL 파라미터와 해시 파라미터 모두 확인
    const authCode = urlParams.get('code') || hashParams.get('code');
    const accessToken = hashParams.get('access_token');
    const error = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    
    console.log('Auth params:', { authCode, accessToken, error, errorDescription });
    
    // 오류 확인
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return { success: false, error: `OAuth 오류: ${errorDescription || error}` };
    }
    
    // Authorization code 또는 access token이 있는 경우 처리
    if (authCode || accessToken) {
      console.log('Auth token found:', { authCode: !!authCode, accessToken: !!accessToken });
      
      try {
        // 먼저 현재 세션 확인
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          return { success: false, error: `세션 오류: ${sessionError.message}` };
        }

        if (data.session) {
          console.log('Session found, user already logged in');
          return { success: true };
        }

        // 세션이 없는 경우
        if (authCode) {
          // Authorization code가 있으면 Supabase에게 처리를 맡김
          console.log('No session but auth code present, refreshing page for Supabase to handle');
          
          // UUID 형식인지 확인 (잘못된 코드)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(authCode)) {
            console.warn('Code appears to be UUID format, this might not be a valid OAuth code');
            return { success: false, error: '잘못된 인증 코드 형식입니다. 올바른 OAuth 프로바이더에서 리다이렉트되었는지 확인해주세요.' };
          }
          
          // Supabase가 자동으로 처리하도록 페이지 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return { success: true };
        } else if (accessToken) {
          // Access token이 있으면 바로 사용 (implicit flow)
          console.log('Access token present, setting session');
          // 이미 Supabase가 처리했을 것이므로 세션 재확인
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: newData } = await supabase.auth.getSession();
          if (newData.session) {
            console.log('Session created from access token');
            return { success: true };
          }
        }
        
        return { success: false, error: '인증 토큰을 세션으로 변환할 수 없습니다.' };
        
      } catch (error: any) {
        console.error('Auth processing error:', error);
        return { success: false, error: `인증 처리 오류: ${error.message}` };
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