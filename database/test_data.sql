-- =====================================================
-- 개선된 스키마 테스트용 샘플 데이터
-- =====================================================

-- Step 1: 테스트용 사용자 프로필 데이터
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
) VALUES 
-- 테스트 사용자 1
(
    '550e8400-e29b-41d4-a716-446655440001',
    'test1@example.com',
    '김철수',
    '010-1234-5678',
    'https://example.com/avatar1.jpg',
    'Asia/Seoul',
    'KRW',
    NOW() - INTERVAL '30 days',
    NOW()
),
-- 테스트 사용자 2
(
    '550e8400-e29b-41d4-a716-446655440002',
    'test2@example.com',
    '이영희',
    '010-2345-6789',
    'https://example.com/avatar2.jpg',
    'Asia/Seoul',
    'USD',
    NOW() - INTERVAL '20 days',
    NOW()
),
-- 테스트 사용자 3
(
    '550e8400-e29b-41d4-a716-446655440003',
    'test3@example.com',
    '박민수',
    '010-3456-7890',
    'https://example.com/avatar3.jpg',
    'Asia/Seoul',
    'EUR',
    NOW() - INTERVAL '10 days',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    timezone = EXCLUDED.timezone,
    currency_preference = EXCLUDED.currency_preference,
    updated_at = NOW();

-- Step 2: 테스트용 서비스 데이터 (구독 + 커스텀)
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
) VALUES 
-- 사용자 1의 구독 서비스들
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Netflix Premium',
    '스트리밍 서비스 - 4K 화질, 4개 디바이스',
    17000.00,
    '₩17,000',
    'KRW',
    'monthly',
    CURRENT_DATE + INTERVAL '15 days',
    FALSE,
    'https://netflix.com',
    'Entertainment',
    ARRAY['streaming', 'entertainment', 'video'],
    TRUE,
    NOW() - INTERVAL '60 days',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Spotify Premium',
    '음악 스트리밍 서비스 - 광고 없는 음악',
    13900.00,
    '₩13,900',
    'KRW',
    'monthly',
    CURRENT_DATE + INTERVAL '8 days',
    FALSE,
    'https://spotify.com',
    'Entertainment',
    ARRAY['music', 'streaming', 'audio'],
    TRUE,
    NOW() - INTERVAL '45 days',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'GitHub Pro',
    '개발자 도구 - 프라이빗 저장소 무제한',
    10.00,
    '$10',
    'USD',
    'monthly',
    CURRENT_DATE + INTERVAL '22 days',
    FALSE,
    'https://github.com',
    'Development',
    ARRAY['development', 'coding', 'git'],
    TRUE,
    NOW() - INTERVAL '30 days',
    NOW()
),
-- 사용자 1의 커스텀 서비스들
(
    '550e8400-e29b-41d4-a716-446655440001',
    '집세',
    '월세 지불',
    500000.00,
    '₩500,000',
    'KRW',
    'monthly',
    CURRENT_DATE + INTERVAL '5 days',
    TRUE,
    NULL,
    'Housing',
    ARRAY['housing', 'rent'],
    TRUE,
    NOW() - INTERVAL '90 days',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    '전기세',
    '한국전력공사 전기요금',
    45000.00,
    '₩45,000',
    'KRW',
    'monthly',
    CURRENT_DATE + INTERVAL '12 days',
    TRUE,
    'https://cyber.kepco.co.kr',
    'Utilities',
    ARRAY['utilities', 'electricity'],
    TRUE,
    NOW() - INTERVAL '75 days',
    NOW()
),
-- 사용자 2의 구독 서비스들
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Adobe Creative Cloud',
    '디자인 도구 모음 - Photoshop, Illustrator 등',
    52.99,
    '$52.99',
    'USD',
    'monthly',
    CURRENT_DATE + INTERVAL '18 days',
    FALSE,
    'https://adobe.com',
    'Design',
    ARRAY['design', 'creative', 'adobe'],
    TRUE,
    NOW() - INTERVAL '40 days',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Notion Premium',
    '노트 및 프로젝트 관리 도구',
    8.00,
    '$8',
    'USD',
    'monthly',
    CURRENT_DATE + INTERVAL '25 days',
    FALSE,
    'https://notion.so',
    'Productivity',
    ARRAY['productivity', 'notes', 'organization'],
    TRUE,
    NOW() - INTERVAL '35 days',
    NOW()
),
-- 사용자 3의 구독 서비스들
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Figma Professional',
    'UI/UX 디자인 도구',
    12.00,
    '€12',
    'EUR',
    'monthly',
    CURRENT_DATE + INTERVAL '10 days',
    FALSE,
    'https://figma.com',
    'Design',
    ARRAY['design', 'ui', 'ux', 'figma'],
    TRUE,
    NOW() - INTERVAL '50 days',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Slack Pro',
    '팀 커뮤니케이션 도구',
    7.25,
    '€7.25',
    'EUR',
    'monthly',
    CURRENT_DATE + INTERVAL '28 days',
    FALSE,
    'https://slack.com',
    'Communication',
    ARRAY['communication', 'team', 'chat'],
    TRUE,
    NOW() - INTERVAL '25 days',
    NOW()
),
-- 비활성화된 서비스 (테스트용)
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Disney+',
    '디즈니 콘텐츠 스트리밍',
    9900.00,
    '₩9,900',
    'KRW',
    'monthly',
    CURRENT_DATE + INTERVAL '50 days',
    FALSE,
    'https://disneyplus.com',
    'Entertainment',
    ARRAY['streaming', 'disney'],
    FALSE,
    NOW() - INTERVAL '120 days',
    NOW()
);

