-- =====================================================
-- 데이터베이스 스키마 불일치 문제 해결 (Critical)
-- =====================================================
-- 문제: 기존 앱 코드는 'subscriptions' 테이블을 참조하지만 
-- 개선된 스키마에서는 'services' 테이블을 사용

-- ✅ 1단계: 현재 앱 코드와 호환되는 뷰 생성
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

-- ✅ 2단계: custom_services 뷰 생성
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

-- ✅ 3단계: 안전한 INSERT 함수 생성
CREATE OR REPLACE FUNCTION insert_subscription(
    p_user_id UUID,
    p_name TEXT,
    p_price DECIMAL(10,2),
    p_currency TEXT,
    p_renew_date DATE,
    p_start_date DATE DEFAULT NULL,
    p_payment_date INTEGER DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_icon TEXT DEFAULT NULL,
    p_icon_image_url TEXT DEFAULT NULL,
    p_color TEXT DEFAULT '#3B82F6'
) RETURNS JSON AS $$
DECLARE
    result_data JSON;
    new_service_id UUID;
BEGIN
    -- 데이터 검증
    IF p_price <= 0 THEN
        RAISE EXCEPTION 'Price must be greater than 0';
    END IF;
    
    IF p_payment_date IS NOT NULL AND (p_payment_date < 1 OR p_payment_date > 31) THEN
        RAISE EXCEPTION 'Payment date must be between 1 and 31';
    END IF;
    
    -- services 테이블에 삽입
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
        is_active
    ) VALUES (
        p_user_id,
        p_name,
        p_name, -- description에도 name 사용
        p_price,
        CASE 
            WHEN p_currency = 'KRW' THEN '₩' || p_price::TEXT
            WHEN p_currency = 'USD' THEN '$' || p_price::TEXT
            ELSE p_price::TEXT || ' ' || p_currency
        END,
        p_currency::subscription_currency,
        'monthly', -- 기본값
        p_renew_date,
        false, -- 일반 구독
        p_url,
        p_category,
        ARRAY[]::TEXT[], -- 빈 배열
        true
    ) RETURNING id INTO new_service_id;
    
    -- 결과 반환 (기존 subscriptions 형식으로)
    SELECT json_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'name', s.name,
        'price', s.price,
        'currency', s.currency,
        'renew_date', s.next_billing_date,
        'start_date', s.created_at::date,
        'payment_date', EXTRACT(day FROM s.next_billing_date),
        'url', s.service_url,
        'category', s.category,
        'is_active', s.is_active,
        'created_at', s.created_at,
        'updated_at', s.updated_at
    ) INTO result_data
    FROM public.services s
    WHERE s.id = new_service_id;
    
    RETURN result_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 4단계: RLS 정책 추가
ALTER VIEW public.subscriptions SET (security_invoker = true);
ALTER VIEW public.custom_services SET (security_invoker = true);

