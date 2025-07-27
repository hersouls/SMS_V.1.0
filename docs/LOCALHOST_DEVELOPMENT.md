# Localhost 개발 환경 가이드

## 개요

이 문서는 localhost 환경에서 구독 관리 애플리케이션을 개발하기 위한 상세한 가이드입니다.

## 개발 환경 준비

### 1. 필수 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- Git
- 웹 브라우저 (Chrome, Firefox, Safari, Edge)

### 2. 프로젝트 설정

#### 2.1 프로젝트 클론
```bash
git clone <repository-url>
cd subscription-manager
```

#### 2.2 의존성 설치
```bash
npm install
```

#### 2.3 환경변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Exchange Rate API
REACT_APP_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key

# Site Configuration (localhost 개발용)
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

## Supabase 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com/)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름과 데이터베이스 비밀번호 설정
4. 지역 선택 (가까운 지역 권장)
5. 프로젝트 생성 완료

### 2. Authentication 설정

#### 2.1 URL Configuration
1. Supabase Dashboard > Authentication > Settings
2. URL Configuration 섹션에서:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

#### 2.2 Auth Providers 설정
1. **Email Provider**:
   - Enable Email Signup: 활성화
   - Enable Email Confirmations: 선택사항 (개발 시 비활성화 권장)

2. **Google Provider** (선택사항):
   - Enable Google Signup: 활성화
   - Client ID와 Client Secret 입력

### 3. 데이터베이스 설정

#### 3.1 스키마 생성
Supabase SQL Editor에서 다음 SQL 실행:

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 구독 테이블
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  renewal_date DATE NOT NULL,
  payment_date DATE,
  payment_method TEXT,
  url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알람 히스토리 테이블
CREATE TABLE alarm_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2 RLS (Row Level Security) 설정

```sql
-- profiles 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- subscriptions 테이블 RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- notifications 테이블 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- alarm_history 테이블 RLS
ALTER TABLE alarm_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alarm history" ON alarm_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alarm history" ON alarm_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 3.3 함수 및 트리거 설정

```sql
-- 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새 사용자 등록 시 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 개발 서버 실행

### 1. 개발 서버 시작
```bash
npm start
```

### 2. 브라우저에서 확인
- http://localhost:3000 접속
- 개발자 도구 콘솔에서 에러 확인

### 3. 핫 리로드
- 코드 변경 시 자동으로 브라우저 새로고침
- React Fast Refresh 지원

## 개발 팁

### 1. 환경변수 변경 시
- `.env.local` 파일 변경 후 개발 서버 재시작 필요
- `Ctrl+C`로 서버 중지 후 `npm start` 재실행

### 2. Supabase 연결 확인
- 브라우저 콘솔에서 Supabase 연결 상태 확인
- Network 탭에서 API 요청/응답 확인

### 3. 데이터베이스 디버깅
- Supabase Dashboard > Table Editor에서 데이터 확인
- SQL Editor에서 직접 쿼리 실행

### 4. 인증 디버깅
- Supabase Dashboard > Authentication > Users에서 사용자 확인
- Authentication > Logs에서 인증 로그 확인

## 문제 해결

### 1. 포트 충돌
```bash
# 3000번 포트가 사용 중인 경우
lsof -ti:3000 | xargs kill -9
```

### 2. 모듈 설치 문제
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 3. 환경변수 문제
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경변수 이름이 `REACT_APP_`으로 시작하는지 확인
- 개발 서버 재시작

### 4. Supabase 연결 문제
- API URL과 키가 올바른지 확인
- Supabase 프로젝트가 활성 상태인지 확인
- 네트워크 연결 상태 확인

## 추가 리소스

- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)