-- Step 3: 테스트용 알림 설정 데이터
-- =====================================================

INSERT INTO public.notification_settings (
    user_id,
    service_id,
    notification_type,
    alarm_type,
    is_enabled,
    created_at,
    updated_at
) VALUES 
-- 사용자 1의 알림 설정
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM public.services WHERE name = 'Netflix Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    'EMAIL',
    'BEFORE_3_DAYS',
    TRUE,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM public.services WHERE name = 'Spotify Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    'PUSH',
    'BEFORE_1_DAY',
    TRUE,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM public.services WHERE name = '집세' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    'SMS',
    'BEFORE_1_WEEK',
    TRUE,
    NOW(),
    NOW()
),
-- 사용자 2의 알림 설정
(
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM public.services WHERE name = 'Adobe Creative Cloud' AND user_id = '550e8400-e29b-41d4-a716-446655440002'),
    'EMAIL',
    'BEFORE_3_DAYS',
    TRUE,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM public.services WHERE name = 'Notion Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440002'),
    'PUSH',
    'ON_DUE_DATE',
    TRUE,
    NOW(),
    NOW()
),
-- 사용자 3의 알림 설정
(
    '550e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM public.services WHERE name = 'Figma Professional' AND user_id = '550e8400-e29b-41d4-a716-446655440003'),
    'EMAIL',
    'BEFORE_1_WEEK',
    TRUE,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM public.services WHERE name = 'Slack Pro' AND user_id = '550e8400-e29b-41d4-a716-446655440003'),
    'WEBHOOK',
    'BEFORE_3_DAYS',
    TRUE,
    NOW(),
    NOW()
);

-- Step 4: 테스트용 환율 데이터
-- =====================================================

INSERT INTO public.exchange_rates (
    base_currency,
    target_currency,
    rate,
    effective_date,
    source,
    created_at
) VALUES 
-- USD 기준 환율
('USD', 'KRW', 1300.50, CURRENT_DATE, 'API', NOW()),
('USD', 'EUR', 0.85, CURRENT_DATE, 'API', NOW()),
('USD', 'JPY', 110.25, CURRENT_DATE, 'API', NOW()),
-- EUR 기준 환율
('EUR', 'KRW', 1530.00, CURRENT_DATE, 'API', NOW()),
('EUR', 'USD', 1.18, CURRENT_DATE, 'API', NOW()),
('EUR', 'JPY', 129.70, CURRENT_DATE, 'API', NOW()),
-- KRW 기준 환율
('KRW', 'USD', 0.00077, CURRENT_DATE, 'API', NOW()),
('KRW', 'EUR', 0.00065, CURRENT_DATE, 'API', NOW()),
('KRW', 'JPY', 0.085, CURRENT_DATE, 'API', NOW()),
-- JPY 기준 환율
('JPY', 'KRW', 11.76, CURRENT_DATE, 'API', NOW()),
('JPY', 'USD', 0.0091, CURRENT_DATE, 'API', NOW()),
('JPY', 'EUR', 0.0077, CURRENT_DATE, 'API', NOW())
ON CONFLICT (base_currency, target_currency, effective_date) DO NOTHING;

-- Step 5: 테스트용 결제 내역 데이터
-- =====================================================

