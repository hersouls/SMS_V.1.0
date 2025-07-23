# 구독 추가 문제 해결 가이드

## 문제: "구독을 추가하고 있습니다..." 이후 반응이 없음

### 개선된 기능들

1. **상세한 로깅**: 모든 단계에서 콘솔 로그를 출력하여 문제 진단 가능
2. **진행 상황 표시**: 현재 진행 중인 작업을 사용자에게 표시
3. **타임아웃 처리**: 30초 후 자동으로 타임아웃 처리
4. **재시도 로직**: Supabase 연결 실패 시 최대 2회 재시도
5. **네트워크 상태 확인**: 오프라인 상태 감지
6. **사용자 친화적 에러 메시지**: 기술적 에러를 이해하기 쉬운 메시지로 변환
7. **수동 취소 기능**: 로딩 중 사용자가 취소할 수 있는 버튼 제공

### 디버깅 방법

#### 1. 개발자 도구에서 상태 확인
```javascript
// 현재 상태 확인
window.debugSubscriptionApp.getState()

// 수동으로 로딩 상태 리셋
window.debugSubscriptionApp.resetAddingState()

// Supabase 연결 테스트
window.debugSubscriptionApp.testConnection()

// 네트워크 상태 확인
window.debugSubscriptionApp.checkNetwork()
```

#### 2. 콘솔 로그 확인
브라우저 개발자 도구의 Console 탭에서 다음 로그들을 확인하세요:

- `구독 추가 시작:` - 구독 추가 프로세스 시작
- `Supabase 연결 테스트 시작...` - 데이터베이스 연결 테스트
- `삽입할 데이터:` - 데이터베이스에 삽입할 데이터
- `구독 추가 성공:` - 성공 시 반환된 데이터
- `구독 추가 프로세스 완료` - 전체 프로세스 완료

#### 3. 네트워크 탭 확인
Network 탭에서 Supabase API 호출이 성공적으로 완료되는지 확인하세요.

### 일반적인 문제와 해결책

#### 1. 네트워크 연결 문제
- **증상**: 타임아웃 발생
- **해결책**: 인터넷 연결 확인 후 재시도

#### 2. Supabase 인증 문제
- **증상**: "사용자 정보가 올바르지 않습니다" 에러
- **해결책**: 로그아웃 후 다시 로그인

#### 3. 데이터베이스 권한 문제
- **증상**: "foreign key" 에러
- **해결책**: 관리자에게 문의

#### 4. 중복 데이터 문제
- **증상**: "이미 동일한 구독이 존재합니다" 에러
- **해결책**: 다른 이름으로 구독 추가

### 문제가 지속되는 경우

1. 브라우저 캐시 및 쿠키 삭제
2. 다른 브라우저에서 테스트
3. 개발자 도구의 콘솔 로그를 확인하여 구체적인 에러 메시지 확인
4. 네트워크 탭에서 API 호출 상태 확인

## 이메일 인증 문제 해결

### 문제: 이메일 인증 메일을 받지 못함

#### 1. 기본 확인사항
- 스팸 폴더 확인
- 이메일 주소 오타 확인
- Supabase 프로젝트 설정 확인

#### 2. Supabase 설정 확인
1. **Supabase Dashboard > Authentication > Settings > Auth Providers**
   - Email provider가 활성화되어 있는지 확인
   - "Confirm email" 옵션이 활성화되어 있는지 확인

2. **Supabase Dashboard > Authentication > Email Templates**
   - Confirm signup 템플릿이 올바르게 설정되어 있는지 확인
   - 이메일 제목과 내용이 한글로 적절히 설정되어 있는지 확인

#### 3. 환경 변수 확인
```bash
# .env.local 파일에 다음 설정이 있는지 확인
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4. 디버깅 방법
브라우저 개발자 도구의 Console 탭에서 다음 로그들을 확인하세요:
- `Sending verification email to:` - 이메일 전송 시도
- `Sign up response:` - 회원가입 응답
- `Email verification required` - 이메일 인증 필요 상태
- `User automatically signed in` - 자동 로그인 상태

#### 5. 수동 인증 상태 확인
회원가입 화면에서 "인증 상태 확인하기" 버튼을 클릭하여 현재 인증 상태를 확인할 수 있습니다.

### 문제: "invalid login credentials" 오류

#### 1. 일반적인 원인
- 이메일 주소 오타
- 비밀번호 오타
- 이메일 인증 미완료
- 계정이 존재하지 않음

#### 2. 해결 방법
1. **이메일 인증 확인**: 회원가입 후 이메일 인증이 완료되었는지 확인
2. **비밀번호 재설정**: Supabase Dashboard에서 사용자 비밀번호 재설정
3. **계정 재생성**: 기존 계정 삭제 후 새로 회원가입

#### 3. 디버깅 방법
브라우저 개발자 도구의 Console 탭에서 다음 로그들을 확인하세요:
- `Login attempt for email:` - 로그인 시도
- `Sign in error:` - 로그인 오류 상세 정보

### 추가 지원

문제가 해결되지 않는 경우, 다음 정보와 함께 문의해주세요:
- 브라우저 종류 및 버전
- 콘솔 로그 내용
- 네트워크 탭의 에러 정보
- `window.debugSubscriptionApp.getState()` 결과
- 이메일 인증 관련 오류 메시지