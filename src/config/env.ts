const requiredEnvVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY'
] as const;

// Validate required environment variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

export const config = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL!,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY!,
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// Additional validation for Supabase URL format
if (!config.supabaseUrl.startsWith('https://')) {
  throw new Error('REACT_APP_SUPABASE_URL must be a valid HTTPS URL');
}

// Validate Supabase anon key format (should be a long string)
if (config.supabaseAnonKey.length < 50) {
  throw new Error('REACT_APP_SUPABASE_ANON_KEY appears to be invalid');
}

export default config;