# Supabase 구독 관리 DB 마이그레이션 가이드

## 📋 개요

이 가이드는 기존 Supabase 구독 관리 DB 스키마를 개선된 스키마로 마이그레이션하는 과정을 단계별로 안내합니다.

## ⚠️ 사전 준비사항

### 1. 백업 확인
- 현재 데이터베이스의 완전한 백업이 있는지 확인
- Supabase Dashboard에서 데이터베이스 백업 다운로드
- 프로덕션 환경에서는 반드시 테스트 환경에서 먼저 실행

### 2. 환경 확인
- Supabase 프로젝트에 대한 관리자 권한
- SQL Editor 접근 권한
- 충분한 저장 공간 (백업 데이터용)

## 🚀 단계별 마이그레이션 실행

### Step 1: 환경 준비 및 검증

```sql
-- 1.1 현재 스키마 상태 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'subscriptions', 'custom_services', 'notifications', 'alarm_history', 'exchange_rates')
ORDER BY table_name, ordinal_position;

-- 1.2 현재 데이터 수 확인
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'subscriptions' as table_name, COUNT(*) as count FROM public.subscriptions
UNION ALL
SELECT 'custom_services' as table_name, COUNT(*) as count FROM public.custom_services
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as count FROM public.notifications
UNION ALL
SELECT 'alarm_history' as table_name, COUNT(*) as count FROM public.alarm_history
UNION ALL
SELECT 'exchange_rates' as table_name, COUNT(*) as count FROM public.exchange_rates;
```

### Step 2: 마이그레이션 계획 실행

**파일**: `migration_plan.sql`

```bash
# Supabase SQL Editor에서 실행
# 또는 psql을 사용하여 실행
psql -h your-project.supabase.co -U postgres -d postgres -f migration_plan.sql
```

**실행 순서**:
1. 기존 데이터 백업
2. 기존 테이블 및 타입 삭제
3. 개선된 스키마 적용
4. 인덱스 구성
5. 트리거 및 함수 생성
6. 통합 뷰 생성
7. RLS 정책 설정
8. 유틸리티 함수 추가

### Step 3: 데이터 마이그레이션 실행

**파일**: `data_migration.sql`

```bash
# Supabase SQL Editor에서 실행
# 또는 psql을 사용하여 실행
psql -h your-project.supabase.co -U postgres -d postgres -f data_migration.sql
```

**실행 순서**:
1. 프로필 데이터 마이그레이션
2. 구독 서비스 데이터 마이그레이션
3. 커스텀 서비스 데이터 마이그레이션
4. 환율 데이터 마이그레이션
5. 알림 설정 데이터 마이그레이션
6. 샘플 결제 내역 데이터 생성
7. 마이그레이션 결과 확인
8. 데이터 무결성 검증

### Step 4: 마이그레이션 검증

```sql
-- 4.1 새 스키마 상태 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'services', 'notification_settings', 'payment_history', 'audit_logs', 'exchange_rates')
ORDER BY table_name, ordinal_position;

-- 4.2 마이그레이션된 데이터 수 확인
SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
    'services' as table_name,
    COUNT(*) as record_count
FROM public.services
UNION ALL
SELECT 
    'notification_settings' as table_name,
    COUNT(*) as record_count
FROM public.notification_settings
UNION ALL
SELECT 
    'exchange_rates' as table_name,
    COUNT(*) as record_count
FROM public.exchange_rates
UNION ALL
SELECT 
    'payment_history' as table_name,
    COUNT(*) as record_count
FROM public.payment_history;

-- 4.3 서비스 통합 확인
SELECT 
    CASE 
        WHEN is_custom THEN '커스텀 서비스'
        ELSE '구독 서비스'
    END as service_type,
    COUNT(*) as count,
    SUM(price) as total_price
FROM public.services
GROUP BY is_custom
ORDER BY is_custom;

-- 4.4 통합 뷰 테스트
SELECT * FROM public.unified_services LIMIT 5;
SELECT * FROM public.user_service_summary LIMIT 5;
```

### Step 5: 애플리케이션 코드 업데이트

#### 5.1 주요 변경사항

**테이블명 변경**:
- `subscriptions` → `services` (is_custom = false)
- `custom_services` → `services` (is_custom = true)

**필드명 변경**:
- `renew_date` → `next_billing_date`
- `price` (TEXT) → `price` (DECIMAL) + `price_label` (TEXT)

**새로운 필드**:
- `billing_cycle`
- `description`
- `tags`
- `is_custom`

#### 5.2 쿼리 업데이트 예시