INSERT INTO public.payment_history (
    user_id,
    service_id,
    amount,
    currency,
    payment_date,
    payment_method,
    transaction_id,
    status,
    notes,
    created_at
) VALUES 
-- 사용자 1의 결제 내역
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM public.services WHERE name = 'Netflix Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    17000.00,
    'KRW',
    CURRENT_DATE - INTERVAL '30 days',
    'credit_card',
    'TXN_001',
    'completed',
    '정상 결제',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM public.services WHERE name = 'Spotify Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    13900.00,
    'KRW',
    CURRENT_DATE - INTERVAL '30 days',
    'credit_card',
    'TXN_002',
    'completed',
    '정상 결제',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM public.services WHERE name = '집세' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    500000.00,
    'KRW',
    CURRENT_DATE - INTERVAL '30 days',
    'bank_transfer',
    'TXN_003',
    'completed',
    '이체 완료',
    NOW()
),
-- 사용자 2의 결제 내역
(
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM public.services WHERE name = 'Adobe Creative Cloud' AND user_id = '550e8400-e29b-41d4-a716-446655440002'),
    52.99,
    'USD',
    CURRENT_DATE - INTERVAL '30 days',
    'credit_card',
    'TXN_004',
    'completed',
    '정상 결제',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM public.services WHERE name = 'Notion Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440002'),
    8.00,
    'USD',
    CURRENT_DATE - INTERVAL '30 days',
    'credit_card',
    'TXN_005',
    'completed',
    '정상 결제',
    NOW()
),
-- 사용자 3의 결제 내역
(
    '550e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM public.services WHERE name = 'Figma Professional' AND user_id = '550e8400-e29b-41d4-a716-446655440003'),
    12.00,
    'EUR',
    CURRENT_DATE - INTERVAL '30 days',
    'credit_card',
    'TXN_006',
    'completed',
    '정상 결제',
    NOW()
),
-- 실패한 결제 내역 (테스트용)
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM public.services WHERE name = 'GitHub Pro' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    10.00,
    'USD',
    CURRENT_DATE - INTERVAL '15 days',
    'credit_card',
    'TXN_007',
    'failed',
    '카드 한도 초과',
    NOW()
);

-- Step 6: 테스트용 감사 로그 데이터
-- =====================================================

INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    before_data,
    after_data,
    changed_by,
    changed_at
) VALUES 
-- 서비스 생성 로그
(
    'services',
    (SELECT id FROM public.services WHERE name = 'Netflix Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    'INSERT',
    NULL,
    '{"name": "Netflix Premium", "price": 17000.00, "currency": "KRW"}'::jsonb,
    '550e8400-e29b-41d4-a716-446655440001',
    NOW() - INTERVAL '60 days'
),
-- 서비스 업데이트 로그
(
    'services',
    (SELECT id FROM public.services WHERE name = 'Spotify Premium' AND user_id = '550e8400-e29b-41d4-a716-446655440001'),
    'UPDATE',
    '{"price": 12900.00}'::jsonb,
    '{"price": 13900.00}'::jsonb,
    '550e8400-e29b-41d4-a716-446655440001',
    NOW() - INTERVAL '30 days'
),
-- 알림 설정 생성 로그
(
    'notification_settings',
    (SELECT id FROM public.notification_settings WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1),
    'INSERT',
    NULL,
    '{"notification_type": "EMAIL", "alarm_type": "BEFORE_3_DAYS"}'::jsonb,
    '550e8400-e29b-41d4-a716-446655440001',
    NOW()
);

-- Step 7: 테스트 데이터 검증
-- =====================================================

-- 7.1 데이터 수 확인
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
FROM public.payment_history
UNION ALL
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as record_count
FROM public.audit_logs;

-- 7.2 서비스 타입별 분포
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

-- 7.3 사용자별 서비스 요약
SELECT 
    p.name as user_name,
    p.currency_preference,
    COUNT(s.id) as total_services,
    COUNT(s.id) FILTER (WHERE s.is_active = true) as active_services,
    SUM(s.price) FILTER (WHERE s.is_active = true) as total_monthly_cost
FROM public.profiles p
LEFT JOIN public.services s ON p.id = s.user_id
GROUP BY p.id, p.name, p.currency_preference
ORDER BY p.name;

-- 7.4 통합 뷰 테스트
SELECT 
    service_type,
    name,
    price,
    currency,
    next_billing_date,
    category
FROM public.unified_services
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY next_billing_date;

-- 7.5 사용자별 서비스 요약 뷰 테스트
SELECT 
    name as user_name,
    currency_preference,
    total_services,
    active_services,
    total_monthly_cost,
    next_billing_date
FROM public.user_service_summary
ORDER BY name;

-- 7.6 통화 변환 함수 테스트
SELECT 
    s.name,
    s.price as original_price,
    s.currency as original_currency,
    p.currency_preference as user_currency,
    convert_currency(s.price, s.currency, p.currency_preference) as converted_price
FROM public.services s
JOIN public.profiles p ON s.user_id = p.id
WHERE s.user_id = '550e8400-e29b-41d4-a716-446655440001'
  AND s.is_active = true
  AND s.currency != p.currency_preference;

-- 7.7 다음 결제일 계산 함수 테스트
SELECT 
    name,
    next_billing_date,
    billing_cycle,
    calculate_next_billing_date(next_billing_date, billing_cycle) as next_billing_after_current
FROM public.services
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'
  AND is_active = true
ORDER BY next_billing_date;