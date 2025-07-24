-- =====================================================
-- Supabase 구독 관리 DB Schema (개선된 버전)
-- 리포트 기반 개선사항 적용
-- =====================================================

-- 1. ENUM 타입 정의 (유연성을 위해 TEXT + CHECK 방식 고려)
CREATE TYPE subscription_currency AS ENUM ('KRW', 'USD', 'EUR', 'JPY', 'CNY');
CREATE TYPE notification_type AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WEBHOOK');
CREATE TYPE alarm_type AS ENUM ('BEFORE_1_DAY', 'BEFORE_3_DAYS', 'BEFORE_1_WEEK', 'ON_DUE_DATE', 'AFTER_1_DAY');

-- 2. 사용자 프로필 테이블 (확장된 버전)
CREATE TABLE profiles (
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

-- 3. 통합 서비스 테이블 (subscriptions + custom_services 통합)
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- 4. 알림 설정 테이블
CREATE TABLE notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    alarm_type alarm_type NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_id, notification_type, alarm_type)
);

-- 5. 환율 정보 테이블 (개선: ENUM 재사용)
CREATE TABLE exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_currency subscription_currency NOT NULL, -- 개선: TEXT → ENUM 사용
    target_currency subscription_currency NOT NULL, -- 개선: TEXT → ENUM 사용
    rate DECIMAL(10,6) NOT NULL,
    effective_date DATE NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency, effective_date)
);

-- 6. 결제 내역 테이블
CREATE TABLE payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency subscription_currency NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 감사 로그 테이블 (개선: 변경 이력 추적)
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    before_data JSONB,
    after_data JSONB,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 구성 (개선: 복합 인덱스 추가)
-- =====================================================

-- 기본 인덱스
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- 서비스 테이블 인덱스
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_next_billing_date ON services(next_billing_date);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_category ON services(category);

-- 복합 인덱스 (개선사항)
CREATE INDEX idx_services_user_active ON services(user_id, is_active);
CREATE INDEX idx_services_user_billing ON services(user_id, next_billing_date);
CREATE INDEX idx_services_user_category ON services(user_id, category);

-- 알림 설정 인덱스
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_settings_service_id ON notification_settings(service_id);
CREATE INDEX idx_notification_settings_enabled ON notification_settings(is_enabled);

-- 환율 인덱스
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(effective_date);

-- 결제 내역 인덱스
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_service_id ON payment_history(service_id);
CREATE INDEX idx_payment_history_date ON payment_history(payment_date);
CREATE INDEX idx_payment_history_status ON payment_history(status);

-- 감사 로그 인덱스
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);

-- =====================================================
-- 트리거 및 함수
-- =====================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 사용자 프로필 자동 생성 함수 (개선: 확장된 필드)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 생성 트리거
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 감사 로그 트리거 함수
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, operation, after_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, operation, before_data, after_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, operation, before_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 감사 로그 트리거 적용
CREATE TRIGGER audit_services_trigger
    AFTER INSERT OR UPDATE OR DELETE ON services
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_notification_settings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- 통합 뷰 (개선: 프론트엔드 통합용)
-- =====================================================

-- 서비스 통합 뷰
CREATE VIEW unified_services AS
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
FROM services;

-- 사용자별 서비스 요약 뷰
CREATE VIEW user_service_summary AS
SELECT 
    p.id as user_id,
    p.email,
    p.name,
    p.currency_preference,
    COUNT(s.id) as total_services,
    COUNT(s.id) FILTER (WHERE s.is_active = true) as active_services,
    SUM(s.price) FILTER (WHERE s.is_active = true) as total_monthly_cost,
    MIN(s.next_billing_date) as next_billing_date
FROM profiles p
LEFT JOIN services s ON p.id = s.user_id
GROUP BY p.id, p.email, p.name, p.currency_preference;

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 프로필 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 서비스 테이블 RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services" ON services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services" ON services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services" ON services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services" ON services
    FOR DELETE USING (auth.uid() = user_id);

-- 알림 설정 테이블 RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 결제 내역 테이블 RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment history" ON payment_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 감사 로그 테이블 RLS (읽기 전용)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = changed_by);

-- =====================================================
-- 샘플 데이터 (테스트용)
-- =====================================================

-- 환율 샘플 데이터
INSERT INTO exchange_rates (base_currency, target_currency, rate, effective_date, source) VALUES
('USD', 'KRW', 1300.50, CURRENT_DATE, 'API'),
('EUR', 'KRW', 1400.25, CURRENT_DATE, 'API'),
('JPY', 'KRW', 8.75, CURRENT_DATE, 'API'),
('USD', 'EUR', 0.85, CURRENT_DATE, 'API');

-- =====================================================
-- 유틸리티 함수
-- =====================================================

-- 서비스 가격을 사용자 선호 통화로 변환하는 함수
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
    FROM exchange_rates er
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

-- 다음 결제일 계산 함수
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