# 🔐 Google OAuth 인증 완전 설정 가이드 (Step by Step)

React + Supabase 프로젝트에서 Google OAuth 인증을 처음부터 설정하는 방법을 단계별로 안내합니다.

## 📋 Step 1: Google Cloud Console 설정

### 1-1. Google Cloud Console 프로젝트 생성

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - Google 계정으로 로그인

2. **새 프로젝트 생성**
   ```
   ▶ 상단 프로젝트 선택 드롭다운 클릭
   ▶ "새 프로젝트" 버튼 클릭
   ▶ 프로젝트 이름: "subscription-manager-oauth" (또는 원하는 이름)
   ▶ "만들기" 버튼 클릭
   ```

### 1-2. OAuth 동의 화면 설정

1. **OAuth 동의 화면 구성**
   ```
   ▶ 좌측 메뉴: "APIs 및 서비스" → "OAuth 동의 화면"
   ▶ 사용자 유형: "외부" 선택 (일반 사용자용)
   ▶ "만들기" 버튼 클릭
   ```

2. **앱 정보 입력**
   ```
   앱 이름: "Subscription Manager"
   사용자 지원 이메일: 본인 이메일
   앱 로고: (선택사항)
   앱 도메인:
   - 홈페이지: https://subscription.moonwave.kr
   - 개인정보처리방침: https://subscription.moonwave.kr/privacy
   - 서비스 약관: https://subscription.moonwave.kr/terms
   개발자 연락처 정보: 본인 이메일
   ```

3. **범위 설정**
   ```
   ▶ "범위 추가 또는 삭제" 클릭
   ▶ 다음 범위들 선택:
     - ../auth/userinfo.email
     - ../auth/userinfo.profile
     - openid
   ▶ "업데이트" 클릭
   ```

4. **테스트 사용자 추가** (개발 중에만 필요)
   ```
   ▶ "+ 사용자 추가" 클릭
   ▶ 테스트할 이메일 주소들 추가
   ▶ "저장 후 계속" 클릭
   ```

### 1-3. OAuth 2.0 클라이언트 ID 생성

1. **사용자 인증 정보 생성**
   ```
   ▶ 좌측 메뉴: "APIs 및 서비스" → "사용자 인증 정보"
   ▶ "+ 사용자 인증 정보 만들기" 클릭
   ▶ "OAuth 2.0 클라이언트 ID" 선택
   ```

2. **애플리케이션 유형 설정**
   ```
   애플리케이션 유형: "웹 애플리케이션"
   이름: "Subscription Manager Web Client"
   ```

3. **승인된 리디렉션 URI 설정**
   ```
   승인된 리디렉션 URI:
   - https://hmgxlxnrarciimggycxj.supabase.co/auth/v1/callback
   - https://subscription.moonwave.kr/auth/callback
   - http://localhost:3000/auth/callback (개발용)
   ```

4. **클라이언트 ID 저장**
   ```
   ▶ "만들기" 클릭
   ▶ 생성된 클라이언트 ID와 클라이언트 보안 비밀번호 복사하여 저장
   ```

## 📋 Step 2: Supabase 설정

### 2-1. Supabase 프로젝트 생성 (기존 프로젝트가 없는 경우)

1. **Supabase 접속 및 프로젝트 생성**
   ```
   ▶ https://supabase.com 접속
   ▶ GitHub/Google 계정으로 로그인
   ▶ "New project" 클릭
   ▶ Organization 선택
   ▶ 프로젝트 이름: "subscription-manager"
   ▶ 데이터베이스 비밀번호 설정
   ▶ 지역 선택: "Northeast Asia (Tokyo)"
   ▶ "Create new project" 클릭
   ```

### 2-2. Supabase Authentication 설정

1. **Authentication 설정 접속**
   ```
   ▶ Supabase Dashboard에서 프로젝트 선택
   ▶ 좌측 메뉴: "Authentication" → "Providers"
   ▶ "Google" 프로바이더 클릭
   ```

2. **Google 프로바이더 설정**
   ```
   Enable sign in with Google: ON
   Client ID: [Step 1-3에서 복사한 Google Client ID]
   Client Secret: [Step 1-3에서 복사한 Google Client Secret]
   Redirect URL: https://[프로젝트ID].supabase.co/auth/v1/callback
   ```

