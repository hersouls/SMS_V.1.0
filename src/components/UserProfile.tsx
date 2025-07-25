import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { UserProfile as UserProfileType } from '../lib/authManager';

export function UserProfile() {
  const { user, profile, refreshProfile, signOut, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfileType>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 편집 폼 초기화
  React.useEffect(() => {
    if (profile && isEditing) {
      setEditForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        timezone: profile.timezone || 'Asia/Seoul',
        currency_preference: profile.currency_preference || 'KRW'
      });
    }
  }, [profile, isEditing]);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      // 여기서 프로필 업데이트 로직을 구현할 수 있습니다
      // 현재는 refreshProfile만 호출
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('프로필 저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">프로필 정보</h2>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              편집
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
            </>
          )}
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 프로필 이미지 */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="프로필 이미지"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '이름 없음'}
            </h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        {/* 프로필 정보 폼 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.first_name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="이름"
              />
            ) : (
              <p className="text-sm text-gray-900">{profile.first_name || '설정되지 않음'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.last_name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="성"
              />
            ) : (
              <p className="text-sm text-gray-900">{profile.last_name || '설정되지 않음'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="전화번호"
              />
            ) : (
              <p className="text-sm text-gray-900">{profile.phone || '설정되지 않음'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시간대
            </label>
            {isEditing ? (
              <select
                value={editForm.timezone || 'Asia/Seoul'}
                onChange={(e) => setEditForm(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Asia/Seoul">Asia/Seoul (한국)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (일본)</option>
                <option value="America/New_York">America/New_York (미국 동부)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (미국 서부)</option>
                <option value="Europe/London">Europe/London (영국)</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{profile.timezone || 'Asia/Seoul'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              통화
            </label>
            {isEditing ? (
              <select
                value={editForm.currency_preference || 'KRW'}
                onChange={(e) => setEditForm(prev => ({ ...prev, currency_preference: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD (달러)</option>
                <option value="EUR">EUR (유로)</option>
                <option value="JPY">JPY (엔)</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{profile.currency_preference || 'KRW'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계정 생성일
            </label>
            <p className="text-sm text-gray-900">
              {new Date(profile.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">계정 정보</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">사용자 ID:</span>
              <span className="text-sm text-gray-900 font-mono">{profile.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">이메일:</span>
              <span className="text-sm text-gray-900">{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">마지막 업데이트:</span>
              <span className="text-sm text-gray-900">
                {new Date(profile.updated_at).toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}