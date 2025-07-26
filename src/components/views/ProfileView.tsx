import React from 'react';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useProfileManager } from '../../hooks/useProfileManager';
import { Button } from '../ui/button';

interface ProfileViewProps {
  profileManager: ReturnType<typeof useProfileManager>;
  isEditing: boolean;
  onCancelEdit: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  profileManager,
  isEditing,
  onCancelEdit
}) => {
  const {
    profile,
    loading,
    handleProfileInput,
    handlePhotoUpload,
    handleCoverPhotoUpload,
    handleProfileSave,
    handleProfileCancel
  } = profileManager;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">프로필</h2>
        {!isEditing && (
          <Button
            onClick={() => profileManager.setIsEditing(true)}
            variant="outline"
            size="sm"
          >
            편집
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          {profile.coverPhoto && (
            <img
              src={profile.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isEditing && (
            <label className="absolute top-4 right-4 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverPhotoUpload}
                className="hidden"
              />
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2 hover:bg-opacity-30 transition-all">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
            </label>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="relative">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <UserCircleIcon className="w-24 h-24 text-gray-400" />
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors">
                    <CameraIcon className="w-4 h-4 text-white" />
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사용자명
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleProfileInput('username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="사용자명을 입력하세요"
                />
              ) : (
                <p className="text-lg font-medium text-gray-900">
                  {profile.username || '사용자명이 설정되지 않았습니다'}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => handleProfileInput('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이름을 입력하세요"
                  />
                ) : (
                  <p className="text-gray-900">
                    {profile.firstName || '이름이 설정되지 않았습니다'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => handleProfileInput('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="성을 입력하세요"
                  />
                ) : (
                  <p className="text-gray-900">
                    {profile.lastName || '성이 설정되지 않았습니다'}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <p className="text-gray-900">{profile.email}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={handleProfileCancel}
                variant="outline"
                disabled={loading}
              >
                취소
              </Button>
              <Button
                onClick={handleProfileSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;