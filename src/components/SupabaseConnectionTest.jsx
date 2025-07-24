import React, { useState, useEffect } from 'react';

const SupabaseConnectionTest = () => {
  const [testResults, setTestResults] = useState({
    environmentVariables: null,
    supabaseClient: null,
    databaseConnection: null,
    authSystem: null
  });
  const [loading, setLoading] = useState(false);

  const runConnectionTest = async () => {
    setLoading(true);
    const results = { ...testResults };

    try {
      // 1. 환경변수 테스트
      console.log('=== 1. 환경변수 테스트 ===');
      const hasUrl = !!process.env.REACT_APP_SUPABASE_URL;
      const hasKey = !!process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      results.environmentVariables = {
        status: hasUrl && hasKey ? 'success' : 'fail',
        details: {
          hasUrl,
          hasKey,
          url: hasUrl ? process.env.REACT_APP_SUPABASE_URL : 'Missing',
          keyLength: hasKey ? process.env.REACT_APP_SUPABASE_ANON_KEY.length : 0
        }
      };
      
      console.log('환경변수 결과:', results.environmentVariables);

      // 2. Supabase 클라이언트 테스트
      console.log('=== 2. Supabase 클라이언트 테스트 ===');
      try {
        // 동적 import로 supabase 모듈 가져오기
        const { supabase } = await import('../lib/supabase');
        
        results.supabaseClient = {
          status: 'success',
          details: {
            clientExists: !!supabase,
            authExists: !!supabase?.auth,
            fromExists: !!supabase?.from
          }
        };

        console.log('Supabase 클라이언트 결과:', results.supabaseClient);

        // 3. 데이터베이스 연결 테스트
        console.log('=== 3. 데이터베이스 연결 테스트 ===');
        try {
          const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          results.databaseConnection = {
            status: error ? 'fail' : 'success',
            details: {
              error: error?.message || null,
              canQuery: !error,
              profilesTableExists: !error || !error.message?.includes('does not exist')
            }
          };

          console.log('데이터베이스 연결 결과:', results.databaseConnection);
        } catch (dbError) {
          results.databaseConnection = {
            status: 'fail',
            details: { error: dbError.message }
          };
        }

        // 4. 인증 시스템 테스트
        console.log('=== 4. 인증 시스템 테스트 ===');
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          results.authSystem = {
            status: sessionError ? 'fail' : 'success',
            details: {
              error: sessionError?.message || null,
              hasSession: !!sessionData?.session,
              userId: sessionData?.session?.user?.id || null,
              authWorking: !sessionError
            }
          };

          console.log('인증 시스템 결과:', results.authSystem);
        } catch (authError) {
          results.authSystem = {
            status: 'fail',
            details: { error: authError.message }
          };
        }

      } catch (importError) {
        results.supabaseClient = {
          status: 'fail',
          details: { error: `모듈 로딩 실패: ${importError.message}` }
        };
        
        results.databaseConnection = { status: 'skip', details: { reason: 'Supabase 클라이언트 로딩 실패' } };
        results.authSystem = { status: 'skip', details: { reason: 'Supabase 클라이언트 로딩 실패' } };
      }

    } catch (error) {
      console.error('전체 테스트 실패:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'fail': return 'text-red-600 bg-red-100';
      case 'skip': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'fail': return '❌';
      case 'skip': return '⏭️';
      default: return '⏳';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🔧 Supabase 연결 진단 도구
        </h1>
        <p className="text-gray-600">
          Step-by-Step으로 Supabase 연결 상태를 확인합니다
        </p>
      </div>

      <div className="text-center mb-6">
        <button
          onClick={runConnectionTest}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? '🔍 테스트 진행 중...' : '🚀 연결 테스트 시작'}
        </button>
      </div>

      {Object.keys(testResults).some(key => testResults[key]) && (
        <div className="space-y-4">
          {/* 환경변수 테스트 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">🔧</span>
              1. 환경변수 설정
              {testResults.environmentVariables && (
                <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(testResults.environmentVariables.status)}`}>
                  {getStatusIcon(testResults.environmentVariables.status)} {testResults.environmentVariables.status}
                </span>
              )}
            </h3>
            {testResults.environmentVariables && (
              <div className="text-sm space-y-1">
                <div>SUPABASE_URL 존재: {testResults.environmentVariables.details.hasUrl ? '✅' : '❌'}</div>
                <div>ANON_KEY 존재: {testResults.environmentVariables.details.hasKey ? '✅' : '❌'}</div>
                {testResults.environmentVariables.details.hasUrl && (
                  <div className="text-gray-600">URL: {testResults.environmentVariables.details.url}</div>
                )}
                {testResults.environmentVariables.details.hasKey && (
                  <div className="text-gray-600">Key 길이: {testResults.environmentVariables.details.keyLength} 문자</div>
                )}
              </div>
            )}
          </div>

          {/* Supabase 클라이언트 테스트 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">📡</span>
              2. Supabase 클라이언트
              {testResults.supabaseClient && (
                <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(testResults.supabaseClient.status)}`}>
                  {getStatusIcon(testResults.supabaseClient.status)} {testResults.supabaseClient.status}
                </span>
              )}
            </h3>
            {testResults.supabaseClient && (
              <div className="text-sm space-y-1">
                {testResults.supabaseClient.status === 'success' ? (
                  <>
                    <div>클라이언트 객체: {testResults.supabaseClient.details.clientExists ? '✅' : '❌'}</div>
                    <div>Auth 모듈: {testResults.supabaseClient.details.authExists ? '✅' : '❌'}</div>
                    <div>Query 모듈: {testResults.supabaseClient.details.fromExists ? '✅' : '❌'}</div>
                  </>
                ) : (
                  <div className="text-red-600">오류: {testResults.supabaseClient.details.error}</div>
                )}
              </div>
            )}
          </div>

          {/* 데이터베이스 연결 테스트 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">🗄️</span>
              3. 데이터베이스 연결
              {testResults.databaseConnection && (
                <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(testResults.databaseConnection.status)}`}>
                  {getStatusIcon(testResults.databaseConnection.status)} {testResults.databaseConnection.status}
                </span>
              )}
            </h3>
            {testResults.databaseConnection && (
              <div className="text-sm space-y-1">
                {testResults.databaseConnection.status === 'success' ? (
                  <>
                    <div>쿼리 실행: {testResults.databaseConnection.details.canQuery ? '✅' : '❌'}</div>
                    <div>profiles 테이블: {testResults.databaseConnection.details.profilesTableExists ? '✅' : '❌'}</div>
                  </>
                ) : testResults.databaseConnection.status === 'fail' ? (
                  <div className="text-red-600">오류: {testResults.databaseConnection.details.error}</div>
                ) : (
                  <div className="text-yellow-600">건너뜀: {testResults.databaseConnection.details.reason}</div>
                )}
              </div>
            )}
          </div>

          {/* 인증 시스템 테스트 */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">🔐</span>
              4. 인증 시스템
              {testResults.authSystem && (
                <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(testResults.authSystem.status)}`}>
                  {getStatusIcon(testResults.authSystem.status)} {testResults.authSystem.status}
                </span>
              )}
            </h3>
            {testResults.authSystem && (
              <div className="text-sm space-y-1">
                {testResults.authSystem.status === 'success' ? (
                  <>
                    <div>인증 모듈: {testResults.authSystem.details.authWorking ? '✅' : '❌'}</div>
                    <div>세션 상태: {testResults.authSystem.details.hasSession ? '로그인됨' : '로그인 안됨 (정상)'}</div>
                    {testResults.authSystem.details.userId && (
                      <div className="text-gray-600">사용자 ID: {testResults.authSystem.details.userId}</div>
                    )}
                  </>
                ) : testResults.authSystem.status === 'fail' ? (
                  <div className="text-red-600">오류: {testResults.authSystem.details.error}</div>
                ) : (
                  <div className="text-yellow-600">건너뜀: {testResults.authSystem.details.reason}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">📋 다음 단계 안내</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>✅ 모든 테스트 성공 → Google OAuth 설정 검증으로 진행</div>
          <div>❌ 환경변수 실패 → .env 파일 재확인 및 서버 재시작</div>
          <div>❌ 클라이언트 실패 → src/lib/supabase.ts 파일 확인</div>
          <div>❌ 데이터베이스 실패 → Supabase 프로젝트 상태 확인</div>
          <div>❌ 인증 실패 → Supabase Auth 설정 확인</div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionTest;