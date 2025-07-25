# 🚨 데이터베이스 스키마 불일치 문제 해결 가이드

## 🔴 문제 상황

기존 앱 코드는 `subscriptions` 테이블을 참조하지만, 개선된 스키마에서는 `services` 테이블을 사용하여 불일치가 발생했습니다.

### 현재 문제점:
- ❌ 코드에서는 `subscriptions` 테이블 참조
- ❌ 개선된 스키마에서는 `services` 테이블 사용
- ❌ 테이블명과 필드명 매핑 오류
- ❌ `subscriptions` vs `services` 테이블 혼용

## ✅ 해결 방안

### 1단계: 호환성 레이어 생성

`database_schema_compatibility_fix.sql` 파일을 실행하여 다음을 생성:

#### 📋 생성되는 구성요소:

1. **뷰 (Views)**
   - `public.subscriptions` - 기존 앱 코드 호환용
   - `public.custom_services` - 커스텀 서비스 호환용

2. **함수 (Functions)**
   - `insert_subscription()` - 안전한 구독 삽입
   - `migrate_existing_subscriptions()` - 기존 데이터 마이그레이션
   - `verify_schema_compatibility()` - 호환성 검증

3. **트리거 (Triggers)**
   - INSERT/UPDATE/DELETE 트리거로 뷰를 통한 CRUD 작업 지원

### 2단계: 실행 순서

```sql
-- 1. 호환성 레이어 생성
\i database_schema_compatibility_fix.sql

-- 2. 기존 데이터 마이그레이션 (있는 경우)
SELECT migrate_existing_subscriptions();

-- 3. 호환성 검증
SELECT * FROM verify_schema_compatibility();

-- 4. 테스트 데이터 삽입
SELECT insert_subscription(
    auth.uid(), 'Netflix', 17.99, 'USD', 
    CURRENT_DATE + INTERVAL '1 month'
);
```

## 🔧 기술적 세부사항

### 뷰 매핑 구조

#### `public.subscriptions` 뷰:
```sql
CREATE OR REPLACE VIEW public.subscriptions AS
SELECT 
    id,
    user_id,
    name,
    price,
    price_label,
    currency,
    next_billing_date as renew_date,  -- 필드명 매핑
    created_at as start_date,
    extract(day from next_billing_date) as payment_date,
    service_url as url,
    category,
    is_active,
    description,
    tags,
    created_at,
    updated_at
FROM public.services 
WHERE is_custom = false;
```

#### `public.custom_services` 뷰:
```sql
CREATE OR REPLACE VIEW public.custom_services AS
SELECT 
    id,
    user_id,
    name,
    price,
    price_label,
    currency,
    next_billing_date as renew_date,
    created_at as start_date,
    extract(day from next_billing_date) as payment_date,
    service_url as url,
    category,
    is_active,
    description,
    tags,
    created_at,
    updated_at
FROM public.services 
WHERE is_custom = true;
```

### 트리거 시스템

#### INSERT 트리거:
- 기존 `INSERT INTO subscriptions` 구문이 `services` 테이블에 삽입되도록 변환
- 필드명 자동 매핑 (`renew_date` → `next_billing_date`)
- 가격 라벨 자동 생성 (₩, $ 등)

#### UPDATE 트리거:
- 기존 `UPDATE subscriptions` 구문이 `services` 테이블을 업데이트하도록 변환
- 타임스탬프 자동 업데이트

#### DELETE 트리거:
- 기존 `DELETE FROM subscriptions` 구문이 `services` 테이블에서 삭제하도록 변환

## 🧪 테스트 방법

### 1. 기본 기능 테스트

```sql
-- 구독 추가 테스트
SELECT insert_subscription(
    auth.uid(), 
    'Netflix', 
    17.99, 
    'USD', 
    CURRENT_DATE + INTERVAL '1 month'
);

-- 뷰를 통한 조회 테스트
SELECT * FROM public.subscriptions WHERE user_id = auth.uid();

-- 직접 INSERT 테스트 (트리거 작동 확인)
INSERT INTO public.subscriptions (
    user_id, name, price, currency, renew_date
) VALUES (
    auth.uid(), 'Spotify', 9.99, 'USD', CURRENT_DATE + INTERVAL '1 month'
);
```

### 2. 호환성 검증

```sql
-- 모든 구성요소 확인
SELECT * FROM verify_schema_compatibility();

-- 예상 결과:
-- Services table exists | PASS | Services table is available
-- Subscriptions view exists | PASS | Subscriptions view is available
-- Custom services view exists | PASS | Custom services view is available
-- Subscriptions insert trigger | PASS | Insert trigger is available
-- Insert subscription function | PASS | Function is available
```

## 🔄 마이그레이션 프로세스

### 기존 데이터가 있는 경우:

1. **백업 생성**
   ```sql
   CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;
   CREATE TABLE custom_services_backup AS SELECT * FROM custom_services;
   ```

2. **마이그레이션 실행**
   ```sql
   SELECT migrate_existing_subscriptions();
   ```

3. **데이터 검증**
   ```sql
   -- 원본 데이터 수 확인
   SELECT COUNT(*) FROM subscriptions_backup;
   SELECT COUNT(*) FROM custom_services_backup;
   
   -- 마이그레이션된 데이터 수 확인
   SELECT COUNT(*) FROM services WHERE is_custom = false;
   SELECT COUNT(*) FROM services WHERE is_custom = true;
   ```

## 🚀 장기적 개선 계획

### Phase 1: 호환성 유지 (현재)
- ✅ 뷰와 트리거로 기존 코드 호환성 확보
- ✅ 기존 데이터 마이그레이션
- ✅ 검증 시스템 구축

### Phase 2: 점진적 마이그레이션 (향후)
- 🔄 앱 코드를 `services` 테이블 직접 사용으로 변경
- 🔄 뷰와 트리거 제거
- 🔄 성능 최적화

### Phase 3: 최적화 (최종)
- 🔄 통합된 `services` 테이블 활용
- 🔄 향상된 기능 구현
- 🔄 성능 최적화

## ⚠️ 주의사항

1. **백업 필수**: 마이그레이션 전 반드시 데이터 백업
2. **테스트 환경**: 프로덕션 적용 전 테스트 환경에서 검증
3. **롤백 계획**: 문제 발생 시 빠른 롤백 방안 준비
4. **모니터링**: 마이그레이션 후 성능 및 오류 모니터링

## 📞 문제 해결

### 일반적인 문제들:

1. **트리거 오류**
   ```sql
   -- 트리거 재생성
   DROP TRIGGER IF EXISTS subscriptions_insert_instead_of ON public.subscriptions;
   CREATE TRIGGER subscriptions_insert_instead_of
       INSTEAD OF INSERT ON public.subscriptions
       FOR EACH ROW EXECUTE FUNCTION subscriptions_insert_trigger();
   ```

2. **권한 문제**
   ```sql
   -- 뷰 권한 설정
   GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
   GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_services TO authenticated;
   ```

3. **타입 오류**
   ```sql
   -- ENUM 타입 확인
   SELECT unnest(enum_range(NULL::subscription_currency));
   ```

## 🎯 성공 지표

- ✅ 기존 앱 코드가 변경 없이 작동
- ✅ 모든 CRUD 작업이 정상 수행
- ✅ 데이터 무결성 유지
- ✅ 성능 저하 없음
- ✅ 마이그레이션 완료

---

**📝 참고**: 이 가이드는 데이터베이스 스키마 불일치 문제를 해결하기 위한 포괄적인 솔루션을 제공합니다. 각 단계를 신중하게 실행하고, 문제 발생 시 즉시 롤백할 수 있도록 준비하세요.