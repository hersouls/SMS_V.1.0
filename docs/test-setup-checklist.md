# 🧪 Google 로그인 테스트 체크리스트

## ✅ 완료된 항목들

### 코드 구현
- [x] SupabaseContext.tsx - 프로필 자동 생성 로직
- [x] LoginScreen.tsx - Google OAuth 개선
- [x] App.tsx - 프로필 동기화 로직
- [x] 디버깅 로그 추가
- [x] TypeScript 컴파일 검증
- [x] 개발 서버 정상 동작 확인

### 데이터베이스 설정
- [x] 스키마 파일 준비 (supabase-schema.sql)
- [x] 프로필 자동 생성 트리거
- [x] RLS 정책 설정
- [x] 타입 정의 완료

## 🔧 설정이 필요한 항목들

### 1. Google Cloud Console 설정
- [ ] Google Cloud 프로젝트 생성
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] 승인된 리디렉션 URI 추가
- [ ] OAuth 동의 화면 설정

### 2. Supabase Dashboard 설정
- [ ] Google Provider 활성화
- [ ] Client ID, Secret 입력
- [ ] Site URL 및 Redirect URLs 설정
- [ ] 스키마 실행

### 3. 환경 변수 설정
- [ ] .env 파일 생성
- [ ] REACT_APP_SUPABASE_URL 설정
- [ ] REACT_APP_SUPABASE_ANON_KEY 설정

## 🧪 테스트 시나리오

### 신규 Google 사용자 테스트
1. [ ] Google 로그인 버튼 클릭
2. [ ] Google 계정 선택/로그인
3. [ ] 앱으로 리다이렉트 확인
4. [ ] 프로필 자동 생성 확인
5. [ ] 브라우저 Console 로그 확인

**예상 로그 순서:**
```
Auth state changed: SIGNED_IN
User logged in, fetching profile...
Profile not found, creating new profile...
Creating profile with data: { id, email, first_name, last_name, photo_url }
Profile created successfully: [profile object]
```

### 기존 Google 사용자 테스트
1. [ ] 이미 프로필이 있는 사용자로 로그인
2. [ ] 기존 프로필 로드 확인
3. [ ] 프로필 정보 업데이트 확인

**예상 로그 순서:**
```
Auth state changed: SIGNED_IN
User logged in, fetching profile...
[기존 프로필 데이터 로드]
```

### 에러 상황 테스트
1. [ ] 네트워크 오류 시 처리
2. [ ] Supabase 연결 오류 시 처리
3. [ ] Google OAuth 실패 시 처리

## 🔍 디버깅 명령어

### 브라우저 Console에서 실행 가능한 명령어:
```javascript
// 현재 프로필 상태 확인
window.supabaseContext?.checkProfileStatus()

// 현재 세션 확인
window.supabase?.auth.getSession()

// 수동 프로필 조회
window.supabase?.from('profiles').select('*').eq('id', 'user_id')
```

## ✨ 성공 기준

### 완전 성공 조건:
- [x] 코드 컴파일 오류 없음
- [x] 개발 서버 정상 실행
- [ ] Google 로그인 성공
- [ ] 프로필 자동 생성
- [ ] 데이터 Supabase 저장 확인
- [ ] 구독 데이터 정상 조회

### 부분 성공 조건:
- [ ] Google OAuth 리다이렉트 성공
- [ ] 수동 프로필 생성 필요
- [ ] 일부 디버깅 필요

## 📝 테스트 완료 후 확인사항

1. **Supabase Dashboard** > **Authentication** > **Users**
   - 새 사용자가 생성되었는지 확인

2. **Supabase Dashboard** > **Table Editor** > **profiles**
   - 프로필이 자동으로 생성되었는지 확인

3. **브라우저 Application 탭** > **Local Storage**
   - supabase.auth.token이 저장되어 있는지 확인

---

**현재 상태: 코드 구현 완료, 설정 대기 중**