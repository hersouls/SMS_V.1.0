import React, { useState } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { AlertTriangle, RefreshCw, Database, Shield, Wifi, User } from 'lucide-react';

interface EmergencyTroubleshooterProps {
  isVisible: boolean;
  onClose: () => void;
}

export const EmergencyTroubleshooter: React.FC<EmergencyTroubleshooterProps> = ({
  isVisible,
  onClose
}) => {
  const { user, supabase } = useSupabase();
  const [currentStep, setCurrentStep] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // 상황 1: 완전히 화면이 나오지 않는 경우
  const handleScreenNotLoading = async () => {
    setIsRunning(true);
    setCurrentStep('화면 로딩 문제 진단 중...');
    clearResults();

    try {
      // 1. 환경 변수 확인
      addResult('🔍 환경 변수 확인 중...');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        addResult('❌ 환경 변수가 설정되지 않았습니다.');
        addResult('💡 .env.local 파일을 확인해주세요.');
        return;
      }
      addResult('✅ 환경 변수 확인 완료');

      // 2. 네트워크 연결 확인
      addResult('🔍 네트워크 연결 확인 중...');
      if (!navigator.onLine) {
        addResult('❌ 네트워크 연결이 없습니다.');
        addResult('💡 인터넷 연결을 확인해주세요.');
        return;
      }
      addResult('✅ 네트워크 연결 확인 완료');

      // 3. Supabase 연결 테스트
      addResult('🔍 Supabase 연결 테스트 중...');
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        addResult(`❌ Supabase 연결 실패: ${error.message}`);
        addResult('💡 Supabase 프로젝트 상태를 확인해주세요.');
        return;
      }
      addResult('✅ Supabase 연결 확인 완료');

      // 4. 브라우저 캐시 삭제 제안
      addResult('💡 브라우저 캐시를 삭제해보세요.');
      addResult('💡 다른 브라우저에서 테스트해보세요.');

    } catch (error) {
      addResult(`❌ 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  // 상황 2: 로그인은 되지만 데이터가 없는 경우
  const handleNoDataAfterLogin = async () => {
    setIsRunning(true);
    setCurrentStep('데이터 로딩 문제 진단 중...');
    clearResults();

    try {
      if (!user) {
        addResult('❌ 사용자가 로그인되어 있지 않습니다.');
        return;
      }

      // 1. 프로필 확인
      addResult('🔍 프로필 확인 중...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          addResult('❌ 프로필이 존재하지 않습니다.');
          addResult('🔧 프로필을 수동으로 생성합니다...');
          
          // 프로필 수동 생성
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              photo_url: user.user_metadata?.avatar_url || '',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            addResult(`❌ 프로필 생성 실패: ${createError.message}`);
          } else {
            addResult('✅ 프로필 생성 완료');
          }
        } else {
          addResult(`❌ 프로필 조회 실패: ${profileError.message}`);
        }
      } else {
        addResult('✅ 프로필 확인 완료');
      }

      // 2. 구독 데이터 확인
      addResult('🔍 구독 데이터 확인 중...');
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (subError) {
        addResult(`❌ 구독 데이터 조회 실패: ${subError.message}`);
        if (subError.message.includes('permission')) {
          addResult('💡 RLS 정책 문제일 수 있습니다.');
        }
      } else {
        addResult(`✅ 구독 데이터 확인 완료 (${subscriptions?.length || 0}개)`);
      }

      // 3. RLS 정책 확인
      addResult('🔍 RLS 정책 확인 중...');
      try {
        const { data: testData } = await supabase
          .from('subscriptions')
          .select('count')
          .eq('user_id', user.id);
        addResult('✅ RLS 정책 정상');
      } catch (error) {
        addResult('❌ RLS 정책 문제 발견');
        addResult('💡 Supabase Dashboard에서 RLS 정책을 확인해주세요.');
      }

    } catch (error) {
      addResult(`❌ 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  // 상황 3: 간헐적으로 작동하는 경우
  const handleIntermittentIssues = async () => {
    setIsRunning(true);
    setCurrentStep('간헐적 문제 진단 중...');
    clearResults();

    try {
      // 1. 세션 상태 확인
      addResult('🔍 세션 상태 확인 중...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addResult('❌ 활성 세션이 없습니다.');
        addResult('💡 다시 로그인해주세요.');
        return;
      }

      addResult('✅ 세션 확인 완료');
      addResult(`📅 토큰 만료 시간: ${session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Not set'}`);

      // 2. 토큰 갱신 시도
      addResult('🔧 토큰 갱신 시도 중...');
      try {
        await supabase.auth.refreshSession();
        addResult('✅ 토큰 갱신 완료');
      } catch (error) {
        addResult('❌ 토큰 갱신 실패');
        addResult('💡 다시 로그인해주세요.');
      }

      // 3. 네트워크 상태 확인
      addResult('🔍 네트워크 상태 확인 중...');
      if (!navigator.onLine) {
        addResult('❌ 네트워크 연결이 불안정합니다.');
      } else {
        addResult('✅ 네트워크 연결 정상');
      }

      // 4. Supabase 서비스 상태 확인
      addResult('🔍 Supabase 서비스 상태 확인 중...');
      try {
        const { data } = await supabase.from('profiles').select('count').limit(1);
        addResult('✅ Supabase 서비스 정상');
      } catch (error) {
        addResult('❌ Supabase 서비스 문제');
        addResult('💡 잠시 후 다시 시도해주세요.');
      }

    } catch (error) {
      addResult(`❌ 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            긴급 상황 진단 도구
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleScreenNotLoading}
              disabled={isRunning}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <span className="font-medium">화면 로딩 안됨</span>
              </div>
              <p className="text-sm text-gray-600">완전히 화면이 나오지 않는 경우</p>
            </button>

            <button
              onClick={handleNoDataAfterLogin}
              disabled={isRunning}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-green-500" />
                <span className="font-medium">데이터 없음</span>
              </div>
              <p className="text-sm text-gray-600">로그인은 되지만 데이터가 없는 경우</p>
            </button>

            <button
              onClick={handleIntermittentIssues}
              disabled={isRunning}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">간헐적 문제</span>
              </div>
              <p className="text-sm text-gray-600">간헐적으로 작동하는 경우</p>
            </button>
          </div>
        </div>

        {currentStep && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-blue-700">{currentStep}</span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">진단 결과</h3>
              <button
                onClick={clearResults}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                지우기
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">빠른 해결책</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 브라우저 캐시 삭제 후 새로고침</p>
            <p>• 다른 브라우저에서 테스트</p>
            <p>• 네트워크 연결 확인</p>
            <p>• 다시 로그인 시도</p>
            <p>• 개발자 도구에서 <code className="bg-gray-100 px-1 rounded">window.supabaseMonitor.runFullDiagnostic()</code> 실행</p>
          </div>
        </div>
      </div>
    </div>
  );
};