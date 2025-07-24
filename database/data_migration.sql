-- =====================================================
-- 데이터 마이그레이션 스크립트
-- 기존 데이터를 새로운 스키마로 변환
-- =====================================================

-- Step 1: 프로필 데이터 마이그레이션
-- =====================================================

INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    avatar_url,
    timezone,
    currency_preference,
    created_at,
    updated_at
)
SELECT 
    p.id,
    COALESCE(p.email, u.email) as email,
    COALESCE(p.first_name || ' ' || p.last_name, p.username, u.email) as name,
    NULL as phone, -- 기존 스키마에 phone 필드 없음
    p.photo_url as avatar_url,
    'Asia/Seoul' as timezone,
    'KRW' as currency_preference,
    p.created_at,
    p.updated_at
FROM profiles_backup p
LEFT JOIN auth.users u ON p.id = u.id
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- Step 2: 구독 서비스 데이터 마이그레이션
-- =====================================================

INSERT INTO public.services (
    user_id,
    name,
    description,
    price,
    price_label,
    currency,
    billing_cycle,
    next_billing_date,
    is_custom,
    service_url,
    category,
    tags,
    is_active,
    created_at,
    updated_at
)
SELECT 
    s.user_id,
    s.name,
    NULL as description, -- 기존 스키마에 description 필드 없음
    s.price as price,
    CASE 
        WHEN s.currency = 'KRW' THEN '₩' || s.price::TEXT
        WHEN s.currency = 'USD' THEN '$' || s.price::TEXT
        WHEN s.currency = 'EUR' THEN '€' || s.price::TEXT
        WHEN s.currency = 'JPY' THEN '¥' || s.price::TEXT
        ELSE s.price::TEXT
    END as price_label,
    s.currency,
    'monthly' as billing_cycle, -- 기본값으로 설정 (기존 스키마에 billing_cycle 없음)
    s.renew_date as next_billing_date,
    FALSE as is_custom,
    s.url as service_url,
    s.category,
    NULL as tags, -- 기존 스키마에 tags 필드 없음
    s.is_active,
    s.created_at,
    s.updated_at
FROM subscriptions_backup s
WHERE s.user_id IN (SELECT id FROM public.profiles);

-- Step 3: 커스텀 서비스 데이터 마이그레이션
-- =====================================================

INSERT INTO public.services (
    user_id,
    name,
    description,
    price,
    price_label,
    currency,
    billing_cycle,
    next_billing_date,
    is_custom,
    service_url,
    category,
    tags,
    is_active,
    created_at,
    updated_at
)
SELECT 
    cs.user_id,
    cs.name,
    NULL as description,
    CASE 
        WHEN cs.price ~ '^[0-9]+\.?[0-9]*$' THEN cs.price::DECIMAL(10,2)
        ELSE 0.00
    END as price,
    cs.price as price_label, -- 기존 TEXT 값을 그대로 표시용으로 사용
    cs.currency,
    'monthly' as billing_cycle, -- 기본값으로 설정
    cs.renewal_date as next_billing_date,
    TRUE as is_custom,
    cs.url as service_url,
    cs.category,
    NULL as tags,
    TRUE as is_active, -- 기본값으로 활성 상태
    cs.created_at,
    cs.updated_at
FROM custom_services_backup cs
WHERE cs.user_id IN (SELECT id FROM public.profiles);

-- Step 4: 환율 데이터 마이그레이션
-- =====================================================

INSERT INTO public.exchange_rates (
    base_currency,
    target_currency,
    rate,
    effective_date,
    source,
    created_at
)
SELECT 
    er.base_currency::subscription_currency,
    er.target_currency::subscription_currency,
    er.rate,
    er.date as effective_date,
    'migration' as source,
    er.created_at
FROM exchange_rates_backup er
WHERE er.base_currency IN ('KRW', 'USD', 'EUR', 'JPY')
  AND er.target_currency IN ('KRW', 'USD', 'EUR', 'JPY')
ON CONFLICT (base_currency, target_currency, effective_date) DO NOTHING;

-- Step 5: 알림 설정 데이터 마이그레이션 (기존 notifications → notification_settings)
-- =====================================================

-- 기존 notifications 테이블의 데이터를 새로운 notification_settings로 변환
-- 기존 스키마와 새 스키마의 구조가 다르므로 기본 설정으로 생성

