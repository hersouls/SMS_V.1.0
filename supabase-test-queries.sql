-- =====================================================
-- Supabase SQL Editor - 테스트 쿼리 모음
-- =====================================================

-- 1. 테이블 구조 확인
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 2. 생성된 타입 확인
SELECT typname, typtype
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typname IN ('subscription_currency', 'notification_type', 'alarm_type');

-- 3. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. 인덱스 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. 트리거 확인
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. 샘플 데이터 삽입 (테스트용)

-- 환율 데이터 삽입
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, date) VALUES
('USD', 'KRW', 1350.50, CURRENT_DATE),
('EUR', 'KRW', 1480.25, CURRENT_DATE),
('JPY', 'KRW', 9.15, CURRENT_DATE)
ON CONFLICT (base_currency, target_currency, date) DO NOTHING;

-- 7. 샘플 구독 데이터 삽입 (테스트용 - 실제 사용자 ID 필요)
-- INSERT INTO public.subscriptions (
--     user_id,
--     name,
--     icon,
--     price,
--     currency,
--     renew_date,
--     payment_date,
--     url,
--     color,
--     category
-- ) VALUES
-- (
--     '여기에_실제_사용자_ID_입력',
--     'Netflix',
--     '🎬',
--     17.99,
--     'USD',
--     '2024-02-15',
--     15,
--     'https://netflix.com',
--     '#E50914',
--     '엔터테인먼트'
-- );

-- 8. 데이터 확인 쿼리들

-- 환율 데이터 확인
SELECT * FROM public.exchange_rates ORDER BY created_at DESC LIMIT 10;

-- 구독 데이터 확인 (사용자별)
-- SELECT * FROM public.subscriptions WHERE user_id = '여기에_실제_사용자_ID_입력';

-- 알림 데이터 확인 (사용자별)
-- SELECT * FROM public.notifications WHERE user_id = '여기에_실제_사용자_ID_입력' ORDER BY created_at DESC;

-- 알람 히스토리 확인 (사용자별)
-- SELECT * FROM public.alarm_history WHERE user_id = '여기에_실제_사용자_ID_입력' ORDER BY created_at DESC;

-- 9. 통계 쿼리들

-- 사용자별 구독 수
-- SELECT 
--     p.email,
--     COUNT(s.id) as subscription_count,
--     SUM(s.price) as total_price
-- FROM public.profiles p
-- LEFT JOIN public.subscriptions s ON p.id = s.user_id
-- GROUP BY p.id, p.email;

-- 통화별 구독 분포
-- SELECT 
--     currency,
--     COUNT(*) as count,
--     AVG(price) as avg_price
-- FROM public.subscriptions
-- GROUP BY currency;

-- 카테고리별 구독 분포
-- SELECT 
--     category,
--     COUNT(*) as count
-- FROM public.subscriptions
-- WHERE category IS NOT NULL
-- GROUP BY category
-- ORDER BY count DESC;

-- 10. 유틸리티 쿼리들

-- 이번 달 갱신 예정 구독
-- SELECT 
--     name,
--     renew_date,
--     price,
--     currency
-- FROM public.subscriptions
-- WHERE EXTRACT(MONTH FROM renew_date) = EXTRACT(MONTH FROM CURRENT_DATE)
-- AND EXTRACT(YEAR FROM renew_date) = EXTRACT(YEAR FROM CURRENT_DATE)
-- ORDER BY renew_date;

-- 비활성화된 구독
-- SELECT 
--     name,
--     is_active,
--     updated_at
-- FROM public.subscriptions
-- WHERE is_active = false;

-- 11. 정리 쿼리들 (필요시)

-- 모든 데이터 삭제 (주의: 실제 데이터 손실)
-- DELETE FROM public.alarm_history;
-- DELETE FROM public.notifications;
-- DELETE FROM public.custom_services;
-- DELETE FROM public.subscriptions;
-- DELETE FROM public.profiles;
-- DELETE FROM public.exchange_rates;

-- 12. 성능 확인 쿼리

-- 테이블 크기 확인
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- =====================================================
-- 실행 완료 메시지
-- =====================================================
SELECT 'Test queries ready for execution!' as status; 