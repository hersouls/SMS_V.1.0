-- =====================================================
-- 개선된 Supabase 구독 관리 DB 스키마 사용 예시
-- =====================================================

-- 1. 사용자별 활성 서비스 목록 조회 (개선된 인덱스 활용)
SELECT 
    s.name,
    s.description,
    s.price,
    s.currency,
    s.billing_cycle,
    s.next_billing_date,
    s.is_custom,
    s.category
FROM services s
WHERE s.user_id = auth.uid() 
  AND s.is_active = true
ORDER BY s.next_billing_date ASC;

-- 2. 통합 뷰를 활용한 서비스 목록 조회
SELECT 
    service_type,
    name,
    price,
    currency,
    next_billing_date,
    category
FROM unified_services
WHERE user_id = auth.uid() 
  AND is_active = true
ORDER BY next_billing_date;

-- 3. 사용자별 서비스 요약 정보 (새로운 뷰 활용)
SELECT 
    email,
    name,
    currency_preference,
    total_services,
    active_services,
    total_monthly_cost,
    next_billing_date
FROM user_service_summary
WHERE user_id = auth.uid();

-- 4. 다가오는 결제일 서비스 조회 (복합 인덱스 활용)
SELECT 
    name,
    price,
    currency,
    next_billing_date,
    DATEDIFF('day', CURRENT_DATE, next_billing_date) as days_until_billing
FROM services
WHERE user_id = auth.uid() 
  AND is_active = true
  AND next_billing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY next_billing_date;

-- 5. 통화 변환 함수 활용 예시
SELECT 
    s.name,
    s.price as original_price,
    s.currency as original_currency,
    convert_currency(s.price, s.currency, p.currency_preference) as converted_price,
    p.currency_preference as user_currency
FROM services s
JOIN profiles p ON s.user_id = p.id
WHERE s.user_id = auth.uid() 
  AND s.is_active = true;

-- 6. 카테고리별 서비스 통계
SELECT 
    category,
    COUNT(*) as service_count,
    SUM(price) as total_price,
    AVG(price) as avg_price
FROM services
WHERE user_id = auth.uid() 
  AND is_active = true
GROUP BY category
ORDER BY total_price DESC;

-- 7. 알림 설정이 있는 서비스 조회
SELECT 
    s.name,
    s.next_billing_date,
    ns.notification_type,
    ns.alarm_type,
    ns.is_enabled
FROM services s
LEFT JOIN notification_settings ns ON s.id = ns.service_id
WHERE s.user_id = auth.uid() 
  AND s.is_active = true
  AND ns.is_enabled = true
ORDER BY s.next_billing_date;

-- 8. 결제 내역 조회 (새로운 테이블 활용)
SELECT 
    s.name as service_name,
    ph.amount,
    ph.currency,
    ph.payment_date,
    ph.payment_method,
    ph.status
FROM payment_history ph
JOIN services s ON ph.service_id = s.id
WHERE ph.user_id = auth.uid()
ORDER BY ph.payment_date DESC
LIMIT 10;

-- 9. 감사 로그 조회 (새로운 감사 시스템 활용)
SELECT 
    table_name,
    operation,
    changed_at,
    before_data,
    after_data
FROM audit_logs
WHERE changed_by = auth.uid()
  AND table_name = 'services'
ORDER BY changed_at DESC
LIMIT 20;

-- 10. 다음 결제일 계산 함수 활용
SELECT 
    name,
    next_billing_date,
    calculate_next_billing_date(next_billing_date, billing_cycle) as next_billing_after_current
FROM services
WHERE user_id = auth.uid() 
  AND is_active = true;

-- 11. 커스텀 서비스와 구독 서비스 분리 조회
SELECT 
    CASE 
        WHEN is_custom THEN '커스텀 서비스'
        ELSE '구독 서비스'
    END as service_type,
    name,
    price,
    currency,
    next_billing_date
FROM services
WHERE user_id = auth.uid() 
  AND is_active = true
ORDER BY is_custom, next_billing_date;

-- 12. 월별 결제 예상 금액 계산
SELECT 
    DATE_TRUNC('month', next_billing_date) as billing_month,
    SUM(price) as total_amount,
    currency
FROM services
WHERE user_id = auth.uid() 
  AND is_active = true
  AND next_billing_date >= CURRENT_DATE
GROUP BY DATE_TRUNC('month', next_billing_date), currency
ORDER BY billing_month;

-- 13. 태그별 서비스 그룹화
SELECT 
    unnest(tags) as tag,
    COUNT(*) as service_count,
    SUM(price) as total_price
FROM services
WHERE user_id = auth.uid() 
  AND is_active = true
  AND tags IS NOT NULL
GROUP BY unnest(tags)
ORDER BY service_count DESC;

-- 14. 환율 정보 조회 (개선된 ENUM 활용)
SELECT 
    base_currency,
    target_currency,
    rate,
    effective_date
FROM exchange_rates
WHERE base_currency = 'USD' 
  AND target_currency IN ('KRW', 'EUR', 'JPY')
  AND effective_date = (
    SELECT MAX(effective_date) 
    FROM exchange_rates 
    WHERE base_currency = 'USD'
  );

-- 15. 서비스 추가 예시 (통합 테이블 활용)
INSERT INTO services (
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
    tags
) VALUES (
    auth.uid(),
    'Netflix Premium',
    '스트리밍 서비스',
    17000.00,
    '₩17,000',
    'KRW',
    'monthly',
    CURRENT_DATE + INTERVAL '1 month',
    FALSE,
    'https://netflix.com',
    'Entertainment',
    ARRAY['streaming', 'entertainment', 'video']
);

-- 16. 알림 설정 추가 예시
INSERT INTO notification_settings (
    user_id,
    service_id,
    notification_type,
    alarm_type,
    is_enabled
) VALUES (
    auth.uid(),
    (SELECT id FROM services WHERE name = 'Netflix Premium' AND user_id = auth.uid()),
    'EMAIL',
    'BEFORE_3_DAYS',
    TRUE
);

-- 17. 결제 내역 추가 예시
INSERT INTO payment_history (
    user_id,
    service_id,
    amount,
    currency,
    payment_date,
    payment_method,
    status
) VALUES (
    auth.uid(),
    (SELECT id FROM services WHERE name = 'Netflix Premium' AND user_id = auth.uid()),
    17000.00,
    'KRW',
    CURRENT_DATE,
    'credit_card',
    'completed'
);

-- 18. 사용자 프로필 업데이트 예시
UPDATE profiles 
SET 
    name = '홍길동',
    phone = '010-1234-5678',
    currency_preference = 'KRW',
    timezone = 'Asia/Seoul'
WHERE id = auth.uid();

-- 19. 서비스 비활성화 예시
UPDATE services 
SET is_active = false, updated_at = NOW()
WHERE id = 'service-uuid-here' 
  AND user_id = auth.uid();

-- 20. 복잡한 통계 쿼리 (개선된 스키마 활용)
WITH monthly_costs AS (
    SELECT 
        DATE_TRUNC('month', next_billing_date) as month,
        SUM(CASE WHEN currency = 'KRW' THEN price ELSE convert_currency(price, currency, 'KRW') END) as total_krw
    FROM services s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.user_id = auth.uid() 
      AND s.is_active = true
    GROUP BY DATE_TRUNC('month', next_billing_date)
)
SELECT 
    month,
    total_krw,
    LAG(total_krw) OVER (ORDER BY month) as prev_month_total,
    total_krw - LAG(total_krw) OVER (ORDER BY month) as change_amount
FROM monthly_costs
ORDER BY month;