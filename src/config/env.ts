// Environment variable validation and configuration
const requiredEnvVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'REACT_APP_GOOGLE_CLIENT_ID'
] as const;

const optionalEnvVars = [
  'REACT_APP_GOOGLE_CLIENT_SECRET',
  'REACT_APP_EXCHANGE_RATE_API_KEY',
  'REACT_APP_SITE_URL',
  'REACT_APP_APP_NAME',
  'REACT_APP_SUPABASE_AUTH_REDIRECT_URL'
] as const;

// Validation function for environment variables
function validateEnvVar(varName: string, value: string | undefined, isRequired: boolean = true): void {
  if (isRequired && !value) {
    throw new Error(`❌ 필수 환경변수가 누락되었습니다: ${varName}`);
  }
  
  if (value && value.includes('your_') && value.includes('_key')) {
    console.warn(`⚠️  환경변수 ${varName}이 플레이스홀더 값으로 설정되어 있습니다: ${value}`);
  }
}

// Validate required environment variables
requiredEnvVars.forEach(varName => {
  validateEnvVar(varName, process.env[varName], true);
});

// Validate optional environment variables
optionalEnvVars.forEach(varName => {
  validateEnvVar(varName, process.env[varName], false);
});

export const config = {
  // Supabase Configuration
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL!,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY!,
  
  // Google OAuth Configuration
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  
  // Site Configuration
  siteUrl: process.env.REACT_APP_SITE_URL || 'https://travel.moonwave.kr',
  appName: process.env.REACT_APP_APP_NAME || '구독 관리 앱',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // API Keys
  exchangeRateApiKey: process.env.REACT_APP_EXCHANGE_RATE_API_KEY,
  
  // Auth Configuration
  supabaseAuthRedirectUrl: process.env.REACT_APP_SUPABASE_AUTH_REDIRECT_URL || `${process.env.REACT_APP_SITE_URL || 'https://travel.moonwave.kr'}/auth/callback`,
} as const;

// Additional validation for Supabase URL format
if (!config.supabaseUrl.startsWith('https://')) {
  throw new Error('❌ REACT_APP_SUPABASE_URL은 유효한 HTTPS URL이어야 합니다');
}

// Validate Supabase anon key format (should be a long string)
if (config.supabaseAnonKey.length < 50) {
  throw new Error('❌ REACT_APP_SUPABASE_ANON_KEY이 유효하지 않습니다 (너무 짧음)');
}

// Validate Google Client ID format
if (!config.googleClientId.includes('.apps.googleusercontent.com')) {
  throw new Error('❌ REACT_APP_GOOGLE_CLIENT_ID이 유효한 Google OAuth Client ID 형식이 아닙니다');
}

// Environment-specific validations
if (config.isDevelopment) {
  console.log('🔧 개발 환경 설정:', {
    siteUrl: config.siteUrl,
    environment: config.environment,
    supabaseUrl: config.supabaseUrl.substring(0, 30) + '...',
    googleClientId: config.googleClientId.substring(0, 20) + '...'
  });
}

if (config.isProduction) {
  if (!config.siteUrl.startsWith('https://')) {
    throw new Error('❌ 프로덕션 환경에서는 REACT_APP_SITE_URL이 HTTPS여야 합니다');
  }
}

export default config;