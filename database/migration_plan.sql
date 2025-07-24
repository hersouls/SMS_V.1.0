-- =====================================================
-- Supabase 구독 관리 DB 마이그레이션 계획
-- 기존 스키마 → 개선된 스키마로 단계별 마이그레이션
-- =====================================================

-- Step 1: 기존 데이터 백업
-- =====================================================

-- 1.1 기존 테이블 백업
CREATE TABLE IF NOT EXISTS subscriptions_backup AS 
SELECT * FROM public.subscriptions;

CREATE TABLE IF NOT EXISTS custom_services_backup AS 
SELECT * FROM public.custom_services;

CREATE TABLE IF NOT EXISTS profiles_backup AS 
SELECT * FROM public.profiles;

CREATE TABLE IF NOT EXISTS notifications_backup AS 
SELECT * FROM public.notifications;

CREATE TABLE IF NOT EXISTS alarm_history_backup AS 
SELECT * FROM public.alarm_history;

CREATE TABLE IF NOT EXISTS exchange_rates_backup AS 
SELECT * FROM public.exchange_rates;

-- 1.2 백업 확인
SELECT 'subscriptions_backup' as table_name, COUNT(*) as record_count FROM subscriptions_backup
UNION ALL
SELECT 'custom_services_backup' as table_name, COUNT(*) as record_count FROM custom_services_backup
UNION ALL
SELECT 'profiles_backup' as table_name, COUNT(*) as record_count FROM profiles_backup
UNION ALL
SELECT 'notifications_backup' as table_name, COUNT(*) as record_count FROM notifications_backup
UNION ALL
SELECT 'alarm_history_backup' as table_name, COUNT(*) as record_count FROM alarm_history_backup
UNION ALL
SELECT 'exchange_rates_backup' as table_name, COUNT(*) as record_count FROM exchange_rates_backup;

-- Step 2: 기존 테이블 및 타입 삭제
-- =====================================================

-- 2.1 기존 트리거 삭제
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_custom_services_updated_at ON public.custom_services;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2.2 기존 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2.3 기존 테이블 삭제 (백업 후)
DROP TABLE IF EXISTS public.alarm_history CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.custom_services CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.exchange_rates CASCADE;

-- 2.4 기존 타입 삭제
DROP TYPE IF EXISTS subscription_currency CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS alarm_type CASCADE;

-- Step 3: 개선된 스키마 적용
-- =====================================================

-- 3.1 개선된 ENUM 타입 정의
CREATE TYPE subscription_currency AS ENUM ('KRW', 'USD', 'EUR', 'JPY', 'CNY');
CREATE TYPE notification_type AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WEBHOOK');
CREATE TYPE alarm_type AS ENUM ('BEFORE_1_DAY', 'BEFORE_3_DAYS', 'BEFORE_1_WEEK', 'ON_DUE_DATE', 'AFTER_1_DAY');

-- 3.2 개선된 사용자 프로필 테이블
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Asia/Seoul',
    currency_preference subscription_currency DEFAULT 'KRW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 통합 서비스 테이블 (subscriptions + custom_services 통합)
CREATE TABLE public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL, -- 개선: TEXT → DECIMAL로 통일
    price_label TEXT, -- 개선: 표시용 문자열 분리
    currency subscription_currency NOT NULL DEFAULT 'KRW',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'weekly', 'daily')),
    next_billing_date DATE NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE, -- 개선: 통합 테이블로 분기
    service_url TEXT,
    category TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 개선된 알림 설정 테이블
CREATE TABLE public.notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    alarm_type alarm_type NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_id, notification_type, alarm_type)
);

-- 3.5 개선된 환율 정보 테이블
CREATE TABLE public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_currency subscription_currency NOT NULL, -- 개선: TEXT → ENUM 사용
    target_currency subscription_currency NOT NULL, -- 개선: TEXT → ENUM 사용
    rate DECIMAL(10,6) NOT NULL,
    effective_date DATE NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency, effective_date)
);

-- 3.6 결제 내역 테이블 (새로 추가)
CREATE TABLE public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency subscription_currency NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.7 감사 로그 테이블 (새로 추가)
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    before_data JSONB,
    after_data JSONB,
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: 인덱스 구성 (개선된 복합 인덱스)
-- =====================================================

-- 4.1 기본 인덱스
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- 4.2 서비스 테이블 인덱스
CREATE INDEX idx_services_user_id ON public.services(user_id);
CREATE INDEX idx_services_next_billing_date ON public.services(next_billing_date);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_services_category ON public.services(category);

