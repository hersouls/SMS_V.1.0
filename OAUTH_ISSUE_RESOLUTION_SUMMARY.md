# 🔧 구글 OAuth 로그인 문제 해결 요약

## 📋 발견된 문제점

### 1. 잘못된 Authorization Code 형식
- **문제**: `https://subscription.moonwave.kr/auth/callback?code=19c59722-0b75-4b32-9a10-375efbe45188`
- **원인**: UUID 형식의 code 파라미터 (실제 OAuth code가 아님)
- **영향**: `exchangeCodeForSession` 메서드 실패

### 2. 리다이렉트 URI 불일치
- **문제**: Google Cloud Console의 리다이렉트 URI와 실제 콜백 URL 불일치
- **설정 필요**: 
  - `https://hmgxlxnrarciimggycxj.supabase.co/auth/v1/callback` (Supabase)
  - `https://subscription.moonwave.kr/auth/callback` (앱)

### 3. 구버전 Supabase Auth API 사용
- **문제**: `exchangeCodeForSession` 메서드가 더 이상 권장되지 않음
- **해결**: 새로운 세션 처리 방식으로 변경

## 🛠️ 적용된 해결 방법

### 1. AuthUtils 개선 (`src/utils/authUtils.ts`)

```typescript
// 🆕 UUID 형식 코드 감지 및 오류 처리
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (uuidRegex.test(authCode)) {
  return { success: false, error: '잘못된 인증 코드 형식입니다.' };
}

// 🆕 해시 파라미터와 쿼리 파라미터 모두 확인
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const authCode = urlParams.get('code') || hashParams.get('code');
const accessToken = hashParams.get('access_token');

// 🆕 새로운 세션 처리 방식
const { data, error } = await supabase.auth.getSession();
if (!data.session && authCode) {
  // Supabase가 자동으로 처리하도록 페이지 새로고침
  setTimeout(() => window.location.reload(), 500);
  return { success: true };
}
```

### 2. AuthCallback 컴포넌트 개선 (`src/components/AuthCallback.tsx`)

```typescript
// 🆕 상세한 디버그 정보 수집
const debugData = {
  url: window.location.href,
  search: window.location.search,
  hash: window.location.hash,
  searchParams: Object.fromEntries(urlParams.entries()),
  hashParams: Object.fromEntries(hashParams.entries()),
  timestamp: new Date().toISOString()
};

// 🆕 인증 파라미터 존재 여부 확인
const hasAuthCode = urlParams.has('code') || hashParams.has('access_token');
const hasError = urlParams.has('error') || hashParams.has('error');

// 🆕 개발 모드에서 디버그 정보 표시
{debugInfo && process.env.NODE_ENV === 'development' && (
  <details className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
    <summary>디버그 정보 (개발 모드)</summary>
    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
  </details>
)}
```

### 3. AuthManager 리다이렉트 URL 수정 (`src/lib/authManager.ts`)

```typescript
// 🆕 명시적 콜백 URL 지정
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`, // 변경됨
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
});
```

## 📍 필요한 설정 확인 사항

### 1. Google Cloud Console 설정
다음 리다이렉트 URI들이 모두 등록되어 있는지 확인:
```
https://hmgxlxnrarciimggycxj.supabase.co/auth/v1/callback
https://subscription.moonwave.kr/auth/callback
http://localhost:3000/auth/callback
```

### 2. Supabase Dashboard 설정
- **Site URL**: `https://subscription.moonwave.kr`
- **Redirect URLs**: 
  ```
  https://subscription.moonwave.kr/auth/callback
  https://subscription.moonwave.kr/**
  http://localhost:3000/**
  ```

### 3. 환경 변수 확인
```bash
REACT_APP_SUPABASE_URL=https://hmgxlxnrarciimggycxj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_GOOGLE_CLIENT_ID=350164367455-c1n2g0iin0lg2olq9kgrq95cpdvum1qv.apps.googleusercontent.com
REACT_APP_SITE_URL=https://subscription.moonwave.kr
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://subscription.moonwave.kr/auth/callback
```

## 🔍 추가된 디버깅 기능

### 1. 실시간 OAuth 상태 모니터링
- URL 파라미터 실시간 분석
- 세션 상태 추적
- 오류 상세 로그

### 2. 개발 모드 디버그 패널
- 브라우저 콘솔에 상세 로그 출력
- AuthCallback 페이지에서 디버그 정보 표시
- 네트워크 요청/응답 추적

### 3. 강화된 오류 처리
- UUID 형식 코드 감지
- 다양한 OAuth 플로우 지원 (code, token)
- 자동 재시도 및 폴백 메커니즘

## 🚀 테스트 방법

### 1. 로컬 환경 테스트
```bash
npm start
# http://localhost:3000에서 Google 로그인 테스트
```

### 2. 프로덕션 환경 테스트
- `https://subscription.moonwave.kr`에서 로그인 테스트
- 브라우저 개발자 도구에서 콘솔 로그 확인
- Network 탭에서 OAuth 플로우 모니터링

### 3. 디버그 정보 활용
- 로그인 실패 시 콘솔에서 상세 오류 확인
- AuthCallback 페이지의 디버그 정보 참조
- URL 파라미터 유효성 검증

## 📞 추가 지원이 필요한 경우

다음 정보를 수집하여 문의:

1. **브라우저 콘솔 로그** (F12 → Console)
2. **네트워크 요청 로그** (F12 → Network)
3. **실제 콜백 URL** (전체 URL 포함)
4. **사용 브라우저 및 버전**
5. **AuthCallback 페이지의 디버그 정보**

## ✅ 예상 결과

이번 수정으로 다음이 개선될 예정입니다:

1. ✅ UUID 형식 코드에 대한 명확한 오류 메시지
2. ✅ 다양한 OAuth 플로우 지원 (authorization code + implicit)
3. ✅ 실시간 디버깅 정보 제공
4. ✅ 자동 세션 복구 메커니즘
5. ✅ 향상된 사용자 경험 (로딩, 오류 표시)

---

**최종 업데이트**: 2024-12-27
**테스트 상태**: TypeScript 컴파일 성공, 개발 서버 실행 중