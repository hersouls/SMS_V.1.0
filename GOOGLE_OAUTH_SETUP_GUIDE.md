# 🔧 Google OAuth 설정 및 문제 해결 가이드

## 🚨 현재 발견된 문제점

### 문제 1: 리다이렉트 URI 불일치
**현상**: `https://subscription.moonwave.kr/auth/callback?code=19c59722-0b75-4b32-9a10-375efbe45188`와 같은 잘못된 콜백 URL
**원인**: Google Cloud Console과 Supabase에서 설정된 리다이렉트 URI가 일치하지 않음

### 문제 2: 잘못된 Authorization Code 형식
**현상**: UUID 형식의 code 파라미터 (`19c59722-0b75-4b32-9a10-375efbe45188`)
**원인**: 실제 OAuth authorization code가 아닌 다른 식별자가 전달됨

## 📋 해결 방법

### 1. Google Cloud Console 설정 수정

1. **Google Cloud Console** 접속 (https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials** 이동
3. OAuth 2.0 Client ID 선택 (Client ID: `350164367455-c1n2g0iin0lg2olq9kgrq95cpdvum1qv.apps.googleusercontent.com`)
4. **Authorized redirect URIs**에 다음 URL들이 모두 포함되어 있는지 확인:

```
https://hmgxlxnrarciimggycxj.supabase.co/auth/v1/callback
https://subscription.moonwave.kr/auth/callback
http://localhost:3000/auth/callback
```

### 2. Supabase Dashboard 설정 확인

1. **Supabase Dashboard** 접속 (https://supabase.com/dashboard)
2. 프로젝트 선택 (`hmgxlxnrarciimggycxj`)
3. **Authentication** → **URL Configuration** 이동
4. **Site URL** 설정 확인:
   ```
   https://subscription.moonwave.kr
   ```
5. **Redirect URLs** 설정 확인:
   ```
   https://subscription.moonwave.kr/auth/callback
   https://subscription.moonwave.kr/**
   http://localhost:3000/**
   ```

### 3. 환경 변수 설정 확인

`.env` 파일에서 다음 설정이 올바른지 확인:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://hmgxlxnrarciimggycxj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=350164367455-c1n2g0iin0lg2olq9kgrq95cpdvum1qv.apps.googleusercontent.com

# Site Configuration
REACT_APP_SITE_URL=https://subscription.moonwave.kr
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://subscription.moonwave.kr/auth/callback
```

### 4. 코드 수정 사항

AuthUtils에서 `exchangeCodeForSession` 메서드가 더 이상 사용되지 않으므로, 새로운 방식으로 수정했습니다:

```typescript
// 기존 (문제가 있던 코드)
const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

// 수정된 코드
const { data, error } = await supabase.auth.getSession();
if (!data.session) {
  window.location.reload(); // Supabase가 자동으로 처리하도록 함
}
```

## 🔍 디버깅 방법

### 1. 브라우저 개발자 도구에서 확인

```javascript
// 콘솔에서 실행하여 현재 세션 확인
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// OAuth URL 생성 테스트
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
console.log('OAuth URL:', data?.url);
console.log('Error:', error);
```

### 2. Network 탭에서 확인사항

1. OAuth 요청이 올바른 URL로 전송되는지 확인
2. 리다이렉트 응답이 정상적인지 확인
3. 콜백 URL의 파라미터가 올바른지 확인

### 3. 일반적인 오류 해결

#### "redirect_uri_mismatch" 오류
- Google Cloud Console에서 리다이렉트 URI 추가
- Supabase Dashboard에서 Redirect URLs 설정 확인

#### "invalid_client" 오류
- Google Client ID가 올바른지 확인
- Supabase에서 Google Provider 설정 확인

#### UUID 형식의 code 파라미터
- 실제 Google OAuth가 아닌 다른 서비스에서 리다이렉트되고 있을 가능성
- URL 라우팅 확인 필요

## 🚀 테스트 방법

1. **로컬 환경에서 테스트**:
   ```bash
   npm start
   # http://localhost:3000에서 로그인 테스트
   ```

2. **프로덕션 환경에서 테스트**:
   ```bash
   # https://subscription.moonwave.kr에서 로그인 테스트
   ```

3. **디버그 모드 활성화**:
   - 개발 환경에서 우측 하단 "Show Debug" 버튼 클릭
   - OAuth 관련 정보 확인

## 📞 추가 지원

문제가 지속되는 경우 다음 정보를 수집하여 문의:

1. 브라우저 콘솔의 전체 오류 로그
2. Network 탭의 OAuth 관련 요청/응답
3. 사용 중인 브라우저 및 버전
4. 정확한 에러 메시지 및 발생 단계