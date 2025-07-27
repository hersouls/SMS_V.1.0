import { config } from '../config/env';

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    supabase: {
      url: boolean;
      key: boolean;
    };
    google: {
      clientId: boolean;
      clientSecret: boolean;
    };
    site: {
      url: boolean;
      redirectUrl: boolean;
    };
    api: {
      exchangeRate: boolean;
    };
  };
}

export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    details: {
      supabase: { url: false, key: false },
      google: { clientId: false, clientSecret: false },
      site: { url: false, redirectUrl: false },
      api: { exchangeRate: false }
    }
  };

  // Supabase URL 검증
  try {
    if (config.supabaseUrl && config.supabaseUrl.startsWith('https://')) {
      result.details.supabase.url = true;
    } else {
      result.errors.push('Supabase URL이 유효하지 않습니다');
      result.isValid = false;
    }
  } catch (error) {
    result.errors.push('Supabase URL 검증 중 오류 발생');
    result.isValid = false;
  }

  // Supabase Key 검증
  try {
    if (config.supabaseAnonKey && config.supabaseAnonKey.length >= 50) {
      result.details.supabase.key = true;
    } else {
      result.errors.push('Supabase Anon Key가 유효하지 않습니다');
      result.isValid = false;
    }
  } catch (error) {
    result.errors.push('Supabase Key 검증 중 오류 발생');
    result.isValid = false;
  }

  // Google Client ID 검증
  try {
    if (config.googleClientId && config.googleClientId.includes('.apps.googleusercontent.com')) {
      result.details.google.clientId = true;
    } else {
      result.errors.push('Google Client ID가 유효하지 않습니다');
      result.isValid = false;
    }
  } catch (error) {
    result.errors.push('Google Client ID 검증 중 오류 발생');
    result.isValid = false;
  }

  // Google Client Secret 검증 (선택사항)
  if (config.googleClientSecret) {
    if (config.googleClientSecret === 'your_google_client_secret') {
      result.warnings.push('Google Client Secret가 플레이스홀더 값으로 설정되어 있습니다');
    } else {
      result.details.google.clientSecret = true;
    }
  } else {
    result.warnings.push('Google Client Secret가 설정되지 않았습니다 (선택사항)');
  }

  // Site URL 검증
  try {
    if (config.siteUrl) {
      const url = new URL(config.siteUrl);
      if (config.isProduction && url.protocol !== 'https:') {
        result.errors.push('프로덕션 환경에서는 HTTPS URL이 필요합니다');
        result.isValid = false;
      } else {
        result.details.site.url = true;
      }
    } else {
      result.warnings.push('Site URL이 설정되지 않았습니다');
    }
  } catch (error) {
    result.errors.push('Site URL이 유효하지 않습니다');
    result.isValid = false;
  }

  // Auth Redirect URL 검증
  try {
    if (config.supabaseAuthRedirectUrl) {
      const url = new URL(config.supabaseAuthRedirectUrl);
      result.details.site.redirectUrl = true;
    } else {
      result.warnings.push('Auth Redirect URL이 설정되지 않았습니다');
    }
  } catch (error) {
    result.errors.push('Auth Redirect URL이 유효하지 않습니다');
    result.isValid = false;
  }

  // Exchange Rate API Key 검증 (선택사항)
  if (config.exchangeRateApiKey) {
    if (config.exchangeRateApiKey === 'your_exchange_rate_api_key') {
      result.warnings.push('Exchange Rate API Key가 플레이스홀더 값으로 설정되어 있습니다');
    } else {
      result.details.api.exchangeRate = true;
    }
  } else {
    result.warnings.push('Exchange Rate API Key가 설정되지 않았습니다 (선택사항)');
  }

  return result;
}

export function getEnvironmentSummary(): string {
  const validation = validateEnvironment();
  
  let summary = `🔧 환경 설정 요약\n`;
  summary += `환경: ${config.environment}\n`;
  summary += `Site URL: ${config.siteUrl}\n`;
  summary += `상태: ${validation.isValid ? '✅ 정상' : '❌ 오류'}\n`;
  
  if (validation.errors.length > 0) {
    summary += `\n❌ 오류:\n${validation.errors.map(err => `  - ${err}`).join('\n')}\n`;
  }
  
  if (validation.warnings.length > 0) {
    summary += `\n⚠️  경고:\n${validation.warnings.map(warn => `  - ${warn}`).join('\n')}\n`;
  }
  
  return summary;
}

export function logEnvironmentStatus(): void {
  console.log(getEnvironmentSummary());
}