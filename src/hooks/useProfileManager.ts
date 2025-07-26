import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Profile } from '../types/subscription';
import { useErrorHandler } from '../lib/errorHandlingSystem';

export const useProfileManager = () => {
  const { supabase, user, profile: supabaseProfile, updateProfile: updateSupabaseProfile, signOut } = useSupabase();
  const { setError } = useErrorHandler();
  
  const [profile, setProfile] = useState<Profile>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    photo: '',
    coverPhoto: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load profile data
  useEffect(() => {
    if (supabaseProfile) {
      setProfile({
        username: supabaseProfile.username || '',
        firstName: supabaseProfile.first_name || '',
        lastName: supabaseProfile.last_name || '',
        email: user?.email || '',
        photo: supabaseProfile.avatar_url || '',
        coverPhoto: supabaseProfile.cover_photo_url || ''
      });
    }
  }, [supabaseProfile, user]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const updateData: any = {};
      
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.photo !== undefined) updateData.avatar_url = updates.photo;
      if (updates.coverPhoto !== undefined) updateData.cover_photo_url = updates.coverPhoto;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => ({ ...prev, ...updates }));
      
      // Update Supabase auth profile
      await updateSupabaseProfile({
        data: updateData
      });

      return true;
    } catch (error) {
      setError('프로필 업데이트 중 오류가 발생했습니다.', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, supabase, updateSupabaseProfile, setError]);

  // Handle profile input changes
  const handleProfileInput = useCallback((field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ photo: publicUrl });
    } catch (error) {
      setError('사진 업로드 중 오류가 발생했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, updateProfile, setError]);

  // Handle cover photo upload
  const handleCoverPhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-cover-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      await updateProfile({ coverPhoto: publicUrl });
    } catch (error) {
      setError('커버 사진 업로드 중 오류가 발생했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, updateProfile, setError]);

  // Handle profile save
  const handleProfileSave = useCallback(async () => {
    const success = await updateProfile(profile);
    if (success) {
      setIsEditing(false);
    }
  }, [profile, updateProfile]);

  // Handle profile cancel
  const handleProfileCancel = useCallback(() => {
    // Reset to original profile
    if (supabaseProfile) {
      setProfile({
        username: supabaseProfile.username || '',
        firstName: supabaseProfile.first_name || '',
        lastName: supabaseProfile.last_name || '',
        email: user?.email || '',
        photo: supabaseProfile.avatar_url || '',
        coverPhoto: supabaseProfile.cover_photo_url || ''
      });
    }
    setIsEditing(false);
  }, [supabaseProfile, user]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      setError('로그아웃 중 오류가 발생했습니다.', error);
    }
  }, [signOut, setError]);

  return {
    profile,
    isEditing,
    loading,
    updateProfile,
    handleProfileInput,
    handlePhotoUpload,
    handleCoverPhotoUpload,
    handleProfileSave,
    handleProfileCancel,
    handleLogout,
    setIsEditing
  };
};