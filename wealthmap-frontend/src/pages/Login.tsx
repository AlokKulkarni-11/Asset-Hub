import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { documentsApi } from '../api/documents.api';
import { useAuthStore } from '../store/authStore';
import ForgotPasswordModal from '../components/forms/ForgotPasswordModal';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // 2FA States
  const [tfaRequired, setTfaRequired] = useState(false);
  const [tfaToken, setTfaToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Background ping immediately when Login page mounts to warm up Render
  useEffect(() => {
    api.get('/auth/ping').catch(() => {});
  }, []);

  // Show helpful cold-start notice if login takes > 3.5 seconds
  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => {
        setSlowNotice(true);
      }, 3500);
    } else {
      setSlowNotice(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Handle Google OAuth Callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const exchangeCode = async () => {
        try {
          setLoading(true);
          const redirectUri = `${window.location.origin}/login`;
          const res = await documentsApi.loginWithGoogle(code, redirectUri);
          const { token, id, email, name, mobileNumber } = res;
          login(token, { id, email, name, mobileNumber });
          navigate('/');
        } catch (err: any) {
          setError(err.response?.data?.message || err.response?.data || 'Google sign-in failed. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      exchangeCode();
    }
  }, [login, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      let clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        clientId = await documentsApi.getGoogleClientId();
      }
      if (!clientId) {
        setError('Google Sign-In is not configured. Please supply GOOGLE_CLIENT_ID on the backend.');
        setLoading(false);
        return;
      }
      const redirectUri = `${window.location.origin}/login`;
      const params = new URLSearchParams({
        client_id: clientId.trim(),
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
        access_type: 'offline',
        prompt: 'consent'
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (err: any) {
      setError('Failed to initialize Google login.');
      setLoading(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', data);
      
      if (res.data.tfaRequired) {
        setTfaRequired(true);
        setTfaToken(res.data.tfaToken);
        setLoading(false);
        return;
      }
      
      const { token, id, email, name, mobileNumber } = res.data;
      login(token, { id, email, name, mobileNumber });
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpVerify = async (e?: React.FormEvent, codeToVerify?: string) => {
    if (e) e.preventDefault();
    const code = (codeToVerify ?? totpCode).replace(/\s+/g, '').trim();
    if (!code || !tfaToken) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/verify-totp', { code, tfaToken });
      
      const { token, id, email, name, mobileNumber } = res.data;
      login(token, { id, email, name, mobileNumber });
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to verify verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').trim();
    setTotpCode(cleaned);
    // Auto-submit when exactly 6 digits are typed or pasted
    if (/^\d{6}$/.test(cleaned) && !loading) {
      handleTotpVerify(undefined, cleaned);
    }
  };

  if (tfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="bg-orb-gold" />
        <div className="bg-orb-blue" />
        
        <div className="glass-card w-full max-w-md p-8 relative z-10 animate-scaleUp">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-16 h-16 text-accent-500" />
            </div>
            <h1 className="text-display text-2xl mb-2">Two-Factor Authentication</h1>
            <p className="text-text-secondary text-sm text-center">Enter the 6-digit code from your authenticator app or a recovery code.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleTotpVerify} className="space-y-4">
            <div>
              <input
                type="text"
                maxLength={10}
                placeholder="Code"
                value={totpCode}
                onChange={(e) => handleTotpChange(e.target.value)}
                className="glass-input text-center text-lg tracking-widest font-semibold"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !totpCode}
              className="btn-primary w-full mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setTfaRequired(false);
                setTfaToken(null);
                setTotpCode('');
                setError(null);
              }}
              className="w-full text-center text-xs text-text-secondary hover:text-text-primary transition-colors mt-2"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-orb-gold" />
      <div className="bg-orb-blue" />
      
      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/AssetHub.png" alt="AssetHub" className="h-16 object-contain" />
          </div>
          <h1 className="text-display text-3xl mb-2">Welcome Back</h1>
          <p className="text-text-secondary text-body">Access your wealth dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                {...register('email')}
                type="email"
                placeholder="Email address"
                className="glass-input pl-10"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="glass-input pl-10"
              />
            </div>
            <div className="flex justify-between items-center mt-1 ml-1">
              {errors.password ? (
                <p className="text-red-400 text-xs">{errors.password.message}</p>
              ) : <div/>}
              <button 
                type="button" 
                onClick={() => setShowForgotModal(true)}
                className="text-accent-500 text-xs hover:text-gold-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Login'}
          </button>

          {loading && slowNotice && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-2.5 animate-pulse">
              <span>Waking up cloud instance, connecting in a moment...</span>
            </div>
          )}
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent-500 hover:text-gold-300 transition-colors">
            Open Account
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-text-muted">
          <Link to="/privacy" className="hover:text-text-secondary transition-colors underline">
            Privacy Policy & Data Security
          </Link>
        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
}
