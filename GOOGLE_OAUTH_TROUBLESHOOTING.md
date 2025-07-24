# 🔧 Google OAuth 문제 해결 가이드

## 📋 문제 진단 체크리스트

### 1. 환경 변수 설정 확인
```bash
# .env.local 파일에 다음 설정이 있는지 확인
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_APP_NAME=구독 관리 앱
```

### 2. Supabase Google Provider 설정

#### 2.1 Supabase Dashboard에서 설정
1. **Supabase Dashboard** 접속
2. **Authentication** → **Providers** → **Google**
3. **Enable Google provider** 체크
4. **Client ID**와 **Client Secret** 입력

#### 2.2 Google Cloud Console에서 설정
1. **Google Cloud Console** 접속
2. **APIs & Services** → **Credentials**
3. **OAuth 2.0 Client IDs** 생성 또는 기존 클라이언트 선택
4. **Authorized redirect URIs**에 다음 URL 추가:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```

### 3. 일반적인 오류 및 해결 방법

#### 3.1 "invalid_client" 오류
**원인**: Google OAuth Client ID가 잘못되었거나 설정되지 않음
**해결**:
- Google Cloud Console에서 Client ID 확인
- Supabase Dashboard에서 Google Provider 설정 확인

#### 3.2 "redirect_uri_mismatch" 오류
**원인**: 리다이렉트 URI가 Google Cloud Console에 등록된 URI와 일치하지 않음
**해결**:
- Google Cloud Console에서 Authorized redirect URIs 확인
- 다음 URI들이 등록되어 있는지 확인:
  ```
  http://localhost:3000/auth/callback
  https://your-domain.com/auth/callback
  https://your-project.supabase.co/auth/v1/callback
  ```

#### 3.3 "popup_closed_by_user" 오류
**원인**: 팝업이 사용자에 의해 차단되거나 닫힘
**해결**:
- 브라우저 팝업 차단 설정 확인
- 팝업 차단 해제 후 다시 시도

#### 3.4 "network_error" 오류
**원인**: 네트워크 연결 문제
**해결**:
- 인터넷 연결 확인
- 방화벽 설정 확인
- VPN 사용 중인 경우 VPN 해제 후 시도

### 4. 디버깅 도구 사용

#### 4.1 Google Auth Debug 컴포넌트
개발 환경에서 우측 하단의 "Show Debug" 버튼을 클릭하여 다음 정보 확인:
- 환경 변수 설정 상태
- Supabase 클라이언트 상태
- OAuth URL 생성 결과
- 오류 상세 정보

#### 4.2 브라우저 개발자 도구
1. **F12** 키를 눌러 개발자 도구 열기
2. **Console** 탭에서 오류 메시지 확인
3. **Network** 탭에서 OAuth 요청/응답 확인

### 5. 단계별 테스트

#### 5.1 기본 연결 테스트
```javascript
// 브라우저 콘솔에서 실행
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
});
console.log('OAuth URL:', data.url);
console.log('Error:', error);
```

#### 5.2 세션 확인
```javascript
// 브라우저 콘솔에서 실행
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### 6. 프로덕션 환경 설정

#### 6.1 도메인 설정
프로덕션 환경에서는 다음 설정이 필요합니다:

1. **Google Cloud Console**에서 프로덕션 도메인 추가:
   ```
   https://your-domain.com/auth/callback
   ```

2. **Supabase Dashboard**에서 Site URL 업데이트:
   ```
   https://your-domain.com
   ```

3. **환경 변수** 업데이트:
   ```
   REACT_APP_SITE_URL=https://your-domain.com
   ```

#### 6.2 HTTPS 설정
- 프로덕션 환경에서는 반드시 HTTPS 사용
- SSL 인증서가 유효한지 확인

### 7. 추가 문제 해결

#### 7.1 캐시 문제
브라우저 캐시로 인한 문제가 발생할 수 있습니다:
1. **Ctrl + Shift + R** (하드 리프레시)
2. 브라우저 캐시 삭제
3. 시크릿 모드에서 테스트

#### 7.2 브라우저 호환성
- Chrome, Firefox, Safari 최신 버전 사용 권장
- Internet Explorer는 지원하지 않음

#### 7.3 모바일 환경
- 모바일 브라우저에서 팝업 차단 확인
- PWA 환경에서의 동작 테스트

### 8. 로그 확인

#### 8.1 Supabase 로그
Supabase Dashboard에서 Authentication 로그 확인:
1. **Authentication** → **Logs**
2. OAuth 관련 로그 확인
3. 오류 메시지 분석

#### 8.2 애플리케이션 로그
브라우저 콘솔에서 다음 로그 확인:
- OAuth 시작 로그
- 리다이렉트 URL 로그
- 세션 생성 로그
- 오류 메시지

### 9. 지원 및 문의

문제가 지속되는 경우 다음 정보를 포함하여 문의해주세요:

1. **오류 메시지** (전체)
2. **브라우저 정보** (버전, OS)
3. **환경 정보** (개발/프로덕션)
4. **재현 단계**
5. **브라우저 콘솔 로그**
6. **Supabase 로그**

---

## 🔗 유용한 링크

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)