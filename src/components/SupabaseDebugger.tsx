import React, { useState, useEffect } from 'react';
import { supabase, checkSupabaseConnection } from '../lib/supabase';

export const SupabaseDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info: any = {
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          REACT_APP_ENV: process.env.REACT_APP_ENV,
          REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
          REACT_APP_SUPABASE_AUTH_REDIRECT_URL: process.env.REACT_APP_SUPABASE_AUTH_REDIRECT_URL,
          REACT_APP_SITE_URL: process.env.REACT_APP_SITE_URL,
        },
        browser: {
          origin: window.location.origin,
          href: window.location.href,
          userAgent: navigator.userAgent,
        },
        supabase: {},
      };

      try {
        // Supabase 연결 상태 확인
        const connectionCheck = await checkSupabaseConnection();
        info.supabase.connection = connectionCheck;

        // 현재 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        info.supabase.session = { session: !!session, error: sessionError };

        // 현재 사용자 확인
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        info.supabase.user = { user: user ? { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at } : null, error: userError };

      } catch (error) {
        info.supabase.error = error;
      }

      setDebugInfo(info);
      setLoading(false);
    };

    gatherDebugInfo();
  }, []);

  if (loading) {
    return <div>디버그 정보 수집 중...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Supabase 디버그 정보</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">환경 변수</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">브라우저 정보</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo.browser, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Supabase 상태</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo.supabase, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};