import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

export const GoogleAuthDebug: React.FC = () => {
  const { supabase } = useSupabase();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testGoogleAuth = async () => {
    addDebugInfo('=== Google Auth Test Started ===');
    
    try {
      // 1. Supabase 클라이언트 상태 확인
      addDebugInfo('Checking Supabase client...');
      const session = await supabase.auth.getSession();
      addDebugInfo(`Current session: ${session.data.session ? 'exists' : 'null'}`);
      
      // 2. OAuth URL 생성 테스트
      addDebugInfo('Testing OAuth URL generation...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        addDebugInfo(`OAuth Error: ${error.message}`);
        addDebugInfo(`Error Code: ${error.status}`);
      } else {
        addDebugInfo(`OAuth URL: ${data.url}`);
        addDebugInfo('OAuth URL generated successfully');
      }
      
    } catch (error: any) {
      addDebugInfo(`Test Error: ${error.message}`);
    }
    
    addDebugInfo('=== Google Auth Test Completed ===');
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        {isVisible ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 bg-white border border-gray-300 rounded-lg shadow-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Google Auth Debug</h3>
            <div className="space-x-2">
              <button
                onClick={testGoogleAuth}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Test
              </button>
              <button
                onClick={clearDebugInfo}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto text-xs bg-gray-100 p-2 rounded">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500">No debug info yet. Click "Test" to start.</p>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="mb-1 font-mono">
                  {info}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};