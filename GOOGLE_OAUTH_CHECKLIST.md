# 🔧 Google OAuth 문제 해결 체크리스트

## 🚨 현재 문제 상황
- URL: `https://your-project.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Ftravel.moonwave.kr%2Ftravels&code_challenge=c1EDGRQEi_0JBdQ_ol30y4L9bQdZHtlO8FcbXO0xjrw&code_challenge_method=s256`
- 문제: `travel.moonwave.kr/travels`로 리다이렉트되지만 설정된 URL은 `subscription.moonwave.kr/#/auth/callback`

## ✅ 해결 체크리스트

### 1. 환경 변수 설정 확인
- [ ] `.env` 파일에서 `REACT_APP_SITE_URL=https://subscription.moonwave.kr` 확인
- [ ] `.env` 파일에서 `REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://subscription.moonwave.kr/#/auth/callback` 확인
- [ ] `.env` 파일에서 `REACT_APP_GOOGLE_CLIENT_ID`가 올바른 Google OAuth Client ID인지 확인

### 2. Google Cloud Console 설정
- [ ] Google Cloud Console 접속
- [ ] APIs & Services → Credentials → OAuth 2.0 Client IDs 선택
- [ ] Authorized redirect URIs에 다음 URL들 추가:
  ```
  https://subscription.moonwave.kr/#/auth/callback
  https://subscription.moonwave.kr/auth/callback
  https://hmgxlxnrarciimggycxj.supabase.co/auth/v1/callback
  ```
- [ ] 변경사항 저장

### 3. Supabase Dashboard 설정
- [ ] Supabase Dashboard 접속
- [ ] Authentication → URL Configuration
- [ ] Site URL을 `https://subscription.moonwave.kr`로 설정
- [ ] Redirect URLs에 다음 추가:
  ```
  https://subscription.moonwave.kr/#/auth/callback
  https://subscription.moonwave.kr/auth/callback
  ```
- [ ] 변경사항 저장

### 4. 코드 수정 확인
- [ ] `src/components/LoginScreen.tsx`에서 리다이렉트 URL 로깅 추가됨
- [ ] `src/lib/supabase.ts`에서 OAuth 리다이렉트 URL 설정 추가됨
- [ ] `src/components/GoogleAuthDebug.tsx`에서 상세한 디버깅 정보 추가됨

### 5. 브라우저 테스트
- [ ] 브라우저 캐시 삭제 (Ctrl + Shift + R)
- [ ] 개발자 도구 열기 (F12)
- [ ] Console 탭에서 오류 메시지 확인
- [ ] Network 탭에서 OAuth 요청/응답 확인
- [ ] 우측 하단 "Show Debug" 버튼 클릭하여 디버그 정보 확인

### 6. 추가 확인사항
- [ ] HTTPS 연결 확인 (프로덕션 환경)
- [ ] 팝업 차단 설정 확인
- [ ] 브라우저 확장 프로그램으로 인한 차단 확인
- [ ] VPN 사용 중인 경우 VPN 해제 후 테스트

## 🔍 디버깅 단계

### 1단계: 환경 변수 확인
```bash
# 브라우저 콘솔에서 실행
console.log('Site URL:', process.env.REACT_APP_SITE_URL);
console.log('Auth Redirect URL:', process.env.REACT_APP_SUPABASE_AUTH_REDIRECT_URL);
console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
```

### 2단계: OAuth URL 생성 테스트
```bash
# 브라우저 콘솔에서 실행
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://subscription.moonwave.kr/#/auth/callback',
    skipBrowserRedirect: true,
  }
});
console.log('OAuth URL:', data.url);
console.log('Error:', error);
```

### 3단계: URL 파라미터 분석
```bash
# 생성된 OAuth URL의 파라미터 확인
const url = new URL(data.url);
console.log('Provider:', url.searchParams.get('provider'));
console.log('Redirect To:', url.searchParams.get('redirect_to'));
```

## 🚨 문제 지속 시 확인사항

1. **Supabase 로그 확인**
   - Supabase Dashboard → Authentication → Logs
   - OAuth 관련 오류 메시지 확인

2. **Google Cloud Console 로그 확인**
   - Google Cloud Console → APIs & Services → OAuth consent screen
   - 동의 화면 설정 확인

3. **네트워크 연결 확인**
   - 인터넷 연결 상태 확인
   - 방화벽 설정 확인
   - DNS 설정 확인

## 📞 지원 정보

문제가 지속되는 경우 다음 정보를 포함하여 문의:
- 브라우저 콘솔 로그
- Supabase Authentication 로그
- Google Cloud Console 설정 스크린샷
- 현재 사용 중인 브라우저와 OS 정보
- 재현 단계 상세 설명