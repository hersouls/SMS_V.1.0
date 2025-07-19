# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 1-1. 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1-2. OAuth 2.0 클라이언트 ID 생성
1. **API 및 서비스** > **사용자 인증 정보** 이동
2. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `Subscription Manager` (또는 원하는 이름)
5. **승인된 리디렉션 URI** 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. **만들기** 클릭
7. **클라이언트 ID**와 **클라이언트 보안 비밀**을 복사하여 저장

### 1-3. OAuth 동의 화면 설정
1. **OAuth 동의 화면** 메뉴로 이동
2. 사용자 유형: **외부** 선택 (개인 프로젝트의 경우)
3. 앱 정보 입력:
   - **앱 이름**: Subscription Manager
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
4. **저장 후 계속** 클릭
5. 범위는 기본값 유지하고 **저장 후 계속**
6. 테스트 사용자에 본인 이메일 추가

## 2. Supabase 설정

### 2-1. Google Provider 활성화
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication** > **Providers** 이동
4. **Google** 찾아서 **Enable** 클릭
5. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID**: Google OAuth 클라이언트 ID
   - **Client Secret**: Google OAuth 클라이언트 보안 비밀
6. **Save** 클릭

### 2-2. Site URL 설정
1. **Authentication** > **URL Configuration** 이동
2. **Site URL** 설정:
   - 개발환경: `http://localhost:3000`
   - 운영환경: `https://your-domain.com`
3. **Redirect URLs** 추가:
   - `http://localhost:3000`
   - `https://your-domain.com`

## 3. 프로젝트 설정

### 3-1. 환경 변수 설정
`.env` 파일을 프로젝트 루트에 생성:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3-2. 데이터베이스 스키마 실행
1. Supabase Dashboard > **SQL Editor**
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행
3. 프로필 자동 생성 트리거가 제대로 설정되었는지 확인

## 4. 테스트

### 4-1. 로컬 개발 서버 실행
```bash
npm start
```

### 4-2. Google 로그인 테스트
1. 브라우저에서 `http://localhost:3000` 접속
2. **Google로 로그인** 버튼 클릭
3. Google 계정으로 로그인
4. 프로필이 자동으로 생성되는지 확인

### 4-3. 디버깅
브라우저 개발자 도구의 Console에서 다음 로그 확인:
- Auth state changed
- User logged in, fetching profile
- Profile created successfully 또는 기존 프로필 로드

## 5. 문제 해결

### 자주 발생하는 문제들:

1. **"unauthorized_client" 오류**
   - Google Cloud Console의 승인된 리디렉션 URI 확인
   - Supabase URL이 정확한지 확인

2. **프로필이 생성되지 않음**
   - Supabase SQL Editor에서 트리거 확인
   - 브라우저 Console에서 에러 메시지 확인

3. **로그인 후 빈 화면**
   - Network 탭에서 API 요청 확인
   - RLS 정책이 올바르게 설정되었는지 확인

## 6. 보안 고려사항

1. **환경 변수 보안**
   - `.env` 파일을 절대 git에 커밋하지 마세요
   - `.gitignore`에 `.env` 추가 확인

2. **RLS 정책**
   - 모든 테이블에 적절한 RLS 정책이 설정되어 있는지 확인
   - 사용자가 본인의 데이터만 접근할 수 있도록 제한

3. **OAuth 설정**
   - 클라이언트 보안 비밀을 안전하게 보관
   - 승인된 리디렉션 URI만 사용하도록 설정