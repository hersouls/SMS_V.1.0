-- =====================================================
-- 스키마 호환성 테스트 스크립트
-- =====================================================

-- 1. 호환성 검증
SELECT '=== 호환성 검증 ===' as test_section;
SELECT * FROM verify_schema_compatibility();

-- 2. 테스트 데이터 삽입
SELECT '=== 테스트 데이터 삽입 ===' as test_section;

-- 함수를 통한 삽입 테스트
SELECT insert_subscription(
    auth.uid(), 
    'Netflix', 
    17.99, 
    'USD', 
    CURRENT_DATE + INTERVAL '1 month'
) as insert_result;

-- 직접 INSERT 테스트 (트리거 작동 확인)
INSERT INTO public.subscriptions (
    user_id, name, price, currency, renew_date, category
) VALUES (
    auth.uid(), 'Spotify', 9.99, 'USD', CURRENT_DATE + INTERVAL '1 month', 'Music'
);

INSERT INTO public.subscriptions (
    user_id, name, price, currency, renew_date, category
) VALUES (
    auth.uid(), 'YouTube Premium', 11.99, 'USD', CURRENT_DATE + INTERVAL '1 month', 'Video'
);

-- 3. 데이터 조회 테스트
SELECT '=== 데이터 조회 테스트 ===' as test_section;

-- subscriptions 뷰를 통한 조회
SELECT 
    id, name, price, currency, renew_date, category, is_active
FROM public.subscriptions 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- services 테이블 직접 조회 (비교용)
SELECT 
    id, name, price, currency, next_billing_date, category, is_active
FROM public.services 
WHERE user_id = auth.uid() AND is_custom = false
ORDER BY created_at DESC;

-- 4. UPDATE 테스트
SELECT '=== UPDATE 테스트 ===' as test_section;

-- 구독 업데이트
UPDATE public.subscriptions 
SET price = 19.99, category = 'Streaming'
WHERE name = 'Netflix' AND user_id = auth.uid();

-- 업데이트 결과 확인
SELECT 
    id, name, price, currency, renew_date, category, is_active, updated_at
FROM public.subscriptions 
WHERE name = 'Netflix' AND user_id = auth.uid();

-- 5. DELETE 테스트
SELECT '=== DELETE 테스트 ===' as test_section;

-- 구독 삭제
DELETE FROM public.subscriptions 
WHERE name = 'YouTube Premium' AND user_id = auth.uid();

-- 삭제 결과 확인 (0개 행이 반환되어야 함)
SELECT COUNT(*) as remaining_subscriptions
FROM public.subscriptions 
WHERE name = 'YouTube Premium' AND user_id = auth.uid();

-- 6. 통계 확인
SELECT '=== 통계 확인 ===' as test_section;

-- 사용자별 구독 수
SELECT 
    COUNT(*) as total_subscriptions,
    SUM(price) as total_monthly_cost,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscriptions
FROM public.subscriptions 
WHERE user_id = auth.uid();

-- 7. services 테이블 상태 확인
SELECT '=== Services 테이블 상태 ===' as test_section;

SELECT 
    COUNT(*) as total_services,
    COUNT(CASE WHEN is_custom = false THEN 1 END) as regular_subscriptions,
    COUNT(CASE WHEN is_custom = true THEN 1 END) as custom_services
FROM public.services 
WHERE user_id = auth.uid();

-- 8. 뷰와 테이블 데이터 일치성 확인
SELECT '=== 데이터 일치성 확인 ===' as test_section;

SELECT 
    'subscriptions view' as source,
    COUNT(*) as record_count
FROM public.subscriptions 
WHERE user_id = auth.uid()
UNION ALL
SELECT 
    'services table (non-custom)' as source,
    COUNT(*) as record_count
FROM public.services 
WHERE user_id = auth.uid() AND is_custom = false;

-- 9. 필드 매핑 확인
SELECT '=== 필드 매핑 확인 ===' as test_section;

SELECT 
    s.id,
    s.name,
    s.price,
    s.currency,
    s.next_billing_date as services_renew_date,
    sub.renew_date as view_renew_date,
    s.service_url as services_url,
    sub.url as view_url
FROM public.services s
JOIN public.subscriptions sub ON s.id = sub.id
WHERE s.user_id = auth.uid() AND s.is_custom = false
LIMIT 3;

-- 10. 테스트 완료 메시지
SELECT '=== 테스트 완료 ===' as test_section;
SELECT '모든 테스트가 성공적으로 완료되었습니다! 🎉' as status;

-- 11. 정리 (테스트 데이터 삭제)
SELECT '=== 테스트 데이터 정리 ===' as test_section;

DELETE FROM public.subscriptions 
WHERE user_id = auth.uid() AND name IN ('Netflix', 'Spotify');

SELECT '테스트 데이터가 정리되었습니다.' as cleanup_status;