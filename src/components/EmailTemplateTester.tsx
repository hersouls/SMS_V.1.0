import React, { useState, useEffect } from 'react';
import { 
  checkEmailTemplates, 
  testEmailSending, 
  getCustomEmailTemplate, 
  checkEmailStatus 
} from '../lib/emailTemplates';

export const EmailTemplateTester: React.FC = () => {
  const [email, setEmail] = useState('');
  const [templateInfo, setTemplateInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'confirm' | 'reset' | 'magic'>('confirm');

  useEffect(() => {
    checkTemplates();
  }, []);

  const checkTemplates = async () => {
    setLoading(true);
    try {
      const result = await checkEmailTemplates();
      setTemplateInfo(result);
    } catch (error) {
      console.error('Template check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await testEmailSending(email);
      setTestResult(result);
    } catch (error) {
      console.error('Test email error:', error);
      setTestResult({ success: false, error });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmailStatus = async () => {
    if (!email) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await checkEmailStatus(email);
      setEmailStatus(result);
    } catch (error) {
      console.error('Email status check error:', error);
      setEmailStatus({ success: false, error });
    } finally {
      setLoading(false);
    }
  };

  const customTemplate = getCustomEmailTemplate(selectedTemplate);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">이메일 템플릿 테스터</h2>
      
      {/* 이메일 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          테스트 이메일 주소
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTestEmail}
            disabled={loading || !email}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '테스트 중...' : '이메일 테스트'}
          </button>
          <button
            onClick={handleCheckEmailStatus}
            disabled={loading || !email}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            상태 확인
          </button>
        </div>
      </div>

      {/* 템플릿 정보 */}
      {templateInfo && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">이메일 템플릿 설정</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(templateInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 테스트 결과 */}
      {testResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">테스트 결과</h3>
          <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 이메일 상태 */}
      {emailStatus && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">이메일 상태</h3>
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(emailStatus, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 커스텀 템플릿 미리보기 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">커스텀 이메일 템플릿 미리보기</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            템플릿 선택
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as 'confirm' | 'reset' | 'magic')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="confirm">회원가입 확인</option>
            <option value="reset">비밀번호 재설정</option>
            <option value="magic">매직 링크 로그인</option>
          </select>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-semibold mb-2">제목: {customTemplate.subject}</h4>
          <div 
            className="bg-white p-4 rounded border"
            dangerouslySetInnerHTML={{ __html: customTemplate.content }}
          />
        </div>
      </div>

      {/* Supabase 대시보드 설정 가이드 */}
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800">Supabase 대시보드 설정 가이드</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p><strong>1. Authentication &gt; Settings</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Site URL: <code>http://localhost:3000</code></li>
            <li>Redirect URLs: <code>http://localhost:3000/auth/callback</code></li>
          </ul>
          
          <p><strong>2. Authentication &gt; Email Templates</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Confirm signup 템플릿 활성화</li>
            <li>Reset password 템플릿 활성화 (선택사항)</li>
            <li>Magic link 템플릿 활성화 (선택사항)</li>
          </ul>
          
          <p><strong>3. Authentication &gt; Providers</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Email provider 활성화</li>
            <li>Confirm email 활성화</li>
          </ul>
        </div>
      </div>
    </div>
  );
};