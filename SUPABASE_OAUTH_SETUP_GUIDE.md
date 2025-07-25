# Supabase OAuth 설정 가이드 (GitHub Pages)

## GitHub Pages 배포를 위한 OAuth 리다이렉트 URL 설정

GitHub Pages는 정적 웹사이트 호스팅이므로 Hash Router를 사용하여 클라이언트 사이드 라우팅을 구현했습니다.

### 1. Supabase 대시보드 설정

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Authentication** > **URL Configuration** 메뉴로 이동

### 2. Site URL 설정

**Site URL**을 다음으로 설정:
```
https://subscription.moonwave.kr
```

### 3. Redirect URLs 설정

**Redirect URLs**에 다음 URL들을 추가:
```
https://subscription.moonwave.kr/#/auth/callback
http://localhost:3000/#/auth/callback
```

### 4. Google OAuth 설정 (Google Cloud Console)

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인
2. 프로젝트 선택
3. **APIs & Services** > **Credentials** 메뉴로 이동
4. OAuth 2.0 클라이언트 ID 선택
5. **Authorized redirect URIs**에 다음 URL 추가:
   ```
   https://subscription.moonwave.kr/#/auth/callback
   http://localhost:3000/#/auth/callback
   ```

### 5. 환경 변수 설정 (선택사항)

프로덕션 환경에서 환경 변수를 설정하려면:

```bash
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://subscription.moonwave.kr/#/auth/callback
```

### 6. 변경사항 확인

- Hash Router로 변경됨 (`BrowserRouter` → `HashRouter`)
- 모든 OAuth 콜백 URL이 `/#/auth/callback` 형태로 업데이트됨
- 404.html 페이지가 SPA 라우팅을 지원하도록 추가됨

### 7. 테스트

1. 개발 환경에서 테스트:
   ```bash
   npm start
   ```
   - `http://localhost:3000/#/auth/callback` 접속 확인

2. 프로덕션 환경에서 테스트:
   - `https://subscription.moonwave.kr/#/auth/callback` 접속 확인

### 주의사항

- Hash Router 사용으로 인해 URL에 `#`이 포함됩니다
- SEO에 영향을 줄 수 있지만, GitHub Pages에서는 필수적인 해결책입니다
- 모든 OAuth 관련 URL이 일관되게 업데이트되었는지 확인하세요

### 문제 해결

만약 OAuth 로그인이 작동하지 않는다면:

1. Supabase 대시보드의 Redirect URLs 설정 확인
2. Google Cloud Console의 Authorized redirect URIs 설정 확인
3. 브라우저 개발자 도구에서 콘솔 오류 확인
4. 네트워크 탭에서 리다이렉트 요청 확인