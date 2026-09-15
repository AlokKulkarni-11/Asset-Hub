import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Shield, Loader2, Save, LogOut, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { updateProfile, getProfile, setup2FA, enable2FA, disable2FA } from '../api/users.api';
import ChangePasswordModal from '../components/forms/ChangePasswordModal';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 2FA Wizard States
  const [tfaSetupData, setTfaSetupData] = useState<{ secret: string; qrCodeUri: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      mobileNumber: user?.mobileNumber || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      setLoading(true);
      setSuccessMsg('');
      setErrorMsg('');
      
      const response = await updateProfile({
        name: data.name,
        mobileNumber: data.mobileNumber
      });
      
      // Update local state
      if (token && user) {
        login(token, { ...user, name: data.name, mobileNumber: data.mobileNumber });
      }
      
      setSuccessMsg('Profile updated successfully!');
    } catch (err: any) {
      setErrorMsg('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-heading">Profile Settings</h1>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="glass-card p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-background text-3xl font-bold shadow-lg shadow-accent-500/20 shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-semibold break-all">{user?.name}</h2>
            <p className="text-text-secondary break-all">{user?.email}</p>
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Active Member
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg mb-6 text-sm">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input {...register('name')} className="glass-input pl-10" />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input {...register('email')} className="glass-input pl-10 bg-surface" disabled />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input {...register('mobileNumber')} className="glass-input pl-10" placeholder="+91 9876543210" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <h3 className="text-lg font-medium flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-accent-500" />
                Security
              </h3>
              <p className="text-sm text-text-secondary">Manage your password and security settings</p>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowPasswordModal(true)}
              className="w-full sm:w-auto px-4 py-2 border border-accent-500 text-accent-500 rounded-lg hover:bg-accent-500/10 transition-colors font-medium whitespace-nowrap"
            >
              Change Password
            </button>
          </div>

          <div className="flex justify-end pt-8 mt-4 border-t border-border">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication (2FA) Card */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-500" />
          Two-Factor Authentication (2FA)
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Add an extra layer of security to your account by requiring a verification code from Google Authenticator or Microsoft Authenticator.
        </p>

        {profile?.tfaEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Shield className="w-8 h-8 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Two-Factor Authentication is Enabled</p>
                <p className="text-xs opacity-80">Your account is secured with secondary code verification.</p>
              </div>
            </div>

            {disabling ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  await disable2FA(disableCode);
                  setDisabling(false);
                  setDisableCode('');
                  refetchProfile();
                  alert('2FA disabled successfully.');
                } catch (err: any) {
                  alert(err.response?.data?.message || err.response?.data || 'Failed to disable 2FA');
                } finally {
                  setLoading(false);
                }
              }} className="p-4 bg-surface border border-border rounded-xl space-y-3">
                <p className="text-xs text-text-secondary">Enter the current 6-digit authenticator code to confirm disabling 2FA:</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    className="glass-input text-center text-sm font-semibold max-w-[120px]"
                    autoFocus
                  />
                  <button type="submit" className="btn-primary py-1 px-4 text-xs bg-red-500 hover:bg-red-600 border-red-500">Confirm Disable</button>
                  <button type="button" onClick={() => setDisabling(false)} className="px-4 py-1 border border-border rounded-lg text-xs text-text-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setDisabling(true)}
                className="btn-primary py-2 px-4 text-xs bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
              >
                Disable Two-Factor Authentication
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {!tfaSetupData ? (
              <div className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl justify-between flex-wrap gap-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-text-secondary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Two-Factor Authentication is Disabled</p>
                    <p className="text-xs text-text-secondary">Set up an authenticator application to enable.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const data = await setup2FA();
                      setTfaSetupData(data);
                    } catch (err) {
                      alert('Failed to initialize 2FA setup.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  Enable 2FA
                </button>
              </div>
            ) : (
              <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
                <h3 className="text-md font-medium text-text-primary">Set Up Authenticator App</h3>
                
                {recoveryCodes ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl space-y-2">
                      <p className="font-bold text-sm">2FA Setup Complete!</p>
                      <p className="text-xs">Save these recovery codes in a secure location. They can be used to log in if you lose your authenticator device. Each code can only be used once.</p>
                    </div>
                    <div className="bg-surface-hover border border-border rounded-xl p-4 font-mono text-center tracking-wider text-sm space-y-2 select-all">
                      {recoveryCodes.map(code => (
                        <div key={code}>{code}</div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTfaSetupData(null);
                        setRecoveryCodes(null);
                        setVerificationCode('');
                        refetchProfile();
                      }}
                      className="btn-primary w-full py-2"
                    >
                      Close Setup
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ol className="list-decimal pl-4 text-xs text-text-secondary space-y-4">
                      <li>Scan this QR code using Google Authenticator, Microsoft Authenticator, or Authy:</li>
                      <div className="flex justify-center py-2">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tfaSetupData.qrCodeUri)}`}
                          alt="2FA QR Code"
                          className="w-44 h-44 border border-border rounded-lg p-2 bg-white"
                        />
                      </div>
                      <li>Or enter the secret key manually if you cannot scan the code:</li>
                      <div className="bg-surface-hover border border-border rounded p-2 text-center text-xs font-mono select-all text-text-primary">
                        {tfaSetupData.secret}
                      </div>
                      <li>Enter the 6-digit verification code from your authenticator app below:</li>
                    </ol>

                    <div className="flex gap-3 pt-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="glass-input text-center text-sm font-semibold max-w-[120px]"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const res = await enable2FA(verificationCode);
                            setRecoveryCodes(res.recoveryCodes);
                          } catch (err: any) {
                            alert(err.response?.data?.message || err.response?.data || 'Failed to verify and enable 2FA.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={verificationCode.length !== 6 || loading}
                        className="btn-primary py-2 px-4 text-xs flex-1"
                      >
                        Verify & Enable
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTfaSetupData(null);
                          setVerificationCode('');
                        }}
                        className="px-4 py-2 border border-border rounded-lg text-xs text-text-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