-- 4.3 복합 인덱스 (개선사항)
CREATE INDEX idx_services_user_active ON public.services(user_id, is_active);
CREATE INDEX idx_services_user_billing ON public.services(user_id, next_billing_date);
CREATE INDEX idx_services_user_category ON public.services(user_id, category);

-- 4.4 알림 설정 인덱스
CREATE INDEX idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX idx_notification_settings_service_id ON public.notification_settings(service_id);
CREATE INDEX idx_notification_settings_enabled ON public.notification_settings(is_enabled);

-- 4.5 환율 인덱스
CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates(effective_date);

-- 4.6 결제 내역 인덱스
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_service_id ON public.payment_history(service_id);
CREATE INDEX idx_payment_history_date ON public.payment_history(payment_date);
CREATE INDEX idx_payment_history_status ON public.payment_history(status);

-- 4.7 감사 로그 인덱스
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON public.audit_logs(changed_at);
CREATE INDEX idx_audit_logs_operation ON public.audit_logs(operation);

-- Step 5: 트리거 및 함수 생성
-- =====================================================

-- 5.1 updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5.2 updated_at 트리거 적용
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5.3 사용자 프로필 자동 생성 함수 (개선: 확장된 필드)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 사용자 생성 트리거
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.5 감사 로그 트리거 함수
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, after_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, before_data, after_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, operation, before_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5.6 감사 로그 트리거 적용
CREATE TRIGGER audit_services_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.services
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_notification_settings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.notification_settings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Step 6: 통합 뷰 생성
-- =====================================================

-- 6.1 서비스 통합 뷰
CREATE VIEW public.unified_services AS
SELECT 
    id,
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
    updated_at,
    CASE 
        WHEN is_custom THEN 'custom'
        ELSE 'subscription'
    END as service_type
FROM public.services;

-- 6.2 사용자별 서비스 요약 뷰
CREATE VIEW public.user_service_summary AS
SELECT 
    p.id as user_id,
    p.email,
    p.name,
    p.currency_preference,
    COUNT(s.id) as total_services,
    COUNT(s.id) FILTER (WHERE s.is_active = true) as active_services,
    SUM(s.price) FILTER (WHERE s.is_active = true) as total_monthly_cost,
    MIN(s.next_billing_date) as next_billing_date
FROM public.profiles p
LEFT JOIN public.services s ON p.id = s.user_id
GROUP BY p.id, p.email, p.name, p.currency_preference;

-- Step 7: RLS 정책 설정
-- =====================================================

-- 7.1 프로필 테이블 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7.2 서비스 테이블 RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services" ON public.services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services" ON public.services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services" ON public.services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services" ON public.services
    FOR DELETE USING (auth.uid() = user_id);

-- 7.3 알림 설정 테이블 RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON public.notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON public.notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings" ON public.notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 7.4 결제 내역 테이블 RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history" ON public.payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment history" ON public.payment_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7.5 감사 로그 테이블 RLS (읽기 전용)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = changed_by);

-- Step 8: 유틸리티 함수 추가
-- =====================================================

-- 8.1 서비스 가격을 사용자 선호 통화로 변환하는 함수
CREATE OR REPLACE FUNCTION convert_currency(
    amount DECIMAL,
    from_currency subscription_currency,
    to_currency subscription_currency,
    conversion_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL AS $$
DECLARE
    rate DECIMAL;
BEGIN
    IF from_currency = to_currency THEN
        RETURN amount;
    END IF;
    
    SELECT er.rate INTO rate
    FROM public.exchange_rates er
    WHERE er.base_currency = from_currency
      AND er.target_currency = to_currency
      AND er.effective_date <= conversion_date
    ORDER BY er.effective_date DESC
    LIMIT 1;
    
    IF rate IS NULL THEN
        RAISE EXCEPTION 'Exchange rate not found for % to % on %', from_currency, to_currency, conversion_date;
    END IF;
    
    RETURN amount * rate;
END;
$$ LANGUAGE plpgsql;

-- 8.2 다음 결제일 계산 함수
CREATE OR REPLACE FUNCTION calculate_next_billing_date(
    current_date DATE,
    billing_cycle TEXT
)
RETURNS DATE AS $$
BEGIN
    CASE billing_cycle
        WHEN 'daily' THEN
            RETURN current_date + INTERVAL '1 day';
        WHEN 'weekly' THEN
            RETURN current_date + INTERVAL '1 week';
        WHEN 'monthly' THEN
            RETURN current_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN current_date + INTERVAL '3 months';
        WHEN 'yearly' THEN
            RETURN current_date + INTERVAL '1 year';
        ELSE
            RAISE EXCEPTION 'Invalid billing cycle: %', billing_cycle;
    END CASE;
END;
$$ LANGUAGE plpgsql;