3. **URL Configuration 설정**
   ```
   ▶ Authentication → "URL Configuration"
   
   Site URL: https://subscription.moonwave.kr
   
   Redirect URLs:
   - https://subscription.moonwave.kr/**
   - http://localhost:3000/**
   ```

4. **Email Templates 설정 (선택사항)**
   ```
   ▶ Authentication → "Email Templates"
   ▶ 필요한 이메일 템플릿 커스터마이징
   ```

## 📋 Step 3: 프로젝트 환경 변수 설정

### 3-1. 환경 변수 파일 생성

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://[프로젝트ID].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[Supabase Anon Key]

# Google OAuth Configuration  
REACT_APP_GOOGLE_CLIENT_ID=[Google Client ID]

# Site Configuration
REACT_APP_SITE_URL=https://subscription.moonwave.kr
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://subscription.moonwave.kr/auth/callback
```

### 3-2. Supabase 키 확인 방법

1. **Supabase 키 가져오기**
   ```
   ▶ Supabase Dashboard → Settings → "API"
   ▶ "Project URL" 복사 → REACT_APP_SUPABASE_URL에 설정
   ▶ "anon public" key 복사 → REACT_APP_SUPABASE_ANON_KEY에 설정
   ```

## 📋 Step 4: 코드 구현

### 4-1. Supabase 클라이언트 설정 확인

현재 `src/lib/supabase.ts` 파일이 이미 올바르게 설정되어 있습니다:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
```

### 4-2. Google OAuth 로그인 구현

```typescript
// Google OAuth 로그인 함수
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Google 로그인 오류:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Google 로그인 예외:', error);
    return { success: false, error };
  }
};
```

### 4-3. 인증 콜백 처리

```typescript
// 인증 콜백 처리 함수
export const handleAuthCallback = async () => {
  try {
    // URL에서 인증 정보 처리
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('인증 콜백 오류:', error);
      return { success: false, error };
    }

    if (data.session) {
      console.log('인증 성공:', data.session.user);
      return { success: true, session: data.session };
    }

    return { success: false, error: '세션을 찾을 수 없습니다.' };
  } catch (error) {
    console.error('인증 콜백 예외:', error);
    return { success: false, error };
  }
};
```

## 📋 Step 5: 테스트 및 디버깅

### 5-1. 로컬 개발 환경에서 테스트

```bash
# 개발 서버 시작
npm start

# 브라우저에서 http://localhost:3000 접속
# Google 로그인 버튼 클릭하여 테스트
```

### 5-2. 디버깅 방법

1. **브라우저 개발자 도구에서 확인**
   ```javascript
   // 현재 세션 확인
   const { data } = await supabase.auth.getSession();
   console.log('Current session:', data.session);

   // OAuth URL 생성 테스트
   const { data: oauthData, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: `${window.location.origin}/auth/callback` }
   });
   console.log('OAuth URL:', oauthData?.url);
   ```

2. **일반적인 오류 해결**
   - `redirect_uri_mismatch`: Google Cloud Console의 리디렉션 URI 확인
   - `invalid_client`: Client ID/Secret 확인
   - `access_denied`: OAuth 동의 화면 설정 확인

### 5-3. 프로덕션 배포 전 체크리스트

- [ ] 환경 변수가 프로덕션 환경에 올바르게 설정되었는지 확인
- [ ] Google Cloud Console의 리디렉션 URI에 프로덕션 URL 추가
- [ ] Supabase의 Site URL과 Redirect URLs에 프로덕션 URL 설정
- [ ] HTTPS 인증서가 올바르게 설정되었는지 확인

## 🚀 완료!

이제 Google OAuth 인증이 완전히 설정되었습니다. 사용자는 Google 계정으로 쉽게 로그인할 수 있습니다.

## 📞 문제 해결

문제가 발생하는 경우:
1. 브라우저 개발자 도구의 Console과 Network 탭 확인
2. Supabase Dashboard의 Authentication 로그 확인  
3. Google Cloud Console의 OAuth 2.0 playground에서 테스트
4. 환경 변수와 URL 설정 재확인