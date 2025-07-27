# Supabase OAuth 설정 가이드

## 1. Supabase 프로젝트 설정

### Authentication > URL Configuration

1. **Site URL 설정:**
   ```
   https://travel.moonwave.kr
   ```

2. **Redirect URLs 설정:**
   ```
   https://travel.moonwave.kr/auth/callback
   http://localhost:3000/auth/callback
   ```

## 2. Google OAuth 설정

### Google Cloud Console > APIs & Services > Credentials

1. **Authorized JavaScript Origins:**
   ```
   https://travel.moonwave.kr
   http://localhost:3000
   ```

2. **Authorized Redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   https://travel.moonwave.kr/auth/callback
   https://travel.moonwave.kr/travels
   ```

## 3. 환경 변수 설정

### 개발 환경 (.env.local)
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

### 프로덕션 환경 (.env.production)
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SITE_URL=https://travel.moonwave.kr
REACT_APP_SUPABASE_AUTH_REDIRECT_URL=https://travel.moonwave.kr/auth/callback
```

## 4. 테스트 방법

### 개발 환경 테스트
1. `npm start` 실행
2. `http://localhost:3000` 접속 확인
3. `http://localhost:3000/auth/callback` 접속 확인

### 프로덕션 환경 테스트
1. `npm run build` 실행
2. `https://travel.moonwave.kr` 접속 확인
3. `https://travel.moonwave.kr/auth/callback` 접속 확인

## 5. 문제 해결

### OAuth 오류가 발생하는 경우
1. Google OAuth 설정에서 도메인이 올바르게 등록되어 있는지 확인
2. Redirect URI가 정확한지 확인
3. 클라이언트 ID가 올바른지 확인

### Supabase 연결 오류가 발생하는 경우
1. Supabase 프로젝트 URL이 올바른지 확인
2. Anon Key가 올바른지 확인
3. Site URL과 Redirect URLs가 올바르게 설정되어 있는지 확인