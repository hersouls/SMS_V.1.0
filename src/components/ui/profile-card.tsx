import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn, getInitials } from '../../lib/utils';
import { Upload, Camera, User, Mail, Settings, LogOut } from 'lucide-react';

interface ProfileCardProps {
  profile: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
    coverPhoto?: string;
  };
  onSave: (updates: any) => void;
  onCancel: () => void;
  onLogout: () => void;
  isLoading?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onSave,
  onCancel,
  onLogout,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    photo: profile.photo,
    coverPhoto: profile.coverPhoto
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.photo || null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(profile.coverPhoto || null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'coverPhoto') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'photo') {
          setPhotoPreview(result);
          setFormData(prev => ({ ...prev, photo: result }));
        } else {
          setCoverPhotoPreview(result);
          setFormData(prev => ({ ...prev, coverPhoto: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 커버 이미지 */}
      <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
        {coverPhotoPreview && (
          <img
            src={coverPhotoPreview}
            alt="커버 이미지"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* 커버 이미지 업로드 버튼 */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('cover-photo-upload')?.click()}
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <Camera className="w-4 h-4 mr-1" />
            커버 이미지
          </Button>
          <input
            id="cover-photo-upload"
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e, 'coverPhoto')}
            className="hidden"
          />
        </div>
      </div>

      {/* 프로필 카드 */}
      <Card className="relative -mt-20 mx-4">
        <CardContent className="pt-20 pb-6">
          {/* 프로필 이미지 */}
          <div className="absolute -top-16 left-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={photoPreview || ''} alt="프로필 사진" />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {getInitials(`${formData.firstName} ${formData.lastName}`)}
                </AvatarFallback>
              </Avatar>
              
              {/* 프로필 이미지 업로드 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md hover:bg-gray-50"
              >
                <Upload className="w-3 h-3" />
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, 'photo')}
                className="hidden"
              />
            </div>
          </div>

          {/* 프로필 정보 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">사용자명</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="사용자명을 입력하세요"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="이메일을 입력하세요"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">이름</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">성</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="성을 입력하세요"
                />
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onLogout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isLoading}
                >
                  {isLoading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCard;