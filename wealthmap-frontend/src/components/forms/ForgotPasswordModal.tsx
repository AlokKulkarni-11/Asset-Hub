import React, { useState } from 'react';
import { X, Mail, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { forgotPassword, resetPassword } from '../../api/users.api';

interface Props {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await forgotPassword(email);
      setSuccess('An OTP has been sent to your email.');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to send OTP. Ensure email is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await resetPassword({ email, otp, newPassword });
      setSuccess('Password successfully reset! You can now log in.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to reset password. Check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border bg-surface-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-accent-500" />
            </div>
            <h2 className="text-xl font-semibold">Forgot Password</h2>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-text-secondary text-sm">
                Enter your registered email address and we'll send you a 6-digit verification code to reset your password.
              </p>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input pl-10" 
                    placeholder="you@example.com" 
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-text-secondary text-sm">
                We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below along with your new password.
              </p>
              
              <div>
                <label className="block text-sm text-text-secondary mb-1">Verification Code (OTP)</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="glass-input text-center text-xl tracking-[0.5em] font-mono" 
                  placeholder="------"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
