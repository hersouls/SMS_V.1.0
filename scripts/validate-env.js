#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 환경변수 유효성 검증 스크립트
 * 
 * This script validates that all required environment variables are properly set
 * and checks for common configuration issues.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

function validateEnvStructure() {
  log('\n🔍 환경변수 파일 구조 검증 중...', 'cyan');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    log('❌ .env 파일이 존재하지 않습니다', 'red');
    log('💡 .env.example을 복사하여 .env 파일을 생성하세요:', 'yellow');
    log('   cp .env.example .env', 'yellow');
    return false;
  } else {
    log('✅ .env 파일이 존재합니다', 'green');
  }
  
  // Check if .env.example file exists
  if (!fs.existsSync(envExamplePath)) {
    log('⚠️  .env.example 파일이 존재하지 않습니다', 'yellow');
  } else {
    log('✅ .env.example 파일이 존재합니다', 'green');
  }
  
  return true;
}

function validateRequiredVariables() {
  log('\n🔍 필수 환경변수 검증 중...', 'cyan');
  
  const requiredVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_GOOGLE_CLIENT_ID'
  ];
  
  const env = loadEnvFile(path.join(process.cwd(), '.env'));
  if (!env) {
    log('❌ .env 파일을 읽을 수 없습니다', 'red');
    return false;
  }
  
  let allRequired = true;
  
  requiredVars.forEach(varName => {
    if (!env[varName]) {
      log(`❌ 필수 환경변수가 누락되었습니다: ${varName}`, 'red');
      allRequired = false;
    } else if (env[varName].includes('your_') || env[varName].includes('_key')) {
      log(`⚠️  환경변수가 플레이스홀더 값입니다: ${varName}`, 'yellow');
      allRequired = false;
    } else {
      log(`✅ ${varName}: 설정됨`, 'green');
    }
  });
  
  return allRequired;
}

function validateFormatting() {
  log('\n🔍 환경변수 형식 검증 중...', 'cyan');
  
  const env = loadEnvFile(path.join(process.cwd(), '.env'));
  if (!env) return false;
  
  let allValid = true;
  
  // Validate Supabase URL
  if (env.REACT_APP_SUPABASE_URL) {
    if (!env.REACT_APP_SUPABASE_URL.startsWith('https://')) {
      log('❌ REACT_APP_SUPABASE_URL은 https://로 시작해야 합니다', 'red');
      allValid = false;
    } else if (!env.REACT_APP_SUPABASE_URL.includes('.supabase.co')) {
      log('⚠️  REACT_APP_SUPABASE_URL이 표준 Supabase URL 형식이 아닙니다', 'yellow');
    } else {
      log('✅ REACT_APP_SUPABASE_URL: 형식이 올바릅니다', 'green');
    }
  }
  
  // Validate Supabase Anon Key
  if (env.REACT_APP_SUPABASE_ANON_KEY) {
    if (env.REACT_APP_SUPABASE_ANON_KEY.length < 50) {
      log('❌ REACT_APP_SUPABASE_ANON_KEY가 너무 짧습니다', 'red');
      allValid = false;
    } else {
      log('✅ REACT_APP_SUPABASE_ANON_KEY: 길이가 적절합니다', 'green');
    }
  }
  
  // Validate Google Client ID
  if (env.REACT_APP_GOOGLE_CLIENT_ID) {
    if (!env.REACT_APP_GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
      log('❌ REACT_APP_GOOGLE_CLIENT_ID 형식이 올바르지 않습니다', 'red');
      allValid = false;
    } else {
      log('✅ REACT_APP_GOOGLE_CLIENT_ID: 형식이 올바릅니다', 'green');
    }
  }
  
  // Validate Site URL (if set)
  if (env.REACT_APP_SITE_URL) {
    if (!env.REACT_APP_SITE_URL.startsWith('http')) {
      log('❌ REACT_APP_SITE_URL은 http:// 또는 https://로 시작해야 합니다', 'red');
      allValid = false;
    } else {
      log('✅ REACT_APP_SITE_URL: 형식이 올바릅니다', 'green');
    }
  }
  
  return allValid;
}

function checkConsistency() {
  log('\n🔍 환경변수 일관성 검증 중...', 'cyan');
  
  const env = loadEnvFile(path.join(process.cwd(), '.env'));
  const envExample = loadEnvFile(path.join(process.cwd(), '.env.example'));
  
  if (!env || !envExample) {
    log('⚠️  일관성 검증을 위한 파일을 읽을 수 없습니다', 'yellow');
    return true;
  }
  
  let consistent = true;
  
  // Check if all variables in .env.example exist in .env
  Object.keys(envExample).forEach(key => {
    if (!env.hasOwnProperty(key)) {
      log(`⚠️  .env.example에 있는 ${key}가 .env에 없습니다`, 'yellow');
      consistent = false;
    }
  });
  
  // Check for extra variables in .env that aren't in .env.example
  Object.keys(env).forEach(key => {
    if (!envExample.hasOwnProperty(key)) {
      log(`ℹ️  .env에 추가 변수가 있습니다: ${key}`, 'blue');
    }
  });
  
  if (consistent) {
    log('✅ 환경변수 파일들이 일관성 있게 구성되어 있습니다', 'green');
  }
  
  return consistent;
}

function generateReport(structureValid, requiredValid, formatValid, consistencyValid) {
  log('\n📊 검증 결과 요약', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const results = [
    { name: '파일 구조', status: structureValid },
    { name: '필수 변수', status: requiredValid },
    { name: '형식 검증', status: formatValid },
    { name: '일관성 검증', status: consistencyValid }
  ];
  
  results.forEach(result => {
    const status = result.status ? '✅ 통과' : '❌ 실패';
    const color = result.status ? 'green' : 'red';
    log(`${result.name}: ${status}`, color);
  });
  
  const overallStatus = results.every(r => r.status);
  log('='.repeat(50), 'magenta');
  
  if (overallStatus) {
    log('🎉 모든 환경변수 검증이 완료되었습니다!', 'green');
    log('프로젝트를 시작할 준비가 되었습니다.', 'green');
  } else {
    log('⚠️  일부 검증에 실패했습니다.', 'yellow');
    log('위의 오류들을 수정한 후 다시 실행해주세요.', 'yellow');
  }
  
  return overallStatus;
}

function main() {
  log('🚀 환경변수 검증 스크립트 시작', 'bright');
  log('='.repeat(50), 'cyan');
  
  const structureValid = validateEnvStructure();
  const requiredValid = validateRequiredVariables();
  const formatValid = validateFormatting();
  const consistencyValid = checkConsistency();
  
  const overall = generateReport(structureValid, requiredValid, formatValid, consistencyValid);
  
  process.exit(overall ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  validateEnvStructure,
  validateRequiredVariables,
  validateFormatting,
  checkConsistency
};