-- ✅ 5단계: 기존 앱 코드용 호환성 확보
-- 기존 INSERT 구문이 작동하도록 INSTEAD OF 트리거 생성
CREATE OR REPLACE FUNCTION subscriptions_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.services (
        user_id, name, price, price_label, currency, 
        next_billing_date, service_url, category, is_custom, is_active
    ) VALUES (
        NEW.user_id, NEW.name, NEW.price, 
        CASE 
            WHEN NEW.currency = 'KRW' THEN '₩' || NEW.price::TEXT
            WHEN NEW.currency = 'USD' THEN '$' || NEW.price::TEXT
            ELSE NEW.price::TEXT || ' ' || NEW.currency
        END,
        NEW.currency::subscription_currency,
        NEW.renew_date, NEW.url, NEW.category, false, 
        COALESCE(NEW.is_active, true)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_insert_instead_of
    INSTEAD OF INSERT ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION subscriptions_insert_trigger();

-- ✅ 6단계: UPDATE 트리거 생성
CREATE OR REPLACE FUNCTION subscriptions_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.services SET
        name = NEW.name,
        price = NEW.price,
        price_label = CASE 
            WHEN NEW.currency = 'KRW' THEN '₩' || NEW.price::TEXT
            WHEN NEW.currency = 'USD' THEN '$' || NEW.price::TEXT
            ELSE NEW.price::TEXT || ' ' || NEW.currency
        END,
        currency = NEW.currency::subscription_currency,
        next_billing_date = NEW.renew_date,
        service_url = NEW.url,
        category = NEW.category,
        is_active = NEW.is_active,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_update_instead_of
    INSTEAD OF UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION subscriptions_update_trigger();

-- ✅ 7단계: DELETE 트리거 생성
CREATE OR REPLACE FUNCTION subscriptions_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.services WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_delete_instead_of
    INSTEAD OF DELETE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION subscriptions_delete_trigger();

-- ✅ 8단계: custom_services 트리거들 생성
CREATE OR REPLACE FUNCTION custom_services_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.services (
        user_id, name, price, price_label, currency, 
        next_billing_date, service_url, category, is_custom, is_active
    ) VALUES (
        NEW.user_id, NEW.name, NEW.price, 
        CASE 
            WHEN NEW.currency = 'KRW' THEN '₩' || NEW.price::TEXT
            WHEN NEW.currency = 'USD' THEN '$' || NEW.price::TEXT
            ELSE NEW.price::TEXT || ' ' || NEW.currency
        END,
        NEW.currency::subscription_currency,
        NEW.renew_date, NEW.url, NEW.category, true, 
        COALESCE(NEW.is_active, true)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_services_insert_instead_of
    INSTEAD OF INSERT ON public.custom_services
    FOR EACH ROW EXECUTE FUNCTION custom_services_insert_trigger();

CREATE OR REPLACE FUNCTION custom_services_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.services SET
        name = NEW.name,
        price = NEW.price,
        price_label = CASE 
            WHEN NEW.currency = 'KRW' THEN '₩' || NEW.price::TEXT
            WHEN NEW.currency = 'USD' THEN '$' || NEW.price::TEXT
            ELSE NEW.price::TEXT || ' ' || NEW.currency
        END,
        currency = NEW.currency::subscription_currency,
        next_billing_date = NEW.renew_date,
        service_url = NEW.url,
        category = NEW.category,
        is_active = NEW.is_active,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_services_update_instead_of
    INSTEAD OF UPDATE ON public.custom_services
    FOR EACH ROW EXECUTE FUNCTION custom_services_update_trigger();

CREATE OR REPLACE FUNCTION custom_services_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.services WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_services_delete_instead_of
    INSTEAD OF DELETE ON public.custom_services
    FOR EACH ROW EXECUTE FUNCTION custom_services_delete_trigger();

-- ✅ 9단계: 마이그레이션 함수 생성 (기존 데이터가 있는 경우)
CREATE OR REPLACE FUNCTION migrate_existing_subscriptions()
RETURNS TEXT AS $$
DECLARE
    subscription_count INTEGER;
    custom_service_count INTEGER;
BEGIN
    -- 기존 subscriptions 테이블이 있는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public') THEN
        -- subscriptions 테이블의 데이터를 services로 마이그레이션
        INSERT INTO public.services (
            user_id, name, description, price, price_label, currency, 
            billing_cycle, next_billing_date, is_custom, service_url, 
            category, tags, is_active, created_at, updated_at
        )
        SELECT 
            user_id, name, name, price, 
            CASE 
                WHEN currency = 'KRW' THEN '₩' || price::TEXT
                WHEN currency = 'USD' THEN '$' || price::TEXT
                ELSE price::TEXT || ' ' || currency
            END,
            currency::subscription_currency, 'monthly', renew_date, 
            false, url, category, ARRAY[]::TEXT[], is_active, 
            created_at, updated_at
        FROM public.subscriptions
        ON CONFLICT DO NOTHING;
        
        GET DIAGNOSTICS subscription_count = ROW_COUNT;
        
        -- custom_services 테이블의 데이터를 services로 마이그레이션
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_services' AND table_schema = 'public') THEN
            INSERT INTO public.services (
                user_id, name, description, price, price_label, currency, 
                billing_cycle, next_billing_date, is_custom, service_url, 
                category, tags, is_active, created_at, updated_at
            )
            SELECT 
                user_id, name, name, price::DECIMAL(10,2), 
                CASE 
                    WHEN currency = 'KRW' THEN '₩' || price
                    WHEN currency = 'USD' THEN '$' || price
                    ELSE price || ' ' || currency
                END,
                currency::subscription_currency, 'monthly', renewal_date, 
                true, url, category, ARRAY[]::TEXT[], true, 
                created_at, updated_at
            FROM public.custom_services
            ON CONFLICT DO NOTHING;
            
            GET DIAGNOSTICS custom_service_count = ROW_COUNT;
        END IF;
        
        RETURN 'Migration completed: ' || subscription_count || ' subscriptions, ' || custom_service_count || ' custom services migrated.';
    ELSE
        RETURN 'No existing subscriptions table found. Migration not needed.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 10단계: 검증 함수 생성
CREATE OR REPLACE FUNCTION verify_schema_compatibility()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- services 테이블 존재 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services' AND table_schema = 'public') THEN
        RETURN QUERY SELECT 'Services table exists'::TEXT, 'PASS'::TEXT, 'Services table is available'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Services table exists'::TEXT, 'FAIL'::TEXT, 'Services table is missing'::TEXT;
    END IF;
    
    -- subscriptions 뷰 존재 확인
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'subscriptions' AND table_schema = 'public') THEN
        RETURN QUERY SELECT 'Subscriptions view exists'::TEXT, 'PASS'::TEXT, 'Subscriptions view is available'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Subscriptions view exists'::TEXT, 'FAIL'::TEXT, 'Subscriptions view is missing'::TEXT;
    END IF;
    
    -- custom_services 뷰 존재 확인
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'custom_services' AND table_schema = 'public') THEN
        RETURN QUERY SELECT 'Custom services view exists'::TEXT, 'PASS'::TEXT, 'Custom services view is available'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Custom services view exists'::TEXT, 'FAIL'::TEXT, 'Custom services view is missing'::TEXT;
    END IF;
    
    -- 트리거 존재 확인
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'subscriptions_insert_instead_of') THEN
        RETURN QUERY SELECT 'Subscriptions insert trigger'::TEXT, 'PASS'::TEXT, 'Insert trigger is available'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Subscriptions insert trigger'::TEXT, 'FAIL'::TEXT, 'Insert trigger is missing'::TEXT;
    END IF;
    
    -- 함수 존재 확인
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'insert_subscription') THEN
        RETURN QUERY SELECT 'Insert subscription function'::TEXT, 'PASS'::TEXT, 'Function is available'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Insert subscription function'::TEXT, 'FAIL'::TEXT, 'Function is missing'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 실행 지침
-- =====================================================

-- 1. 이 스크립트를 실행하여 호환성 레이어 생성
-- 2. 기존 데이터가 있다면 마이그레이션 실행:
--    SELECT migrate_existing_subscriptions();
-- 3. 호환성 검증:
--    SELECT * FROM verify_schema_compatibility();
-- 4. 테스트 데이터 삽입:
--    SELECT insert_subscription(
--        auth.uid(), 'Netflix', 17.99, 'USD', 
--        CURRENT_DATE + INTERVAL '1 month'
--    );

-- =====================================================
-- 완료 메시지
-- =====================================================
SELECT 'Database Schema Compatibility Fix Applied Successfully! 🎉' as status;