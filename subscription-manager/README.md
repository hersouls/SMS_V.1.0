# 구독 관리 서비스 (Subscription Manager)

## 📋 개요
구독 서비스들을 한 곳에서 관리할 수 있는 웹 애플리케이션입니다. 사용자는 자신의 구독 서비스를 추가, 수정, 삭제하고 결제일을 추적할 수 있습니다.

## 🚀 주요 기능

### ✅ Supabase 완전 연동
- **하드코딩된 데이터 완전 제거**: 모든 구독, 알림, 히스토리 데이터가 Supabase에서 관리됩니다
- **실시간 데이터 동기화**: 사용자별 데이터 실시간 로딩 및 업데이트
- **사용자 인증**: Google OAuth 및 이메일/비밀번호 로그인 지원
- **프로필 관리**: 사용자 프로필 정보 Supabase 저장 및 관리

### 📊 구독 관리
- ✅ 구독 서비스 추가/수정/삭제 (Supabase 연동)
- ✅ 다중 통화 지원 (KRW, USD, EUR, JPY)
- ✅ 실시간 환율 정보 (Supabase 저장)
- ✅ 카테고리별 구독 분류
- ✅ 커스텀 아이콘 업로드 지원

### 🔔 알림 시스템
- ✅ 구독 관련 알림 (Supabase 연동)
- ✅ 히스토리 추적 (추가/수정/삭제 기록)
- ✅ 알림 읽음 처리 및 삭제

### 📱 반응형 UI
- ✅ 모바일 최적화 디자인
- ✅ 다크모드 지원
- ✅ 직관적인 사용자 인터페이스

## 🛠 기술 스택

### Frontend
- **React 19.1.0** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Headless UI** - 접근성 높은 UI 컴포넌트
- **Lucide React** - 아이콘

### Backend & Database
- **Supabase** - 백엔드 서비스
  - PostgreSQL 데이터베이스
  - 실시간 구독
  - 사용자 인증
  - 파일 저장소

### Supabase 테이블 구조
- `profiles` - 사용자 프로필 정보
- `subscriptions` - 구독 서비스 데이터
- `notifications` - 알림 데이터
- `alarm_history` - 히스토리 추적
- `exchange_rates` - 환율 정보

## 🔧 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd subscription-manager
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase 데이터베이스 설정
`supabase-schema.sql` 파일을 사용하여 Supabase에 필요한 테이블들을 생성하세요.

### 5. 애플리케이션 실행
```bash
npm start
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

## 📦 빌드

프로덕션 빌드를 생성하려면:

```bash
npm run build
```

## 🔐 인증 설정

### Google OAuth 설정
1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
2. Supabase 대시보드에서 Google Provider 설정
3. 리디렉션 URL 설정: `https://your-supabase-project.supabase.co/auth/v1/callback`

자세한 설정 방법은 `Google_OAuth_Setup_Guide.md`를 참조하세요.

## 📊 데이터베이스 스키마

### 주요 테이블
- **subscriptions**: 구독 서비스 정보 저장
- **profiles**: 사용자 프로필 정보
- **notifications**: 시스템 알림
- **alarm_history**: 구독 관련 히스토리
- **exchange_rates**: 환율 정보

## 🚀 배포

프로젝트는 GitHub Pages, Netlify, Vercel 등 정적 호스팅 서비스에 배포할 수 있습니다.

Vercel 배포 예시:
```bash
npm run build
npx vercel --prod
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

- 개발자: [GitHub Profile](https://github.com/hersouls)
- 블로그: [Naver Blog](https://blog.naver.com/ycdy80)
- 인스타그램: [@da_youn](https://www.instagram.com/da_youn/)

## 📈 업데이트 내역

### v2.0.0 - Supabase 완전 연동 (2024-01-XX)
- ✅ 모든 하드코딩된 데이터 제거
- ✅ Supabase 데이터베이스 완전 연동
- ✅ 사용자별 데이터 분리 및 보안 강화
- ✅ 실시간 데이터 동기화
- ✅ 프로필 관리 시스템 추가
- ✅ 환율 정보 자동 저장 및 관리

### v1.0.0 - 초기 버전
- 구독 관리 기본 기능
- 반응형 UI 구현
- 로컬 상태 관리
