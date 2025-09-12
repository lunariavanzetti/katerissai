// ProfileSettings Component for Kateriss AI Video Generator
// Complete user profile management with brutal pink design

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthContext, useAuthActions, useAuthUser } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { Button, Input, Card, Modal, Loading, Textarea } from '../ui';
import { showToast } from '../ui/Toast';
import type { 
  ProfileSettingsProps, 
  ProfileUpdateData, 
  UserPreferences 
} from '../../types/auth';

// =============================================================================
// FORM DATA INTERFACES
// =============================================================================

interface ProfileFormData {
  fullName: string;
  bio: string;
  website: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PreferencesData {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showActivity: boolean;
  };
  video: {
    defaultQuality: '720p' | '1080p' | '4k';
    autoPlay: boolean;
    showCaptions: boolean;
  };
}

// =============================================================================
// MAIN PROFILE SETTINGS COMPONENT
// =============================================================================

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  onProfileUpdate,
  onError,
  showDangerZone = true,
  className = '',
}) => {
  const { userId, email, fullName, avatarUrl } = useAuthUser();
  const { updatePassword, signOut } = useAuthActions();
  const { profile, actions, loadingStates } = useProfile(userId);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'danger'>('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================================================
  // PROFILE FORM
  // ==========================================================================

  const profileForm = useForm<ProfileFormData>({
    mode: 'onChange',
    defaultValues: {
      fullName: profile?.full_name || fullName || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      profileForm.reset({
        fullName: profile.full_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
      });
    }
  }, [profile, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const updateData: ProfileUpdateData = {
        full_name: data.fullName.trim() || null,
        bio: data.bio.trim() || null,
        website: data.website.trim() || null,
      };

      const result = await actions.updateProfile(updateData);

      if (result.success) {
        showToast.success('Profile updated successfully! ✨');
        if (onProfileUpdate && result.data?.profile) {
          onProfileUpdate(result.data.profile);
        }
      } else {
        const errorMessage = result.error || 'Failed to update profile';
        showToast.error(errorMessage);
        if (onError) onError(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      showToast.error(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  // ==========================================================================
  // AVATAR UPLOAD
  // ==========================================================================

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Image must be less than 5MB');
      return;
    }

    try {
      const result = await actions.uploadAvatar(file);

      if (result.success) {
        showToast.success('Avatar updated successfully! 🎉');
        if (onProfileUpdate && result.data?.profile) {
          onProfileUpdate(result.data.profile);
        }
      } else {
        const errorMessage = result.error || 'Failed to upload avatar';
        showToast.error(errorMessage);
        if (onError) onError(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Failed to upload avatar';
      showToast.error(errorMessage);
      if (onError) onError(errorMessage);
    }

    // Reset file input
    event.target.value = '';
  };

  // ==========================================================================
  // PASSWORD CHANGE
  // ==========================================================================

  const passwordForm = useForm<PasswordChangeData>({
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onPasswordSubmit = async (data: PasswordChangeData) => {
    try {
      const result = await updatePassword(data.newPassword);

      if (result.success) {
        showToast.success('Password updated successfully! 🔐');
        setShowPasswordModal(false);
        passwordForm.reset();
      } else {
        const errorMessage = result.error || 'Failed to update password';
        showToast.error(errorMessage);
      }
    } catch (error) {
      showToast.error('Failed to update password');
    }
  };

  // ==========================================================================
  // PREFERENCES MANAGEMENT
  // ==========================================================================

  const preferencesForm = useForm<PreferencesData>({
    mode: 'onChange',
    defaultValues: {
      theme: profile?.preferences?.theme || 'system',
      language: profile?.preferences?.language || 'en',
      notifications: profile?.preferences?.notifications || {
        email: true,
        push: true,
        marketing: false,
      },
      privacy: profile?.preferences?.privacy || {
        profileVisibility: 'public',
        showEmail: false,
        showActivity: true,
      },
      video: profile?.preferences?.video || {
        defaultQuality: '1080p',
        autoPlay: false,
        showCaptions: true,
      },
    },
  });

  React.useEffect(() => {
    if (profile?.preferences) {
      preferencesForm.reset({
        theme: profile.preferences.theme,
        language: profile.preferences.language,
        notifications: profile.preferences.notifications,
        privacy: profile.preferences.privacy,
        video: profile.preferences.video,
      });
    }
  }, [profile, preferencesForm]);

  const onPreferencesSubmit = async (data: PreferencesData) => {
    try {
      const result = await actions.updateProfile({
        preferences: data as UserPreferences,
      });

      if (result.success) {
        showToast.success('Preferences updated! ⚙️');
      } else {
        const errorMessage = result.error || 'Failed to update preferences';
        showToast.error(errorMessage);
      }
    } catch (error) {
      showToast.error('Failed to update preferences');
    }
  };

  // ==========================================================================
  // ACCOUNT DELETION
  // ==========================================================================

  const handleDeleteAccount = async () => {
    try {
      const result = await actions.deleteAccount();

      if (result.success) {
        showToast.success('Account deleted successfully');
        await signOut();
      } else {
        const errorMessage = result.error || 'Failed to delete account';
        showToast.error(errorMessage);
      }
    } catch (error) {
      showToast.error('Failed to delete account');
    } finally {
      setShowDeleteModal(false);
    }
  };

  // ==========================================================================
  // TAB NAVIGATION
  // ==========================================================================

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'preferences' as const, label: 'Preferences', icon: '⚙️' },
    { id: 'security' as const, label: 'Security', icon: '🔐' },
    ...(showDangerZone ? [{ id: 'danger' as const, label: 'Danger Zone', icon: '⚠️' }] : []),
  ];

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  if (!profile) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <Card className="brutal-card p-8 text-center">
          <Loading variant="spinner" size="lg" className="mb-4" />
          <p className="text-gray-600">Loading profile settings...</p>
        </Card>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-black mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 border-3 border-black">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === tab.id
                  ? 'bg-[#ff0080] text-white border-3 border-black shadow-[2px_2px_0px_#000]'
                  : 'text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <Card className="brutal-card-pink p-6">
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 border-3 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
                    {avatarUrl || profile.avatar_url ? (
                      <img
                        src={avatarUrl || profile.avatar_url || ''}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                  
                  {loadingStates.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loading variant="spinner" size="sm" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                    Profile Picture
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      loading={loadingStates.uploading}
                    >
                      Upload New
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    error={profileForm.formState.errors.fullName?.message}
                    {...profileForm.register('fullName', {
                      maxLength: {
                        value: 50,
                        message: 'Full name must be less than 50 characters'
                      }
                    })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Email"
                    value={email || ''}
                    disabled
                    helperText="Contact support to change your email address"
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Bio"
                    placeholder="Tell us about yourself..."
                    rows={4}
                    error={profileForm.formState.errors.bio?.message}
                    {...profileForm.register('bio', {
                      maxLength: {
                        value: 500,
                        message: 'Bio must be less than 500 characters'
                      }
                    })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Website"
                    placeholder="https://yourwebsite.com"
                    error={profileForm.formState.errors.website?.message}
                    {...profileForm.register('website')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loadingStates.updating}
                  disabled={!profileForm.formState.isDirty}
                >
                  {loadingStates.updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <Card className="brutal-card-pink p-6">
            <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-8">
              {/* Theme Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                  Appearance
                </h3>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Theme</label>
                  <div className="flex space-x-4">
                    {(['system', 'light', 'dark'] as const).map((theme) => (
                      <label key={theme} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value={theme}
                          {...preferencesForm.register('theme')}
                          className="w-4 h-4 text-[#ff0080] border-3 border-black focus:ring-[#ff0080]"
                        />
                        <span className="text-sm font-medium capitalize">{theme}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                  Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('notifications.email')}
                      className="w-4 h-4 border-3 border-black bg-white checked:bg-[#ff0080] focus:ring-2 focus:ring-[#ff0080]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                      <p className="text-xs text-gray-500">Receive important updates via email</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...preferencesForm.register('notifications.marketing')}
                      className="w-4 h-4 border-3 border-black bg-white checked:bg-[#ff0080] focus:ring-2 focus:ring-[#ff0080]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Marketing Communications</span>
                      <p className="text-xs text-gray-500">Receive product updates and tips</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold uppercase tracking-wide text-black">
                  Privacy
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <div className="flex space-x-4">
                      {(['public', 'private'] as const).map((visibility) => (
                        <label key={visibility} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value={visibility}
                            {...preferencesForm.register('privacy.profileVisibility')}
                            className="w-4 h-4 text-[#ff0080] border-3 border-black focus:ring-[#ff0080]"
                          />
                          <span className="text-sm font-medium capitalize">{visibility}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loadingStates.updating}
                  disabled={!preferencesForm.formState.isDirty}
                >
                  {loadingStates.updating ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <Card className="brutal-card-pink p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wide text-black mb-4">
                Password & Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-3 border-black">
                  <div>
                    <h4 className="font-semibold text-gray-900">Password</h4>
                    <p className="text-sm text-gray-600">Last updated: Never</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 border-3 border-black">
                  <div>
                    <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Button variant="secondary" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* DANGER ZONE TAB */}
        {activeTab === 'danger' && showDangerZone && (
          <Card className="brutal-card border-red-500 bg-red-50 p-6">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wide text-red-800 mb-4">
                ⚠️ Danger Zone
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white border-3 border-red-500">
                  <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteModal(true)}
                    className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* MODALS */}
      
      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            type="password"
            label="Current Password"
            autoComplete="current-password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword', {
              required: 'Current password is required'
            })}
          />

          <Input
            type="password"
            label="New Password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
          />

          <Input
            type="password"
            label="Confirm New Password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => {
                const newPassword = passwordForm.getValues('newPassword');
                return value === newPassword || 'Passwords do not match';
              }
            })}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border-3 border-red-500">
            <p className="text-sm text-red-800 font-semibold mb-2">
              ⚠️ This action cannot be undone!
            </p>
            <p className="text-sm text-red-600">
              Deleting your account will permanently remove all your data, including:
            </p>
            <ul className="text-sm text-red-600 list-disc list-inside mt-2 space-y-1">
              <li>Your profile and personal information</li>
              <li>All your generated videos</li>
              <li>Your project history</li>
              <li>Account settings and preferences</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              loading={loadingStates.deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 border-red-500"
            >
              {loadingStates.deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};