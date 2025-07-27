# 개발 환경 설정 가이드

## 개요

이 프로젝트는 localhost 정책 변경과 .env.local 수동 설정을 통한 개발 환경을 제공합니다.

## 개발 환경 설정

### 1. .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Exchange Rate API
REACT_APP_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key

# Site Configuration
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_APP_NAME=구독 관리 앱

# Environment
REACT_APP_ENV=development

# Supabase Auth Configuration (localhost용)
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# Google OAuth Configuration (선택사항)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Supabase 설정

#### 2.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com/)에서 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 API 키 확인
3. `.env.local` 파일에 설정값 입력

#### 2.2 Authentication 설정
1. **Supabase Dashboard > Authentication > Settings > Auth Providers**
   - Email provider 활성화
   - "Confirm email" 옵션 활성화 (선택사항)

2. **Supabase Dashboard > Authentication > URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

#### 2.3 Google OAuth 설정 (선택사항)
1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI에 다음 추가:
   - `http://localhost:3000/auth/callback`
   - `https://your-project.supabase.co/auth/v1/callback`
4. 클라이언트 ID와 클라이언트 시크릿을 Supabase Authentication > Providers > Google에 설정

### 3. 데이터베이스 설정

#### 3.1 스키마 생성
`database/` 폴더의 SQL 파일들을 Supabase SQL Editor에서 실행:

```sql
-- 기본 테이블 생성
-- supabase-schema.sql 실행

-- 테스트 데이터 삽입 (선택사항)
-- supabase-test-queries.sql 실행
```

#### 3.2 RLS (Row Level Security) 설정
각 테이블에 대해 RLS 정책을 설정해야 합니다:

```sql
-- subscriptions 테이블 RLS 설정
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
    FOR DELETE USING (auth.uid() = user_id);
```

### 4. 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 환경별 설정

### Development 환경
- Site URL: `http://localhost:3000`
- Auth Redirect: `http://localhost:3000/auth/callback`
- Environment: `development`

### Production 환경
- Site URL: `https://your-domain.com`
- Auth Redirect: `https://your-domain.com/auth/callback`
- Environment: `production`

## 문제 해결

### 1. 인증 관련 문제
- Supabase 프로젝트의 URL과 API 키가 올바른지 확인
- Redirect URL이 Supabase 설정과 일치하는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 2. 데이터베이스 연결 문제
- RLS 정책이 올바르게 설정되었는지 확인
- 테이블 스키마가 올바르게 생성되었는지 확인
- Supabase 대시보드에서 테이블 구조 확인

### 3. 환경변수 문제
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경변수 이름이 `REACT_APP_`으로 시작하는지 확인
- 개발 서버를 재시작하여 환경변수 변경사항 적용

## 보안 주의사항

1. `.env.local` 파일은 절대 Git에 커밋하지 마세요
2. 프로덕션 환경에서는 실제 API 키를 사용하세요
3. Supabase 프로젝트의 보안 설정을 정기적으로 검토하세요

## 추가 리소스

- [Supabase Documentation](https://supabase.com/docs)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)