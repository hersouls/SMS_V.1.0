-- =====================================================
-- Supabase SQL Editor - 개선된 구독 관리 앱 스키마 (최종 수정 버전)
-- =====================================================

-- 1. 기존 테이블 삭제 (안전한 순서로)
DROP TABLE IF EXISTS public.alarm_history CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.custom_services CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.exchange_rates CASCADE;

-- 2. 기존 타입 및 함수 삭제
DROP TYPE IF EXISTS subscription_currency CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS alarm_type CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. 커스텀 타입 생성
CREATE TYPE subscription_currency AS ENUM ('USD', 'KRW', 'EUR', 'JPY');
CREATE TYPE notification_type AS ENUM ('success', 'warning', 'error', 'info');
CREATE TYPE alarm_type AS ENUM ('subscription_added', 'subscription_updated', 'subscription_deleted', 'renewal_reminder', 'payment_due');

-- 4. 사용자 프로필 테이블
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    photo_url TEXT,
    cover_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 구독 서비스 테이블 (개선된 버전)
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📱',
    icon_image_url TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency subscription_currency DEFAULT 'KRW',
    renew_date DATE NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    payment_date INTEGER CHECK (payment_date >= 1 AND payment_date <= 31),
    payment_card TEXT,
    url TEXT,
    color TEXT DEFAULT '#3B82F6',
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스를 위한 제약조건
    CONSTRAINT subscriptions_user_name_unique UNIQUE(user_id, name, is_active)
);

-- 6. 커스텀 서비스 테이블 (기존 호환성 유지)
CREATE TABLE public.custom_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price TEXT NOT NULL, -- 문자열로 유지 (기존 호환성)
    currency subscription_currency DEFAULT 'KRW',
    renewal_date DATE NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    payment_date INTEGER CHECK (payment_date >= 1 AND payment_date <= 31),
    payment_card TEXT,
    url TEXT,
    category TEXT,
    notifications BOOLEAN DEFAULT true,
    icon_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 알림 테이블
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 알람 히스토리 테이블
CREATE TABLE public.alarm_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type alarm_type NOT NULL,
    content TEXT NOT NULL,
    target TEXT NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    subscription_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 환율 정보 테이블
CREATE TABLE public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(10,6) NOT NULL CHECK (rate > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(base_currency, target_currency, date)
);

