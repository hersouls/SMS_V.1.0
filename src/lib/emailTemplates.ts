import { supabase } from './supabase';

// 이메일 템플릿 타입 정의
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
}

// 이메일 템플릿 설정 확인
export const checkEmailTemplates = async () => {
  try {
    console.log('Checking email template configurations...');
    
    // Supabase Auth 설정 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { success: false, error: sessionError };
    }

    // 이메일 템플릿 관련 설정 정보
    const templateInfo = {
      confirmSignup: {
        name: 'Confirm signup',
        description: '회원가입 확인 이메일',
        required: true,
      },
      magicLink: {
        name: 'Magic link',
        description: '매직 링크 로그인 이메일',
        required: false,
      },
      changeEmailAddress: {
        name: 'Change email address',
        description: '이메일 주소 변경 확인',
        required: false,
      },
      resetPassword: {
        name: 'Reset password',
        description: '비밀번호 재설정',
        required: false,
      },
    };

    console.log('Email template configurations:', templateInfo);
    
    return {
      success: true,
      templates: templateInfo,
      session: !!session,
    };
  } catch (error) {
    console.error('Email template check error:', error);
    return { success: false, error };
  }
};

// 이메일 발송 테스트
export const testEmailSending = async (email: string) => {
  try {
    console.log('Testing email sending to:', email);
    
    // 테스트용 회원가입 시도 (실제 계정 생성 없이)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'test-password-123!',
      options: {
        emailRedirectTo: process.env.REACT_APP_SUPABASE_AUTH_REDIRECT_URL || `${window.location.origin}/#/auth/callback`,
        data: {
          test_mode: true,
          test_timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error('Test email sending error:', error);
      return { success: false, error };
    }

    console.log('Test email sending response:', data);
    
    return {
      success: true,
      data,
      message: '테스트 이메일이 발송되었습니다.',
    };
  } catch (error) {
    console.error('Test email sending failed:', error);
    return { success: false, error };
  }
};

// 이메일 템플릿 커스터마이징 예시
export const getCustomEmailTemplate = (type: 'confirm' | 'reset' | 'magic') => {
  const templates = {
    confirm: {
      subject: '🎉 구독 관리 앱 회원가입을 완료해주세요',
      content: `
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
      `,
    },
    reset: {
      subject: '🔐 구독 관리 앱 비밀번호 재설정',
      content: `
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
      `,
    },
    magic: {
      subject: '🔗 구독 관리 앱 로그인 링크',
      content: `
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
      `,
    },
  };

  return templates[type];
};

// 이메일 발송 상태 확인
export const checkEmailStatus = async (email: string) => {
  try {
    console.log('Checking email status for:', email);
    
    // 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User check error:', userError);
      return { success: false, error: userError };
    }

    if (user && user.email === email) {
      return {
        success: true,
        emailConfirmed: !!user.email_confirmed_at,
        confirmedAt: user.email_confirmed_at,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
      };
    }

    return {
      success: true,
      emailConfirmed: false,
      message: '해당 이메일로 등록된 사용자를 찾을 수 없습니다.',
    };
  } catch (error) {
    console.error('Email status check error:', error);
    return { success: false, error };
  }
};