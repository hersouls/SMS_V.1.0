# 프로젝트 문서

이 폴더에는 구독 관리 애플리케이션의 개발 및 운영에 필요한 문서들이 포함되어 있습니다.

## 문서 목록

### 🚀 개발 환경 설정
- **[DEVELOPMENT_SETUP_GUIDE.md](./DEVELOPMENT_SETUP_GUIDE.md)** - 개발 환경 설정 가이드
- **[LOCALHOST_DEVELOPMENT.md](./LOCALHOST_DEVELOPMENT.md)** - Localhost 개발 환경 상세 가이드

### 🔧 설정 및 인증
- **[Google_OAuth_Setup_Guide.md](./Google_OAuth_Setup_Guide.md)** - Google OAuth 설정 가이드
- **[Google_OAuth_Troubleshooting.md](./Google_OAuth_Troubleshooting.md)** - Google OAuth 문제 해결
- **[SUPABASE_MIGRATION_SUMMARY.md](./SUPABASE_MIGRATION_SUMMARY.md)** - Supabase 마이그레이션 요약

### 🧪 테스트 및 품질 관리
- **[Test Plan](./Test%20Plan)** - 테스트 계획
- **[test-setup-checklist.md](./test-setup-checklist.md)** - 테스트 설정 체크리스트

### 📈 최적화 및 성능
- **[OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)** - 최적화 요약

## 빠른 시작

### 1. 개발 환경 설정
```bash
# 프로젝트 클론
git clone <repository-url>
cd subscription-manager

# 의존성 설치
npm install

# .env.local 파일 생성 및 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 실제 값들을 입력

# 개발 서버 실행
npm start
```

### 2. 필수 설정
1. **Supabase 프로젝트 생성** - [DEVELOPMENT_SETUP_GUIDE.md](./DEVELOPMENT_SETUP_GUIDE.md) 참조
2. **데이터베이스 스키마 설정** - [LOCALHOST_DEVELOPMENT.md](./LOCALHOST_DEVELOPMENT.md) 참조
3. **Google OAuth 설정** (선택사항) - [Google_OAuth_Setup_Guide.md](./Google_OAuth_Setup_Guide.md) 참조

## 환경별 설정

### Development (Localhost)
- Site URL: `http://localhost:3000`
- Auth Redirect: `http://localhost:3000/auth/callback`
- Environment: `development`

### Production
- Site URL: `https://your-domain.com`
- Auth Redirect: `https://your-domain.com/auth/callback`
- Environment: `production`

## 문제 해결

### 일반적인 문제들
1. **인증 관련 문제** - [Google_OAuth_Troubleshooting.md](./Google_OAuth_Troubleshooting.md) 참조
2. **환경변수 문제** - [DEVELOPMENT_SETUP_GUIDE.md](./DEVELOPMENT_SETUP_GUIDE.md) 참조
3. **데이터베이스 연결 문제** - [LOCALHOST_DEVELOPMENT.md](./LOCALHOST_DEVELOPMENT.md) 참조

### 테스트 관련
- [test-setup-checklist.md](./test-setup-checklist.md)에서 테스트 환경 설정 확인
- [Test Plan](./Test%20Plan)에서 테스트 시나리오 확인

## 문서 업데이트

새로운 문서를 추가하거나 기존 문서를 수정할 때는 다음 사항을 확인하세요:

1. 문서명은 명확하고 일관성 있게 작성
2. 관련 문서들과의 링크 업데이트
3. 이 README.md 파일의 목록 업데이트
4. 문서 내용의 정확성 검증

## 추가 리소스

- [프로젝트 메인 README](../README.md)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)