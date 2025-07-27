# =============================================================================
# Environment Variable Configuration and Validation
# 환경변수 설정 및 유효성 검증
# =============================================================================

// =============================================================================
// Required Environment Variables (필수 환경변수)
// =============================================================================
const requiredEnvVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_GOOGLE_CLIENT_ID'
] as const;

// =============================================================================
// Optional Environment Variables (선택적 환경변수)
// =============================================================================
const optionalEnvVars = [
  'REACT_APP_GOOGLE_CLIENT_SECRET',
  'REACT_APP_EXCHANGE_RATE_API_KEY',
  'REACT_APP_SITE_URL',
  'REACT_APP_APP_NAME',
  'REACT_APP_SUPABASE_AUTH_REDIRECT_URL',
  'REACT_APP_ENV'
] as const;

// =============================================================================
// Validation Functions (유효성 검증 함수)
// =============================================================================
function validateEnvVar(varName: string, value: string | undefined, isRequired: boolean = true): void {
  if (isRequired && !value) {
    throw new Error(`❌ 필수 환경변수가 누락되었습니다: ${varName}`);
  }
  
  if (value && value.includes('your_') && value.includes('_key')) {
    console.warn(`⚠️  환경변수 ${varName}이 플레이스홀더 값으로 설정되어 있습니다: ${value}`);
  }
}

// Validate all environment variables
requiredEnvVars.forEach(varName => {
  validateEnvVar(varName, process.env[varName], true);
});

optionalEnvVars.forEach(varName => {
  validateEnvVar(varName, process.env[varName], false);
});

// =============================================================================
// Environment Configuration Export (환경설정 내보내기)
// =============================================================================
export const config = {
  // =============================================================================
  // Environment Settings (환경 설정)
  // =============================================================================
  environment: process.env.NODE_ENV || 'development',
  appEnvironment: process.env.REACT_APP_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // =============================================================================
  // Supabase Configuration (Supabase 설정)
  // =============================================================================
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL!,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY!,
  supabaseAuthRedirectUrl: process.env.REACT_APP_SUPABASE_AUTH_REDIRECT_URL || 
    `${process.env.REACT_APP_SITE_URL || 'https://subscription.moonwave.kr'}/#/auth/callback`,
  
  // =============================================================================
  // Google OAuth Configuration (Google OAuth 설정)
  // =============================================================================
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  
  // =============================================================================
  // Site Configuration (사이트 설정)
  // =============================================================================
  siteUrl: process.env.REACT_APP_SITE_URL || 'https://subscription.moonwave.kr',
  appName: process.env.REACT_APP_APP_NAME || '구독관리',
  
  // =============================================================================
  // External API Keys (외부 API 키)
  // =============================================================================
  exchangeRateApiKey: process.env.REACT_APP_EXCHANGE_RATE_API_KEY,
} as const;

// =============================================================================
// Advanced Validation (고급 유효성 검증)
// =============================================================================

// Supabase URL validation
if (!config.supabaseUrl.startsWith('https://')) {
  throw new Error('❌ REACT_APP_SUPABASE_URL은 유효한 HTTPS URL이어야 합니다');
}

// Supabase anon key validation
if (config.supabaseAnonKey.length < 50) {
  throw new Error('❌ REACT_APP_SUPABASE_ANON_KEY이 유효하지 않습니다 (너무 짧음)');
}

// Google Client ID validation
if (!config.googleClientId.includes('.apps.googleusercontent.com')) {
  throw new Error('❌ REACT_APP_GOOGLE_CLIENT_ID이 유효한 Google OAuth Client ID 형식이 아닙니다');
}

// Production environment validation
if (config.isProduction && !config.siteUrl.startsWith('https://')) {
  throw new Error('❌ 프로덕션 환경에서는 REACT_APP_SITE_URL이 HTTPS여야 합니다');
}

// =============================================================================
// Development Logging (개발환경 로깅)
// =============================================================================
if (config.isDevelopment) {
  console.log('🔧 개발 환경 설정:', {
    environment: config.environment,
    appEnvironment: config.appEnvironment,
    siteUrl: config.siteUrl,
    supabaseUrl: config.supabaseUrl.substring(0, 30) + '...',
    googleClientId: config.googleClientId.substring(0, 20) + '...',
    hasExchangeRateApiKey: !!config.exchangeRateApiKey
  });
}

export default config;