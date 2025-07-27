# Environment Variables Guide
# 환경변수 설정 가이드

이 문서는 프로젝트의 환경변수 설정과 관리에 대한 가이드입니다.

## 📁 파일 구조

```
.
├── .env                    # 메인 환경변수 파일 (실제 값)
├── .env.example           # 환경변수 템플릿 파일
└── src/config/env.ts      # 환경변수 설정 및 검증
```

## 🔧 환경변수 분류

### 1. Environment Settings (환경 설정)
| 변수명 | 설명 | 예시 | 필수여부 |
|--------|------|------|----------|
| `REACT_APP_ENV` | 앱 환경 설정 | `development`, `production` | 선택 |

### 2. Supabase Configuration (Supabase 설정)
| 변수명 | 설명 | 예시 | 필수여부 |
|--------|------|------|----------|
| `REACT_APP_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` | **필수** |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhbGciOi...` | **필수** |
| `REACT_APP_SUPABASE_AUTH_REDIRECT_URL` | 인증 후 리디렉트 URL | `https://domain.com/#/auth/callback` | 선택 |

### 3. Google OAuth Configuration (Google OAuth 설정)
| 변수명 | 설명 | 예시 | 필수여부 |
|--------|------|------|----------|
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` | **필수** |
| `REACT_APP_GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` | 선택 |

### 4. Site Configuration (사이트 설정)
| 변수명 | 설명 | 예시 | 필수여부 |
|--------|------|------|----------|
| `REACT_APP_SITE_URL` | 사이트 기본 URL | `https://subscription.moonwave.kr` | 선택 |
| `REACT_APP_APP_NAME` | 앱 이름 | `구독관리` | 선택 |

### 5. External API Keys (외부 API 키)
| 변수명 | 설명 | 예시 | 필수여부 |
|--------|------|------|----------|
| `REACT_APP_EXCHANGE_RATE_API_KEY` | 환율 API 키 | `your_api_key` | 선택 |

## 🚀 설정 방법

### 1. 새 프로젝트 설정
```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 실제 값 입력
nano .env
```

### 2. 필수 환경변수 설정
다음 필수 환경변수들을 반드시 설정해야 합니다:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## ✅ 검증 및 확인

### 자동 검증
프로젝트에는 환경변수 자동 검증 기능이 내장되어 있습니다:

- **필수 변수 누락 검사**: 필수 환경변수가 누락된 경우 오류 발생
- **형식 검증**: URL, API 키 등의 올바른 형식 확인
- **보안 검증**: 프로덕션 환경에서 HTTPS 강제

### 수동 확인
```bash
# 환경변수 확인 스크립트 실행
npm run env:check
```

## 🔒 보안 고려사항

### 1. 민감정보 관리
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env*` 패턴이 포함되어 있는지 확인하세요
- Google Client Secret 등 민감한 정보는 서버 환경에서만 사용하세요

### 2. 프로덕션 환경
- 프로덕션에서는 반드시 HTTPS URL을 사용하세요
- 환경변수는 호스팅 플랫폼의 환경변수 설정을 통해 관리하세요

## 🐛 문제 해결

### 일반적인 오류와 해결방법

#### 1. "필수 환경변수가 누락되었습니다"
```bash
❌ 필수 환경변수가 누락되었습니다: REACT_APP_SUPABASE_URL
```
**해결방법**: `.env` 파일에 해당 환경변수를 추가하세요.

#### 2. "유효한 HTTPS URL이어야 합니다"
```bash
❌ REACT_APP_SUPABASE_URL은 유효한 HTTPS URL이어야 합니다
```
**해결방법**: URL이 `https://`로 시작하는지 확인하세요.

#### 3. "Google OAuth Client ID 형식이 아닙니다"
```bash
❌ REACT_APP_GOOGLE_CLIENT_ID이 유효한 Google OAuth Client ID 형식이 아닙니다
```
**해결방법**: Client ID가 `.apps.googleusercontent.com`으로 끝나는지 확인하세요.

## 📝 환경변수 업데이트 절차

1. **개발 환경 업데이트**
   ```bash
   # .env 파일 수정
   nano .env
   
   # 앱 재시작
   npm start
   ```

2. **템플릿 파일 업데이트**
   ```bash
   # 새로운 환경변수 추가 시 .env.example도 업데이트
   nano .env.example
   ```

3. **TypeScript 설정 업데이트**
   ```bash
   # src/config/env.ts에 새 변수 추가
   nano src/config/env.ts
   ```

## 📋 체크리스트

### 새 환경변수 추가 시
- [ ] `.env.example`에 템플릿 추가
- [ ] `src/config/env.ts`에 변수 정의 추가
- [ ] 필수/선택 여부 분류
- [ ] 검증 로직 추가 (필요한 경우)
- [ ] 문서 업데이트

### 배포 전 확인사항
- [ ] 모든 필수 환경변수 설정 완료
- [ ] 프로덕션 URL이 HTTPS인지 확인
- [ ] Google OAuth 설정이 올바른지 확인
- [ ] Supabase 설정이 올바른지 확인

---

**문의사항이나 문제가 있을 경우 개발팀에 연락하세요.**