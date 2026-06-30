import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Shield, Loader2, Save, LogOut } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    // In a real app, you would send this to the backend
    setLoading(true);
    setSuccessMsg('');
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Profile updated successfully! (Mocked for now)');
    }, 1000);
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
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-500" />
              Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Current Password</label>
                <input {...register('currentPassword')} type="password" placeholder="••••••••" className="glass-input" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">New Password</label>
                <input {...register('newPassword')} type="password" placeholder="••••••••" className="glass-input" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
