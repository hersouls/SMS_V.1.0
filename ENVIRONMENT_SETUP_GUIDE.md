# 환경변수 설정 가이드

## 🔧 환경별 설정

### 1. 개발 환경 (localhost:3000)

`.env.local` 파일을 생성하고 다음 설정을 추가하세요:

```bash
# Development Environment Configuration
REACT_APP_SUPABASE_URL=https://hmgxlxnrarciimggycxj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB
hYmFzZSIsInJlZiI6ImhtZ3hseG5yYXJjaWltZ2d5Y3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI
4NTEyMTMsImV4cCI6MjA2ODQyNzIxM30.F39Ko64J1tewWuw6OLLPTSLjy4gdE9L9yNgn56wbP7k

# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=350164367455-c1n2g0iin0lg2olq9kgrq95cpdvum1qv.apps.go
ogleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Site Configuration - Development
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_APP_NAME=구독 관리 앱 (개발)

# Environment
REACT_APP_ENV=development

# Supabase Auth Configuration - Development
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000/#/auth/callback

# Exchange Rate API
REACT_APP_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
```

### 2. 프로덕션 환경

`.env` 파일을 사용하거나 배포 플랫폼의 환경변수 설정을 사용하세요:

```bash
# Production Environment Configuration
REACT_APP_SUPABASE_URL=https://hmgxlxnrarciimggycxj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXB
hYmFzZSIsInJlZiI6ImhtZ3hseG5yYXJjaWltZ2d5Y3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI
4NTEyMTMsImV4cCI6MjA2ODQyNzIxM30.F39Ko64J1tewWuw6OLLPTSLjy4gdE9L9yNgn56wbP7k

# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=350164367455-c1n2g0iin0lg2olq9kgrq95cpdvum1qv.apps.go
ogleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Site Configuration - Production
REACT_APP_SITE_URL=https://subscription.moonwave.kr
REACT_APP_APP_NAME=구독 관리 앱

# Environment
REACT_APP_ENV=production

# Supabase Auth Configuration - Production
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://subscription.moonwave.kr/#/auth/callback

# Exchange Rate API
REACT_APP_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
```

## 🚀 실행 방법

### 개발 환경 실행
```bash
npm run start:dev
```

### 프로덕션 빌드
```bash
npm run build:prod
```

### 환경변수 확인
```bash
npm run env:check
```

## ✅ 필수 환경변수

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `REACT_APP_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 필수 |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase 익명 키 | ✅ 필수 |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | ✅ 필수 |
| `REACT_APP_GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 | ⚠️ 선택 |
| `REACT_APP_SITE_URL` | 사이트 URL | ⚠️ 선택 |
| `REACT_APP_APP_NAME` | 앱 이름 | ⚠️ 선택 |
| `REACT_APP_EXCHANGE_RATE_API_KEY` | 환율 API 키 | ⚠️ 선택 |

## 🔍 환경변수 검증

앱이 시작될 때 자동으로 환경변수가 검증됩니다. 콘솔에서 다음 정보를 확인할 수 있습니다:

- ✅ 정상: 모든 필수 환경변수가 올바르게 설정됨
- ❌ 오류: 필수 환경변수가 누락되거나 잘못됨
- ⚠️ 경고: 선택적 환경변수가 플레이스홀더 값으로 설정됨

## 🛠️ 문제 해결

### 1. localhost 개발이 안 되는 경우
- `.env.local` 파일이 있는지 확인
- `REACT_APP_SITE_URL`이 `http://localhost:3000`으로 설정되어 있는지 확인
- `npm run start:dev` 명령어 사용

### 2. Google OAuth 오류
- `REACT_APP_GOOGLE_CLIENT_ID`가 올바른 형식인지 확인
- Google Cloud Console에서 OAuth 클라이언트 ID 확인
- 리디렉션 URI가 올바르게 설정되어 있는지 확인

### 3. Supabase 연결 오류
- `REACT_APP_SUPABASE_URL`이 HTTPS로 시작하는지 확인
- `REACT_APP_SUPABASE_ANON_KEY`가 충분히 긴지 확인 (50자 이상)
- Supabase 프로젝트가 활성화되어 있는지 확인

## 📝 참고사항

- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다
- 프로덕션 환경에서는 HTTPS URL을 사용해야 합니다
- 환경변수는 `REACT_APP_` 접두사로 시작해야 합니다
- 앱을 재시작해야 환경변수 변경사항이 적용됩니다