**기존 쿼리**:
```sql
SELECT * FROM subscriptions WHERE user_id = $1;
SELECT * FROM custom_services WHERE user_id = $1;
```

**새로운 쿼리**:
```sql
-- 모든 서비스 조회
SELECT * FROM services WHERE user_id = $1;

-- 구독 서비스만 조회
SELECT * FROM services WHERE user_id = $1 AND is_custom = false;

-- 커스텀 서비스만 조회
SELECT * FROM services WHERE user_id = $1 AND is_custom = true;

-- 통합 뷰 사용
SELECT * FROM unified_services WHERE user_id = $1;
```

### Step 6: 성능 테스트

```sql
-- 6.1 쿼리 성능 테스트
EXPLAIN ANALYZE
SELECT 
    s.name,
    s.price,
    s.currency,
    s.next_billing_date
FROM services s
WHERE s.user_id = 'user-uuid-here' 
  AND s.is_active = true
ORDER BY s.next_billing_date;

-- 6.2 인덱스 사용 현황 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'services', 'notification_settings', 'payment_history')
ORDER BY idx_scan DESC;

-- 6.3 테이블 크기 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'services', 'notification_settings', 'payment_history', 'audit_logs', 'exchange_rates')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Step 7: 롤백 계획 (필요시)

```sql
-- 7.1 백업 테이블에서 데이터 복원
-- (백업 테이블이 삭제되지 않은 경우)

-- 7.2 기존 스키마로 복원
-- supabase-schema.sql 파일 실행

-- 7.3 데이터 복원
INSERT INTO public.subscriptions SELECT * FROM subscriptions_backup;
INSERT INTO public.custom_services SELECT * FROM custom_services_backup;
INSERT INTO public.profiles SELECT * FROM profiles_backup;
-- ... 기타 테이블들
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. ENUM 타입 충돌
```sql
-- 기존 ENUM 타입이 존재하는 경우
DROP TYPE IF EXISTS subscription_currency CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS alarm_type CASCADE;
```

#### 2. 외래키 제약 조건 오류
```sql
-- 외래키 제약 조건 확인
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public';
```

#### 3. RLS 정책 충돌
```sql
-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- ... 기타 정책들
```

### 성능 최적화 팁

#### 1. 인덱스 최적화
```sql
-- 사용하지 않는 인덱스 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY tablename, indexname;
```

#### 2. 테이블 통계 업데이트
```sql
-- 테이블 통계 업데이트
ANALYZE public.profiles;
ANALYZE public.services;
ANALYZE public.notification_settings;
ANALYZE public.payment_history;
ANALYZE public.audit_logs;
ANALYZE public.exchange_rates;
```

## 📊 마이그레이션 체크리스트

### 사전 준비
- [ ] 데이터베이스 백업 완료
- [ ] 테스트 환경에서 마이그레이션 테스트 완료
- [ ] 애플리케이션 코드 업데이트 준비
- [ ] 팀원들에게 마이그레이션 일정 공지

### 마이그레이션 실행
- [ ] Step 1: 환경 준비 및 검증 완료
- [ ] Step 2: 마이그레이션 계획 실행 완료
- [ ] Step 3: 데이터 마이그레이션 실행 완료
- [ ] Step 4: 마이그레이션 검증 완료
- [ ] Step 5: 애플리케이션 코드 업데이트 완료
- [ ] Step 6: 성능 테스트 완료

### 사후 검증
- [ ] 모든 기능 정상 작동 확인
- [ ] 성능 지표 확인
- [ ] 사용자 피드백 수집
- [ ] 백업 테이블 정리 (선택사항)

## 📞 지원

마이그레이션 과정에서 문제가 발생하면:

1. **로그 확인**: Supabase Dashboard의 Logs 섹션에서 오류 확인
2. **백업 복원**: 문제 발생 시 백업 데이터로 복원
3. **단계별 실행**: 각 단계를 개별적으로 실행하여 문제 지점 파악
4. **문서 참조**: `IMPROVEMENT_SUMMARY.md` 파일에서 개선사항 상세 확인

## 🎯 예상 효과

### 개발 효율성
- 코드 중복 제거로 유지보수성 향상
- 통합된 API로 개발 복잡도 감소
- 일관된 데이터 구조로 버그 발생 가능성 감소

### 성능 향상
- 최적화된 인덱스로 쿼리 성능 향상
- 통합 테이블로 조인 복잡도 감소
- 효율적인 데이터 저장으로 공간 절약

### 확장성
- 새로운 서비스 타입 추가 용이
- 감사 로그로 변경 이력 완전 추적
- 유연한 알림 시스템으로 기능 확장 가능