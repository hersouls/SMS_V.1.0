-- =====================================================
-- Supabase SQL Editor - 구독 관리 앱 데이터베이스 스키마
-- =====================================================

-- 1. 기존 테이블 삭제 (필요시)
-- DROP TABLE IF EXISTS public.alarm_history CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.custom_services CASCADE;
-- DROP TABLE IF EXISTS public.subscriptions CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.exchange_rates CASCADE;

-- 2. 기존 타입 삭제 (필요시)
-- DROP TYPE IF EXISTS subscription_currency CASCADE;
-- DROP TYPE IF EXISTS notification_type CASCADE;
-- DROP TYPE IF EXISTS alarm_type CASCADE;

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

-- 5. 구독 서비스 테이블
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    icon_image_url TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency subscription_currency DEFAULT 'KRW',
    renew_date DATE NOT NULL,
    start_date DATE,
    payment_date INTEGER CHECK (payment_date >= 1 AND payment_date <= 31),
    payment_card TEXT,
    url TEXT,
    color TEXT DEFAULT '#3B82F6',
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 커스텀 서비스 테이블
CREATE TABLE public.custom_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    currency subscription_currency DEFAULT 'KRW',
    renewal_date DATE NOT NULL,
    start_date DATE,
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
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 알람 히스토리 테이블
CREATE TABLE public.alarm_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type alarm_type NOT NULL,
    content TEXT NOT NULL,
    target TEXT NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    subscription_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 환율 정보 테이블 (캐싱용)
CREATE TABLE public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency, date)
);

-- 10. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_renew_date ON public.subscriptions(renew_date);
CREATE INDEX idx_subscriptions_is_active ON public.subscriptions(is_active);
CREATE INDEX idx_custom_services_user_id ON public.custom_services(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_alarm_history_user_id ON public.alarm_history(user_id);
CREATE INDEX idx_alarm_history_created_at ON public.alarm_history(created_at);
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates(date);

-- 11. Row Level Security (RLS) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarm_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- 12. RLS 정책 생성

-- 프로필 정책
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 구독 정책
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- 커스텀 서비스 정책
CREATE POLICY "Users can view own custom services" ON public.custom_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom services" ON public.custom_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom services" ON public.custom_services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom services" ON public.custom_services
    FOR DELETE USING (auth.uid() = user_id);

-- 알림 정책
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 알람 히스토리 정책
CREATE POLICY "Users can view own alarm history" ON public.alarm_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alarm history" ON public.alarm_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alarm history" ON public.alarm_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alarm history" ON public.alarm_history
    FOR DELETE USING (auth.uid() = user_id);

-- 환율 정책 (인증된 사용자만 읽기 가능)
CREATE POLICY "Authenticated users can view exchange rates" ON public.exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exchange rates" ON public.exchange_rates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 13. 자동 타임스탬프 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. 타임스탬프 트리거 생성
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_services_updated_at BEFORE UPDATE ON public.custom_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. 사용자 가입 트리거
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. 샘플 데이터 삽입 (테스트용)
-- INSERT INTO public.exchange_rates (base_currency, target_currency, rate, date) VALUES
-- ('USD', 'KRW', 1350.50, CURRENT_DATE),
-- ('EUR', 'KRW', 1480.25, CURRENT_DATE),
-- ('JPY', 'KRW', 9.15, CURRENT_DATE);

-- =====================================================
-- 실행 완료 메시지
-- =====================================================
SELECT 'Database schema created successfully!' as status;
```

### **2단계: 테스트 쿼리 (선택사항)**

스키마 생성 후 테스트하려면 아래 코드도 실행하세요:

```sql
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

-- 7. 데이터 확인 쿼리들

-- 환율 데이터 확인
SELECT * FROM public.exchange_rates ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- 실행 완료 메시지
-- =====================================================
SELECT 'Test queries ready for execution!' as status;
```

## 🚀 **실행 순서:**

1. **Supabase 대시보드** → **SQL Editor** 접속
2. **1단계 코드** 복사 → 붙여넣기 → **Run** 클릭
3. **성공 메시지** 확인 후 **2단계 코드** 실행 (선택사항)

## ✅ **성공 확인:**

실행 후 `Database schema created successfully!` 메시지가 표시되면 성공입니다! 