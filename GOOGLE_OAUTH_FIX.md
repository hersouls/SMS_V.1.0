# 🔧 Google OAuth 문제 해결 가이드

## 🚨 현재 문제 분석

제공된 URL을 분석한 결과:
```
https://your-project.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Ftravel.moonwave.kr%2Ftravels&code_challenge=c1EDGRQEi_0JBdQ_ol30y4L9bQdZHtlO8FcbXO0xjrw&code_challenge_method=s256
```

### 문제점들:
1. **리다이렉트 URL 불일치**: `travel.moonwave.kr/travels`로 리다이렉트되지만, 설정된 URL은 `subscription.moonwave.kr/#/auth/callback`
2. **도메인 불일치**: `travel.moonwave.kr` vs `subscription.moonwave.kr`
3. **경로 불일치**: `/travels` vs `/#/auth/callback`

## 🔧 해결 방법

### 1. 환경 변수 확인 및 수정

현재 `.env` 파일 설정:
```
REACT_APP_SITE_URL=https://subscription.moonwave.kr
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://subscription.moonwave.kr/#/auth/callback
```

### 2. Google Cloud Console 설정

1. **Google Cloud Console** 접속
2. **APIs & Services** → **Credentials**
3. **OAuth 2.0 Client IDs** 선택
4. **Authorized redirect URIs**에 다음 URL들 추가:
   ```
   https://subscription.moonwave.kr/#/auth/callback
   https://subscription.moonwave.kr/auth/callback
   https://hmgxlxnrarciimggycxj.supabase.co/auth/v1/callback
   ```

### 3. Supabase Dashboard 설정

1. **Supabase Dashboard** 접속
2. **Authentication** → **URL Configuration**
3. **Site URL**을 `https://subscription.moonwave.kr`로 설정
4. **Redirect URLs**에 다음 추가:
   ```
   https://subscription.moonwave.kr/#/auth/callback
   https://subscription.moonwave.kr/auth/callback
   ```

### 4. 코드 수정 사항

`src/components/LoginScreen.tsx`에서 리다이렉트 URL 로깅 추가:
```typescript
// 리다이렉트 URL 설정
const redirectUrl = `${siteUrl}/#/auth/callback`;
addDebugInfo(`Redirect URL: ${redirectUrl}`);
```

### 5. 테스트 방법

1. **브라우저 개발자 도구** 열기 (F12)
2. **Console** 탭에서 다음 로그 확인:
   - `Using site URL: https://subscription.moonwave.kr`
   - `Redirect URL: https://subscription.moonwave.kr/#/auth/callback`
3. **Network** 탭에서 OAuth 요청 확인

### 6. 추가 디버깅

개발 환경에서 우측 하단의 "Show Debug" 버튼을 클릭하여:
- 환경 변수 설정 상태
- Supabase 클라이언트 상태
- OAuth URL 생성 결과
- 오류 상세 정보 확인

## 🚨 주의사항

1. **HTTPS 필수**: 프로덕션 환경에서는 반드시 HTTPS 사용
2. **도메인 일치**: Google Cloud Console과 Supabase Dashboard의 도메인 설정이 일치해야 함
3. **캐시 문제**: 브라우저 캐시 삭제 후 재시도
4. **팝업 차단**: 브라우저 팝업 차단 설정 확인

## 🔗 유용한 링크

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 📞 문제 지속 시

위 설정을 모두 확인한 후에도 문제가 지속되면:
1. 브라우저 콘솔 로그
2. Supabase Dashboard의 Authentication 로그
3. Google Cloud Console의 OAuth 동의 화면 설정
4. 현재 사용 중인 브라우저와 OS 정보

를 포함하여 문의해주세요.