INSERT INTO public.notification_settings (
    user_id,
    service_id,
    notification_type,
    alarm_type,
    is_enabled,
    created_at,
    updated_at
)
SELECT DISTINCT
    s.user_id,
    s.id as service_id,
    'EMAIL' as notification_type,
    'BEFORE_3_DAYS' as alarm_type,
    TRUE as is_enabled,
    NOW() as created_at,
    NOW() as updated_at
FROM public.services s
WHERE s.user_id IN (SELECT id FROM public.profiles)
  AND s.is_active = true;

-- Step 6: 샘플 결제 내역 데이터 생성 (기존 데이터 기반)
-- =====================================================

INSERT INTO public.payment_history (
    user_id,
    service_id,
    amount,
    currency,
    payment_date,
    payment_method,
    status,
    notes,
    created_at
)
SELECT 
    s.user_id,
    s.id as service_id,
    s.price as amount,
    s.currency,
    s.next_billing_date - INTERVAL '1 month' as payment_date,
    'credit_card' as payment_method,
    'completed' as status,
    '마이그레이션으로 생성된 샘플 결제 내역' as notes,
    s.created_at
FROM public.services s
WHERE s.user_id IN (SELECT id FROM public.profiles)
  AND s.is_active = true
  AND s.next_billing_date > CURRENT_DATE - INTERVAL '6 months';

-- Step 7: 마이그레이션 결과 확인
-- =====================================================

-- 7.1 마이그레이션된 데이터 수 확인
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

-- 7.2 서비스 타입별 분포 확인
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

-- 7.3 통화별 분포 확인
SELECT 
    currency,
    COUNT(*) as service_count,
    SUM(price) as total_price
FROM public.services
WHERE is_active = true
GROUP BY currency
ORDER BY total_price DESC;

-- 7.4 카테고리별 분포 확인
SELECT 
    COALESCE(category, '미분류') as category,
    COUNT(*) as service_count,
    SUM(price) as total_price
FROM public.services
WHERE is_active = true
GROUP BY category
ORDER BY total_price DESC;

-- Step 8: 데이터 무결성 검증
-- =====================================================

-- 8.1 고아 레코드 확인
SELECT 
    'services without user' as issue,
    COUNT(*) as count
FROM public.services s
LEFT JOIN public.profiles p ON s.user_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
    'notification_settings without user' as issue,
    COUNT(*) as count
FROM public.notification_settings ns
LEFT JOIN public.profiles p ON ns.user_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
    'notification_settings without service' as issue,
    COUNT(*) as count
FROM public.notification_settings ns
LEFT JOIN public.services s ON ns.service_id = s.id
WHERE s.id IS NULL;

-- 8.2 가격 데이터 검증
SELECT 
    'invalid price data' as issue,
    COUNT(*) as count
FROM public.services
WHERE price <= 0 OR price IS NULL;

-- 8.3 날짜 데이터 검증
SELECT 
    'invalid billing date' as issue,
    COUNT(*) as count
FROM public.services
WHERE next_billing_date IS NULL OR next_billing_date < CURRENT_DATE - INTERVAL '1 year';

-- Step 9: 성능 최적화 확인
-- =====================================================

-- 9.1 인덱스 사용 현황 확인
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

-- 9.2 테이블 크기 확인
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'services', 'notification_settings', 'payment_history')
  AND attname IN ('user_id', 'is_active', 'next_billing_date', 'category')
ORDER BY tablename, attname;

-- Step 10: 마이그레이션 완료 후 정리
-- =====================================================

-- 10.1 백업 테이블 삭제 (선택사항 - 데이터 검증 완료 후)
-- DROP TABLE IF EXISTS subscriptions_backup;
-- DROP TABLE IF EXISTS custom_services_backup;
-- DROP TABLE IF EXISTS profiles_backup;
-- DROP TABLE IF EXISTS notifications_backup;
-- DROP TABLE IF EXISTS alarm_history_backup;
-- DROP TABLE IF EXISTS exchange_rates_backup;

-- 10.2 마이그레이션 완료 로그
INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    after_data,
    changed_by,
    changed_at
) VALUES (
    'migration',
    gen_random_uuid(),
    'MIGRATION_COMPLETED',
    '{"migration_date": "' || CURRENT_DATE || '", "status": "completed"}'::jsonb,
    NULL,
    NOW()
);