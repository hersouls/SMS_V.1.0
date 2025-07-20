# 구독 관리 애플리케이션

React와 TypeScript로 개발된 구독 서비스 관리 애플리케이션입니다.

## 주요 기능

### 📱 구독 관리
- 구독 서비스 추가/수정/삭제
- 구독 정보 관리 (이름, 가격, 갱신일, 결제일, 결제 방법, URL 등)
- 통화 지원 (USD, KRW)
- 실시간 환율 정보 연동 (한국은행 ECOS API)

### 💰 가격 관리
- 월 구독료 추적
- 원화 통합 표시 (달러 구독도 원화로 환산)
- 총 구독 수 및 총액 표시

### 📅 달력 기능
- 구독 갱신일 달력 표시
- 달력에서 구독 정보 확인 및 수정

### 🔔 알림 시스템
- 구독 추가/수정/삭제 알림
- 알람 히스토리 관리
- 실시간 알림 토스트

### 👤 프로필 관리
- 사용자 프로필 정보 관리
- 프로필 사진 및 커버 사진 업로드
- 개인 정보 수정

### 🎨 UI/UX
- 반응형 디자인
- Tailwind CSS 스타일링
- Lucide React 아이콘
- Google Fonts (Nanum Gothic)

## 기술 스택

- **Frontend**: React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React, Heroicons
- **State Management**: React Hooks
- **Build Tool**: Create React App

## 프로젝트 구조

```
/
├── src/                    # 소스 코드
│   ├── components/         # React 컴포넌트
│   ├── contexts/          # React Context
│   ├── hooks/             # 커스텀 훅
│   ├── lib/               # 유틸리티 라이브러리
│   ├── types/             # TypeScript 타입 정의
│   └── App.tsx           # 메인 앱 컴포넌트
├── public/                # 정적 파일
├── docs/                  # 프로젝트 문서
│   ├── OPTIMIZATION_SUMMARY.md
│   ├── SUPABASE_MIGRATION_SUMMARY.md
│   ├── test-setup-checklist.md
│   └── Google_OAuth_Setup_Guide.md
├── database/              # 데이터베이스 관련 파일
│   ├── supabase-schema.sql
│   ├── supabase-sql-editor.sql
│   └── supabase-test-queries.sql
├── .github/              # GitHub Actions 워크플로우
│   └── workflows/
│       └── deploy.yml    # 자동 배포 설정
└── package.json          # 프로젝트 설정
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 빌드
npm run build
```

## 환경 설정

### Supabase 설정
Supabase를 사용하여 백엔드 데이터베이스를 구성합니다.

1. [Supabase](https://supabase.com/)에서 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 API 키 확인
3. `.env.local` 파일 생성 및 환경변수 설정:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Exchange Rate API (기존 설정 유지)
REACT_APP_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
```

### 소셜 로그인 설정

구글과 카카오톡 소셜 로그인을 사용하려면 Supabase에서 다음 설정을 완료해야 합니다:

#### Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI에 `https://your-project.supabase.co/auth/v1/callback` 추가
4. 클라이언트 ID와 클라이언트 시크릿을 Supabase Authentication > Providers > Google에 설정

#### Kakao OAuth 설정
1. [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 생성
2. 플랫폼 설정에서 웹 플랫폼 추가
3. 사이트 도메인에 `https://your-project.supabase.co` 추가
4. 리디렉션 URI에 `https://your-project.supabase.co/auth/v1/callback` 추가
5. JavaScript 키를 Supabase Authentication > Providers > Kakao에 설정

### 환율 API 설정
한국은행 ECOS API를 사용하여 실시간 환율 정보를 가져옵니다.

1. [한국은행 ECOS](https://ecos.bok.or.kr/)에서 API 키 발급
2. `src/App.tsx`의 `fetchExchangeRate` 함수에서 API 키 설정

```typescript
const API_KEY = 'your_api_key_here';
const response = await fetch(`https://ecos.bok.or.kr/api/StatisticSearch/${API_KEY}/json/kr/1/100/036Y001/DD/${dateStr}/${dateStr}/0001`);
```

## 프로젝트 구조

```
src/
├── App.tsx              # 메인 애플리케이션 컴포넌트
├── App.css              # 전역 스타일
├── index.tsx            # 애플리케이션 진입점
└── index.css            # 기본 스타일
```

## 주요 컴포넌트

- **메인 화면**: 구독 목록, 총액 표시, 달력
- **구독 추가/수정**: 구독 정보 입력 폼
- **상세 보기**: 구독 상세 정보 표시
- **알림**: 알림 목록 및 관리
- **알람 히스토리**: 구독 활동 기록
- **프로필**: 사용자 프로필 관리

## 라이선스

MIT License
