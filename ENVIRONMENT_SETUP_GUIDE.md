# 환경 설정 가이드

## 환경 변수 설정

### 1. 개발 환경 (localhost:3000)

```bash
# .env.local 파일 생성
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_CLIENT_SECRET=your-google-client-secret
REACT_APP_EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
REACT_APP_APP_NAME=구독 관리 앱
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

### 2. 프로덕션 환경 (travel.moonwave.kr)

```bash
# .env.production 파일 생성
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_CLIENT_SECRET=your-google-client-secret
REACT_APP_EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
REACT_APP_APP_NAME=구독 관리 앱
REACT_APP_SITE_URL=https://travel.moonwave.kr
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://travel.moonwave.kr/auth/callback
```

## OAuth 설정

### Google OAuth 설정

1. **Authorized JavaScript Origins:**
   - `https://travel.moonwave.kr`
   - `http://localhost:3000`

2. **Authorized Redirect URIs:**
   - `http://localhost:3000/auth/callback`
   - `https://travel.moonwave.kr/auth/callback`
   - `https://travel.moonwave.kr/travels`

### Supabase OAuth 설정

1. **Site URL:** `https://travel.moonwave.kr`
2. **Redirect URLs:**
   - `https://travel.moonwave.kr/auth/callback`
   - `http://localhost:3000/auth/callback`

## 환경 변수 설명

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `REACT_APP_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 필수 |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase 익명 키 | ✅ 필수 |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | ✅ 필수 |
| `REACT_APP_GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 | ⚠️ 선택 |
| `REACT_APP_EXCHANGE_RATE_API_KEY` | 환율 API 키 | ⚠️ 선택 |
| `REACT_APP_APP_NAME` | 앱 이름 | ⚠️ 선택 |
| `REACT_APP_SITE_URL` | 사이트 URL | ⚠️ 선택 |
| `REACT_APP_SUPABASE_AUTH_REDIRECT_URL` | Supabase 인증 리디렉션 URL | ⚠️ 선택 |

## 개발 환경 확인

1. **환경 변수 확인:**
   ```bash
   npm run env:check
   ```

2. **개발 서버 실행:**
   ```bash
   npm start
   ```

3. **환경 변수 검증:**
   - `REACT_APP_SITE_URL`이 `http://localhost:3000`으로 설정되어 있는지 확인
   - `REACT_APP_SUPABASE_AUTH_REDIRECT_URL`이 `http://localhost:3000/auth/callback`으로 설정되어 있는지 확인

## 프로덕션 환경 확인

1. **환경 변수 확인:**
   - `REACT_APP_SITE_URL`이 `https://travel.moonwave.kr`으로 설정되어 있는지 확인
   - `REACT_APP_SUPABASE_AUTH_REDIRECT_URL`이 `https://travel.moonwave.kr/auth/callback`으로 설정되어 있는지 확인

2. **OAuth 설정 확인:**
   - Google OAuth에서 `https://travel.moonwave.kr`이 Authorized JavaScript Origins에 포함되어 있는지 확인
   - Google OAuth에서 `https://travel.moonwave.kr/auth/callback`이 Authorized Redirect URIs에 포함되어 있는지 확인

## 문제 해결

### 환경 변수 오류

환경 변수가 올바르게 설정되지 않은 경우:

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
3. 값에 따옴표가 없는지 확인

### OAuth 오류

OAuth 인증이 실패하는 경우:

1. Google OAuth 설정에서 도메인이 올바르게 등록되어 있는지 확인
2. Redirect URI가 정확한지 확인
3. 클라이언트 ID와 시크릿이 올바른지 확인

### 개발 환경에서 OAuth 테스트

개발 환경에서 OAuth를 테스트하려면:

1. Google OAuth 설정에 `http://localhost:3000`을 Authorized JavaScript Origins에 추가
2. Google OAuth 설정에 `http://localhost:3000/auth/callback`을 Authorized Redirect URIs에 추가
3. Supabase 설정에 `http://localhost:3000/auth/callback`을 Redirect URLs에 추가