-- 10. 성능 최적화 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renew_date ON public.subscriptions(renew_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_date ON public.subscriptions(payment_date) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_custom_services_user_id ON public.custom_services(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_services_renewal_date ON public.custom_services(renewal_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_alarm_history_user_id ON public.alarm_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates(base_currency, target_currency, date);

-- 11. Row Level Security (RLS) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarm_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- 12. RLS 정책 생성 (보안 강화)

-- Profiles 정책
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "profiles_view_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions 정책
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;

CREATE POLICY "subscriptions_view_own" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_delete_own" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Custom Services 정책
DROP POLICY IF EXISTS "Users can view own custom services" ON public.custom_services;
DROP POLICY IF EXISTS "Users can insert own custom services" ON public.custom_services;
DROP POLICY IF EXISTS "Users can update own custom services" ON public.custom_services;
DROP POLICY IF EXISTS "Users can delete own custom services" ON public.custom_services;

CREATE POLICY "custom_services_view_own" ON public.custom_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "custom_services_insert_own" ON public.custom_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_services_update_own" ON public.custom_services
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_services_delete_own" ON public.custom_services
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications 정책
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "notifications_view_own" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Alarm History 정책
DROP POLICY IF EXISTS "Users can view own alarm history" ON public.alarm_history;
DROP POLICY IF EXISTS "Users can insert own alarm history" ON public.alarm_history;
DROP POLICY IF EXISTS "Users can update own alarm history" ON public.alarm_history;
DROP POLICY IF EXISTS "Users can delete own alarm history" ON public.alarm_history;

CREATE POLICY "alarm_history_view_own" ON public.alarm_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alarm_history_insert_own" ON public.alarm_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alarm_history_update_own" ON public.alarm_history
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alarm_history_delete_own" ON public.alarm_history
    FOR DELETE USING (auth.uid() = user_id);

-- Exchange Rates 정책 (모든 인증된 사용자 접근 가능)
DROP POLICY IF EXISTS "Authenticated users can view exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can insert exchange rates" ON public.exchange_rates;

CREATE POLICY "exchange_rates_view_all" ON public.exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exchange_rates_insert_all" ON public.exchange_rates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 13. 자동 타임스탬프 업데이트 함수 (개선된 버전)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 14. 타임스탬프 트리거 생성
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_custom_services_updated_at ON public.custom_services;

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_services_updated_at 
    BEFORE UPDATE ON public.custom_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. 사용자 가입 시 프로필 자동 생성 함수 (보안 강화)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        username,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        split_part(NEW.email, '@', 1), -- 이메일 앞부분을 기본 사용자명으로
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- 16. 사용자 가입 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. 기본 환율 데이터 삽입
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, date) VALUES
('USD', 'KRW', 1350.50, CURRENT_DATE),
('EUR', 'KRW', 1480.25, CURRENT_DATE),
('JPY', 'KRW', 9.15, CURRENT_DATE),
('KRW', 'USD', 0.00074, CURRENT_DATE),
('KRW', 'EUR', 0.00068, CURRENT_DATE),
('KRW', 'JPY', 0.1093, CURRENT_DATE)
ON CONFLICT (base_currency, target_currency, date) DO UPDATE SET
    rate = EXCLUDED.rate,
    created_at = NOW();

-- 18. 데이터 무결성을 위한 추가 제약조건
ALTER TABLE public.subscriptions 
ADD CONSTRAINT check_renew_after_start 
CHECK (renew_date >= start_date);

ALTER TABLE public.custom_services 
ADD CONSTRAINT check_renewal_after_start 
CHECK (renewal_date >= start_date);

-- 19. 현재 사용자 프로필 확인 및 생성 (안전한 방식)
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, first_name, created_at, updated_at)
        VALUES (
            auth.uid(),
            COALESCE(auth.email(), 'user@example.com'),
            'User',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, profiles.email),
            updated_at = NOW();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- 오류가 발생해도 스키마 생성은 계속 진행
        RAISE NOTICE 'Profile creation skipped: %', SQLERRM;
END $$;

-- =====================================================
-- 최종 검증 및 상태 확인
-- =====================================================

-- 테이블 생성 확인
DO $$
BEGIN
    RAISE NOTICE '=== 테이블 생성 확인 ===';
    PERFORM 1;
END $$;

SELECT 
    'Tables Created' as info,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'subscriptions', 'custom_services', 'notifications', 'alarm_history', 'exchange_rates');

-- RLS 정책 확인
SELECT 
    'RLS Policies' as info,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- 인덱스 확인
SELECT 
    'Indexes Created' as info,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public';

-- 환율 데이터 확인
SELECT 
    'Exchange Rates' as info,
    COUNT(*) as count
FROM public.exchange_rates;

-- =====================================================
-- 완료 메시지
-- =====================================================
SELECT 
    '🎉 개선된 구독 관리 DB 스키마가 성공적으로 생성되었습니다!' as status,
    NOW() as completed_at;

-- 추가 참고사항
SELECT 
    '📋 다음 단계' as next_steps,
    '1. 프론트엔드 코드에서 필드명 통일' as step1,
    '2. 구독 추가 로직 단일화' as step2,
    '3. 에러 핸들링 개선' as step3;

-- =====================================================
-- Row Level Security (RLS) 활성화 및 정책 생성
-- =====================================================

-- 20. RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarm_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- 21. RLS 정책 생성

-- 프로필 테이블 정책
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 구독 테이블 정책
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- 커스텀 서비스 테이블 정책
CREATE POLICY "Users can view own custom services" ON public.custom_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom services" ON public.custom_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom services" ON public.custom_services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom services" ON public.custom_services
    FOR DELETE USING (auth.uid() = user_id);

-- 알림 테이블 정책
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 알람 히스토리 테이블 정책
CREATE POLICY "Users can view own alarm history" ON public.alarm_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alarm history" ON public.alarm_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alarm history" ON public.alarm_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alarm history" ON public.alarm_history
    FOR DELETE USING (auth.uid() = user_id);

-- 환율 테이블 정책 (인증된 사용자만 접근 가능)
CREATE POLICY "Authenticated users can view exchange rates" ON public.exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exchange rates" ON public.exchange_rates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- RLS 정책 확인
-- =====================================================
SELECT 
    'RLS Policies Created' as info,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- =====================================================
-- 최종 완료 메시지
-- =====================================================
SELECT 
    '🎉 RLS 정책이 성공적으로 적용되었습니다!' as status,
    NOW() as completed_at;