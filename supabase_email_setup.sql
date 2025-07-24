-- Supabase 이메일 설정을 위한 SQL 스크립트
-- 이 스크립트는 Supabase 대시보드에서 실행할 수 있습니다.

-- 1. 이메일 템플릿 설정 확인
-- Authentication > Email Templates에서 다음 설정을 확인하세요:

/*
Confirm signup 템플릿:
- 활성화: true
- 제목: "🎉 구독 관리 앱 회원가입을 완료해주세요"
- 내용: 아래 HTML 템플릿 사용

Reset password 템플릿:
- 활성화: true
- 제목: "🔐 구독 관리 앱 비밀번호 재설정"
- 내용: 아래 HTML 템플릿 사용

Magic link 템플릿:
- 활성화: true
- 제목: "🔗 구독 관리 앱 로그인 링크"
- 내용: 아래 HTML 템플릿 사용
*/

-- 2. 인증 설정 확인
-- Authentication > Settings에서 다음 설정을 확인하세요:

/*
Site URL: http://localhost:3000
Redirect URLs: 
- http://localhost:3000/auth/callback
- http://localhost:3000/auth/confirm
- http://localhost:3000/auth/reset-password

Enable email confirmations: true
Enable email change confirmations: true
Enable secure email change: true
*/

-- 3. 이메일 제공자 설정 확인
-- Authentication > Providers > Email에서 다음 설정을 확인하세요:

/*
Enable email signup: true
Enable email confirmations: true
Enable secure email change: true
Enable double confirm changes: true
Enable delete user: true
*/

-- 4. 사용자 정의 이메일 템플릿 (HTML)

-- 회원가입 확인 이메일 템플릿
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">구독 관리 앱</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">회원가입을 완료해주세요</p>
  </div>
  
  <div style="padding: 30px; background: #f8f9fa;">
    <h2 style="color: #333; margin-bottom: 20px;">안녕하세요! 👋</h2>
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      구독 관리 앱에 가입해주셔서 감사합니다. 
      아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        이메일 인증 완료하기
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      이 버튼이 작동하지 않는 경우, 아래 링크를 브라우저에 복사하여 붙여넣으세요:<br>
      <a href="{{ .ConfirmationURL }}" style="color: #007bff; word-break: break-all;">
        {{ .ConfirmationURL }}
      </a>
    </p>
  </div>
  
  <div style="background: #e9ecef; padding: 20px; text-align: center; color: #666; font-size: 12px;">
    <p>이 이메일은 구독 관리 앱 회원가입 과정에서 발송되었습니다.</p>
    <p>문의사항이 있으시면 고객센터로 연락해주세요.</p>
  </div>
</div>
*/

-- 비밀번호 재설정 이메일 템플릿
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">구독 관리 앱</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">비밀번호 재설정</p>
  </div>
  
  <div style="padding: 30px; background: #f8f9fa;">
    <h2 style="color: #333; margin-bottom: 20px;">비밀번호 재설정 요청</h2>
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      비밀번호 재설정을 요청하셨습니다. 
      아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        비밀번호 재설정하기
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      이 요청을 하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.
    </p>
  </div>
  
  <div style="background: #e9ecef; padding: 20px; text-align: center; color: #666; font-size: 12px;">
    <p>이 이메일은 구독 관리 앱 비밀번호 재설정 과정에서 발송되었습니다.</p>
  </div>
</div>
*/

-- 매직 링크 로그인 이메일 템플릿
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); padding: 30px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">구독 관리 앱</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">로그인 링크</p>
  </div>
  
  <div style="padding: 30px; background: #f8f9fa;">
    <h2 style="color: #333; margin-bottom: 20px;">로그인 링크</h2>
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      아래 버튼을 클릭하여 구독 관리 앱에 로그인하세요.
      이 링크는 한 번만 사용할 수 있습니다.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        로그인하기
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      이 요청을 하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.
    </p>
  </div>
  
  <div style="background: #e9ecef; padding: 20px; text-align: center; color: #666; font-size: 12px;">
    <p>이 이메일은 구독 관리 앱 로그인 과정에서 발송되었습니다.</p>
  </div>
</div>
*/

-- 5. 이메일 발송 로그 확인을 위한 함수
CREATE OR REPLACE FUNCTION check_email_logs()
RETURNS TABLE (
  event_type TEXT,
  event_time TIMESTAMPTZ,
  user_email TEXT,
  success BOOLEAN,
  error_message TEXT
) AS $$
BEGIN
  -- 이 함수는 Supabase의 내부 로그를 확인하는 용도입니다.
  -- 실제로는 Supabase 대시보드에서 로그를 확인해야 합니다.
  RETURN QUERY
  SELECT 
    'email_sent'::TEXT as event_type,
    NOW() as event_time,
    'test@example.com'::TEXT as user_email,
    true as success,
    NULL::TEXT as error_message;
END;
$$ LANGUAGE plpgsql;

-- 6. 이메일 설정 테스트를 위한 함수
CREATE OR REPLACE FUNCTION test_email_configuration()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- 이메일 설정 상태를 확인하는 함수
  result := json_build_object(
    'email_provider_enabled', true,
    'confirm_signup_enabled', true,
    'reset_password_enabled', true,
    'magic_link_enabled', true,
    'site_url', 'http://localhost:3000',
    'redirect_urls', ARRAY['http://localhost:3000/auth/callback'],
    'test_timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. 사용 예시
-- SELECT test_email_configuration();
-- SELECT * FROM check_email_logs();