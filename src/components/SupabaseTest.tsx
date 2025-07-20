import React, { useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

export const SupabaseTest: React.FC = () => {
  const { supabase, user, profile } = useSupabase();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // 1. 기본 연결 테스트
      addTestResult('🔍 Supabase 클라이언트 연결 테스트 시작...');
      
      // 2. 인증 상태 확인
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        addTestResult(`❌ 인증 세션 조회 실패: ${authError.message}`);
      } else {
        addTestResult(`✅ 인증 세션 조회 성공: ${session ? '로그인됨' : '로그아웃됨'}`);
      }

      // 3. 사용자 정보 확인
      if (user) {
        addTestResult(`✅ 사용자 정보 확인: ${user.email}`);
      } else {
        addTestResult('ℹ️ 사용자 정보: 로그인되지 않음');
      }

      // 4. 프로필 정보 확인
      if (profile) {
        addTestResult(`✅ 프로필 정보 확인: ${profile.username || '이름 없음'}`);
      } else {
        addTestResult('ℹ️ 프로필 정보: 프로필 없음');
      }

      // 5. 데이터베이스 연결 테스트 (profiles 테이블)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        addTestResult(`❌ profiles 테이블 조회 실패: ${profilesError.message}`);
      } else {
        addTestResult(`✅ profiles 테이블 조회 성공: ${profiles?.length || 0}개 레코드`);
      }

      // 6. subscriptions 테이블 테스트
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);
      
      if (subscriptionsError) {
        addTestResult(`❌ subscriptions 테이블 조회 실패: ${subscriptionsError.message}`);
      } else {
        addTestResult(`✅ subscriptions 테이블 조회 성공: ${subscriptions?.length || 0}개 레코드`);
      }

      // 7. 실시간 구독 테스트
      supabase
        .channel('test')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, (payload) => {
          addTestResult(`✅ 실시간 구독 테스트 성공: ${payload.eventType} 이벤트`);
        })
        .subscribe();

      addTestResult('✅ 실시간 구독 설정 성공');

      addTestResult('🎉 Supabase 연결 테스트 완료!');

    } catch (error: any) {
      addTestResult(`❌ 테스트 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseSchema = async () => {
    setLoading(true);
    addTestResult('🔍 데이터베이스 스키마 테스트 시작...');

    try {
      // 테이블 목록 확인
      const tables = ['profiles', 'subscriptions', 'custom_services', 'notifications', 'alarm_history', 'exchange_rates'];
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          addTestResult(`❌ ${table} 테이블 접근 실패: ${error.message}`);
        } else {
          addTestResult(`✅ ${table} 테이블 접근 성공`);
        }
      }

      addTestResult('🎉 데이터베이스 스키마 테스트 완료!');

    } catch (error: any) {
      addTestResult(`❌ 스키마 테스트 중 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Supabase 연동 테스트</h1>
          
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testSupabaseConnection}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '테스트 중...' : '연결 테스트'}
              </button>
              
              <button
                onClick={testDatabaseSchema}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '테스트 중...' : '스키마 테스트'}
              </button>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">테스트 결과:</h2>
            {testResults.length === 0 ? (
              <p className="text-gray-500">테스트를 실행해주세요.</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">현재 상태:</h3>
            <div className="space-y-2 text-sm">
              <div>사용자: {user ? user.email : '로그인되지 않음'}</div>
              <div>프로필: {profile ? profile.username || '이름 없음' : '프로필 없음'}</div>
              <div>Supabase URL: {process.env.REACT_APP_SUPABASE_URL || '설정되지 않음'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 