# GitHub Actions 배포 설정 가이드

## 개요
이 프로젝트는 GitHub Actions를 통해 GitHub Pages에 자동 배포됩니다. 배포가 성공하려면 필수 환경 변수들을 GitHub Secrets에 설정해야 합니다.

## 필수 GitHub Secrets 설정

### 1. GitHub Repository Settings 접속
1. GitHub 저장소 페이지에서 **Settings** 탭 클릭
2. 왼쪽 사이드바에서 **Secrets and variables** > **Actions** 클릭
3. **New repository secret** 버튼 클릭

### 2. 필수 Secrets 추가

#### REACT_APP_SUPABASE_URL
- **설명**: Supabase 프로젝트 URL
- **형식**: `https://your-project-ref.supabase.co`
- **예시**: `https://hmgxlxnrarciimggycxj.supabase.co`

#### REACT_APP_SUPABASE_ANON_KEY
- **설명**: Supabase Anonymous Key
- **형식**: JWT 토큰 (긴 문자열)
- **예시**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### REACT_APP_GOOGLE_CLIENT_ID
- **설명**: Google OAuth Client ID
- **형식**: `your-client-id.apps.googleusercontent.com`
- **예시**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

### 3. 선택적 Secrets (권장)

#### REACT_APP_EXCHANGE_RATE_API_KEY
- **설명**: 환율 API 키 (선택사항)
- **용도**: 실시간 환율 정보 표시

## 설정 확인 방법

### 1. GitHub Actions 로그 확인
1. **Actions** 탭에서 최신 워크플로우 실행 확인
2. **Validate Environment Variables** 단계에서 성공 메시지 확인:
   ```
   ✅ 모든 필수 환경 변수가 설정되어 있습니다
   ```

### 2. 로컬 테스트
```bash
# 환경 변수 확인
npm run env:check

# 빌드 테스트
npm run build:prod
```

## 문제 해결

### 환경 변수 누락 오류
```
❌ REACT_APP_SUPABASE_URL이 설정되지 않았습니다
GitHub Repository Settings > Secrets and variables > Actions에서 설정하세요
```

**해결 방법**:
1. GitHub Repository Settings > Secrets and variables > Actions 확인
2. 필수 Secrets가 모두 설정되어 있는지 확인
3. Secret 이름이 정확한지 확인 (대소문자 구분)

### 빌드 실패
```
❌ REACT_APP_SUPABASE_ANON_KEY이 유효하지 않습니다 (너무 짧음)
```

**해결 방법**:
1. Supabase 프로젝트 설정에서 올바른 anon key 복사
2. GitHub Secrets에서 키 값 업데이트

### 배포 후 기능 오류
**확인 사항**:
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. Google OAuth 설정이 올바른지 확인
3. 도메인 설정이 올바른지 확인

## 워크플로우 파일 구조

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    steps:
      - Validate Environment Variables  # 환경 변수 검증
      - Install dependencies           # 의존성 설치
      - Build                         # 프로덕션 빌드
      - Upload artifact               # 빌드 결과 업로드

  deploy:
    needs: build
    steps:
      - Deploy to GitHub Pages        # GitHub Pages 배포
```

## 자동 배포 트리거

- **main/master 브랜치에 push**: 자동 배포
- **Pull Request**: 빌드 테스트만 실행 (배포 안함)
- **다른 브랜치**: 워크플로우 실행 안함

## 배포 URL

배포가 완료되면 다음 URL에서 접근 가능:
- **프로덕션**: https://travel.moonwave.kr
- **GitHub Pages**: https://[username].github.io/[repository-name]

## 모니터링

### GitHub Actions 대시보드
- **Actions** 탭에서 워크플로우 실행 상태 확인
- 실패 시 로그를 통해 문제 진단

### 배포 상태 확인
- **Settings** > **Pages**에서 배포 상태 확인
- 최근 배포 시간과 상태 표시

## 보안 고려사항

1. **Secrets 보안**: GitHub Secrets는 암호화되어 저장됩니다
2. **환경 변수 노출 방지**: 빌드 로그에서 민감한 정보가 노출되지 않도록 주의
3. **정기적인 키 순환**: 보안을 위해 API 키를 정기적으로 갱신

## 추가 설정

### 커스텀 도메인 설정
1. **Settings** > **Pages**에서 **Custom domain** 설정
2. DNS 설정에서 CNAME 레코드 추가
3. SSL 인증서 자동 발급 대기

### 브랜치 보호 규칙
1. **Settings** > **Branches**에서 main 브랜치 보호 규칙 설정
2. PR 리뷰 필수 설정
3. 상태 검사 통과 필수 설정