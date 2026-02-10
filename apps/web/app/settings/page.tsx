'use client';

import { useState, useMemo } from 'react';
import { User, Lock, Eye, Bell, Save, Loader2, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api-client';

type SettingsSection = 'profile' | 'account' | 'privacy' | 'notifications';

interface ProfileFormData {
  displayName: string;
  bio: string;
  location: string;
  website: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Derive initial form values from user data
  const initialProfileForm = useMemo<ProfileFormData>(() => ({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  }), [user]);

  // Profile form — re-keyed when user changes via key prop on the form
  const [profileForm, setProfileForm] = useState<ProfileFormData>(initialProfileForm);

  // Password form
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Privacy
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);

  // Sync profile form when user data changes (e.g. after fetch completes)
  const userKey = user?.id;
  const [prevUserKey, setPrevUserKey] = useState(userKey);
  if (userKey !== prevUserKey) {
    setPrevUserKey(userKey);
    setProfileForm(initialProfileForm);
    setIsPrivate(user?.isPrivate || false);
  }

  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    reposts: true,
    mentions: true,
    groupPosts: true,
    rewards: true,
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      api.patch('/api/v1/users/me', data, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/api/v1/auth/change-password', data, { requireAuth: true }),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const privacyMutation = useMutation({
    mutationFn: (isPrivate: boolean) =>
      api.patch('/api/v1/users/me', { isPrivate }, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const notifMutation = useMutation({
    mutationFn: (settings: typeof notifSettings) =>
      api.patch('/api/v1/users/me/notifications-settings', settings, { requireAuth: true }),
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handlePrivacyToggle = () => {
    const newValue = !isPrivate;
    setIsPrivate(newValue);
    privacyMutation.mutate(newValue);
  };

  const handleNotifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notifMutation.mutate(notifSettings);
  };

  const sections: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User size={18} /> },
    { key: 'account', label: 'Account', icon: <Lock size={18} /> },
    { key: 'privacy', label: 'Privacy', icon: <Eye size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ];

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <h2>Settings</h2>
        </header>

        <div className="settings-layout">
          <nav className="settings-nav">
            {sections.map((section) => (
              <button
                key={section.key}
                className={`settings-nav-item ${activeSection === section.key ? 'active' : ''}`}
                onClick={() => setActiveSection(section.key)}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}
          </nav>

          <div className="settings-content">
            {saveSuccess && (
              <div className="save-success">
                <Check size={16} />
                <span>Settings saved successfully</span>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <form className="settings-form" onSubmit={handleProfileSubmit}>
                <h3>Profile Information</h3>
                <p className="form-description">Update your profile details visible to others.</p>

                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    id="displayName"
                    type="text"
                    className="form-input"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, displayName: e.target.value }))}
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    className="form-textarea"
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                    maxLength={160}
                  />
                  <span className="char-hint">{profileForm.bio.length}/160</span>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    className="form-input"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. London, UK"
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="url"
                    className="form-input"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-save"
                  disabled={profileMutation.isPending}
                >
                  {profileMutation.isPending ? (
                    <><Loader2 size={16} className="spin-icon" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Profile</>
                  )}
                </button>

                {profileMutation.isError && (
                  <p className="form-error">
                    {profileMutation.error instanceof Error ? profileMutation.error.message : 'Failed to save'}
                  </p>
                )}
              </form>
            )}

            {/* Account Section */}
            {activeSection === 'account' && (
              <form className="settings-form" onSubmit={handlePasswordSubmit}>
                <h3>Change Password</h3>
                <p className="form-description">Update your password to keep your account secure.</p>

                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={8}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <span className="field-error">Passwords do not match</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-save"
                  disabled={
                    passwordMutation.isPending ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                >
                  {passwordMutation.isPending ? (
                    <><Loader2 size={16} className="spin-icon" /> Changing...</>
                  ) : (
                    <><Lock size={16} /> Change Password</>
                  )}
                </button>

                {passwordMutation.isError && (
                  <p className="form-error">
                    {passwordMutation.error instanceof Error ? passwordMutation.error.message : 'Failed to change password'}
                  </p>
                )}
              </form>
            )}

            {/* Privacy Section */}
            {activeSection === 'privacy' && (
              <div className="settings-form">
                <h3>Privacy Settings</h3>
                <p className="form-description">Control who can see your content and interact with you.</p>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <h4>Private Account</h4>
                    <p>When enabled, only approved followers can see your posts. Your existing followers will not be affected.</p>
                  </div>
                  <button
                    className={`toggle-switch ${isPrivate ? 'active' : ''}`}
                    onClick={handlePrivacyToggle}
                    disabled={privacyMutation.isPending}
                    role="switch"
                    aria-checked={isPrivate}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <form className="settings-form" onSubmit={handleNotifSubmit}>
                <h3>Notification Preferences</h3>
                <p className="form-description">Choose which notifications you want to receive.</p>

                {Object.entries(notifSettings).map(([key, value]) => (
                  <div key={key} className="toggle-group compact">
                    <div className="toggle-info">
                      <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                    </div>
                    <button
                      type="button"
                      className={`toggle-switch ${value ? 'active' : ''}`}
                      onClick={() => setNotifSettings((prev) => ({ ...prev, [key]: !value }))}
                      role="switch"
                      aria-checked={value}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn-primary btn-save"
                  disabled={notifMutation.isPending}
                >
                  {notifMutation.isPending ? (
                    <><Loader2 size={16} className="spin-icon" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Preferences</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .feed-header h2 {
          padding: 1rem 0;
          font-size: 1.25rem;
        }
        .settings-layout {
          display: flex;
          flex-direction: column;
        }
        .settings-nav {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }
        .settings-nav-item {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          padding: 1rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          position: relative;
          transition: all 0.15s;
        }
        .settings-nav-item:hover {
          background: var(--color-bg-card);
          color: var(--color-text-main);
        }
        .settings-nav-item.active {
          color: var(--color-text-main);
        }
        .settings-nav-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4rem;
          height: 4px;
          background: var(--color-brand);
          border-radius: var(--radius-full);
        }
        .settings-content {
          padding: 1.5rem;
        }
        .save-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: hsla(140, 80%, 40%, 0.15);
          color: hsl(140, 80%, 50%);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .settings-form h3 {
          font-size: 1.15rem;
          margin-bottom: 0.25rem;
        }
        .form-description {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-group label {
          display: block;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          color: var(--color-text-secondary);
        }
        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-card);
          color: var(--color-text-main);
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--color-brand);
        }
        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }
        .char-hint {
          display: block;
          text-align: right;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
        }
        .field-error {
          display: block;
          font-size: 0.8rem;
          color: hsl(0, 80%, 60%);
          margin-top: 0.35rem;
        }
        .form-error {
          color: hsl(0, 80%, 60%);
          font-size: 0.85rem;
          margin-top: 0.75rem;
        }
        .btn-save {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.5rem;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .toggle-group {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .toggle-group.compact {
          padding: 0.85rem 0;
          align-items: center;
        }
        .toggle-info {
          flex: 1;
        }
        .toggle-info h4 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .toggle-info p {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }
        .toggle-switch {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          background: var(--color-bg-card);
          border: 2px solid var(--color-border);
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s;
          padding: 0;
        }
        .toggle-switch.active {
          background: var(--color-brand);
          border-color: var(--color-brand);
        }
        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          transition: transform 0.2s;
        }
        .toggle-switch.active .toggle-knob {
          transform: translateX(22px);
        }
        .toggle-switch:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
