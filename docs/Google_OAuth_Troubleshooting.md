# Google OAuth 문제 해결 가이드

## 문제 진단

구글 인증이 작동하지 않는 경우 다음 단계를 따라 문제를 진단하고 해결하세요.

## 1. 브라우저 콘솔 확인

개발자 도구(F12)를 열고 Console 탭에서 다음 오류 메시지를 확인하세요:

### 일반적인 오류 메시지
- `popup_closed_by_user`: 팝업이 사용자에 의해 닫힘
- `access_denied`: 사용자가 권한을 거부함
- `invalid_client`: 클라이언트 ID가 잘못됨
- `redirect_uri_mismatch`: 리디렉트 URI가 일치하지 않음
- `unauthorized_client`: 클라이언트가 승인되지 않음

## 2. Supabase 프로젝트 설정 확인

### 2.1 Authentication > Providers > Google 설정
1. Supabase 대시보드에서 프로젝트 선택
2. Authentication > Providers로 이동
3. Google 제공자 활성화
4. 다음 정보가 올바르게 설정되어 있는지 확인:
   - **Client ID**: Google Cloud Console에서 생성한 OAuth 2.0 클라이언트 ID
   - **Client Secret**: Google Cloud Console에서 생성한 OAuth 2.0 클라이언트 시크릿
   - **Enabled**: 체크되어 있어야 함

### 2.2 Site URL 설정
1. Authentication > Settings로 이동
2. Site URL이 올바르게 설정되어 있는지 확인:
   - 개발 환경: `http://localhost:3000`
   - 프로덕션 환경: 실제 도메인 URL

## 3. Google Cloud Console 설정 확인

### 3.1 OAuth 2.0 클라이언트 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 선택
2. APIs & Services > Credentials로 이동
3. OAuth 2.0 클라이언트 ID 선택
4. 다음 설정 확인:

#### 승인된 리디렉션 URI
다음 URI들이 추가되어 있어야 합니다:
```
https://your-project-ref.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback (개발 환경)
```

#### 승인된 JavaScript 원본
```
http://localhost:3000 (개발 환경)
https://your-project-ref.supabase.co
```

### 3.2 OAuth 동의 화면 설정
1. APIs & Services > OAuth consent screen로 이동
2. 다음 설정 확인:
   - **User Type**: External (일반 사용자)
   - **App name**: 애플리케이션 이름
   - **User support email**: 지원 이메일
   - **Developer contact information**: 개발자 연락처

### 3.3 필요한 API 활성화
다음 API들이 활성화되어 있어야 합니다:
- Google+ API
- Google Identity API

## 4. 환경 변수 확인

`.env` 파일에서 다음 변수들이 올바르게 설정되어 있는지 확인:

```bash
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## 5. 코드 수정 사항

### 5.1 OAuth 설정 개선
`src/components/LoginScreen.tsx`에서 다음 설정을 확인:

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
      hd: '*', // 모든 도메인 허용
    },
    skipBrowserRedirect: false,
  }
});
```

### 5.2 Supabase 클라이언트 설정
`src/lib/supabase.ts`에서 다음 설정 확인:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
```

## 6. 디버깅 도구 사용

### 6.1 개발 환경에서 디버그 패널 사용
1. 로그인 화면에서 우측 하단의 "Show Debug" 버튼 클릭
2. "Test" 버튼을 클릭하여 OAuth URL 생성 테스트
3. 콘솔 로그와 디버그 정보 확인

### 6.2 브라우저 네트워크 탭 확인
1. 개발자 도구 > Network 탭 열기
2. Google 로그인 버튼 클릭
3. OAuth 요청과 응답 확인

## 7. 일반적인 해결 방법

### 7.1 팝업 차단 문제
- 브라우저에서 팝업 차단 해제
- 시크릿 모드에서 테스트
- 다른 브라우저에서 테스트

### 7.2 CORS 문제
- Supabase 프로젝트 설정에서 Site URL 확인
- Google Cloud Console에서 승인된 원본 확인

### 7.3 리디렉트 문제
- Supabase와 Google Cloud Console의 리디렉트 URI 일치 확인
- 프로토콜(http/https) 일치 확인

## 8. 테스트 체크리스트

- [ ] Supabase 프로젝트에서 Google 제공자 활성화
- [ ] Google Cloud Console에서 OAuth 2.0 클라이언트 생성
- [ ] 승인된 리디렉션 URI 설정
- [ ] 환경 변수 설정
- [ ] 브라우저에서 팝업 차단 해제
- [ ] 개발자 도구에서 오류 메시지 확인
- [ ] 디버그 패널에서 OAuth URL 생성 테스트

## 9. 추가 리소스

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/auth/troubleshooting)