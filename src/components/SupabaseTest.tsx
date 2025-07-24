import React, { useState, useEffect } from 'react';
import { supabase, checkSupabaseConnection } from '../lib/supabase';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
}

const SupabaseTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'loading', message: string, data?: any) => {
    setResults(prev => [...prev, { test, status, message, data }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runConnectionTest = async () => {
    addResult('Connection Test', 'loading', 'Testing Supabase connection...');
    
    try {
      const result = await checkSupabaseConnection();
      
      if (result.connected) {
        addResult('Connection Test', 'success', 'Supabase connection successful', result.session);
      } else {
        const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
        addResult('Connection Test', 'error', `Connection failed: ${errorMessage}`, result.error);
      }
    } catch (error) {
      addResult('Connection Test', 'error', `Unexpected error: ${error}`, error);
    }
  };

  const runAuthTest = async () => {
    addResult('Auth Test', 'loading', 'Testing authentication...');
    
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        addResult('Auth Test', 'error', `Auth error: ${error.message}`, error);
      } else {
        addResult('Auth Test', 'success', `User: ${data.user ? data.user.email : 'Not authenticated'}`, data.user);
      }
    } catch (error) {
      addResult('Auth Test', 'error', `Auth test failed: ${error}`, error);
    }
  };

  const runDatabaseTest = async () => {
    addResult('Database Test', 'loading', 'Testing database connection...');
    
    try {
      // 간단한 쿼리로 데이터베이스 연결 테스트
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        addResult('Database Test', 'error', `Database error: ${error.message}`, error);
      } else {
        addResult('Database Test', 'success', 'Database connection successful', data);
      }
    } catch (error) {
      addResult('Database Test', 'error', `Database test failed: ${error}`, error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    await runConnectionTest();
    await runAuthTest();
    await runDatabaseTest();
    
    setIsRunning(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Supabase 연동 테스트</h1>
        
        <div className="mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg mr-4"
          >
            {isRunning ? '테스트 중...' : '전체 테스트 실행'}
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            결과 초기화
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{result.test}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {result.status === 'success' ? '성공' :
                   result.status === 'error' ? '실패' : '진행중'}
                </span>
              </div>
              <p className="text-gray-700 mt-2">{result.message}</p>
              {result.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    데이터 보기
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            테스트를 실행해주세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;