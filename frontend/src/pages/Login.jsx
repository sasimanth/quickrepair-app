import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ChevronDown, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { login } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';
import api from '../services/api';
import { classifyAuthError } from '../utils/errorClassifier';

const Login = () => {
  const navigate = useNavigate();
  const { loginUser, setUser } = useAuth();

  const [authMode, setAuthMode] = useState('phone'); // 'phone', 'email'
  const [phone, setPhone] = useState('');
  const [emailData, setEmailData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web';

  // Pre-initialize native SocialLogin on Android/iOS
  useEffect(() => {
    if (isNative) {
      const webClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '232674695663-poi562drcj2t6s6usrh84vbbnrn7maib.apps.googleusercontent.com').trim();
      SocialLogin.initialize({
        google: { webClientId }
      }).catch(err => console.warn('SocialLogin init warning:', err));
    }
  }, [isNative]);

  const handleAuthSuccess = async (data) => {
    const userObj = data.user || data;
    const role = data.role || userObj.role || 'user';
    
    if (data.token) {
      await loginUser(data.token);
    } else {
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
    }

    const queryParams = new URLSearchParams(document.location.search);
    const redirectPath = queryParams.get('redirect');
    if (redirectPath && role === 'user') {
      navigate(redirectPath);
    } else {
      const targetPath = role === 'admin' 
        ? '/admin-dashboard' 
        : role === 'technician' 
          ? '/technician-dashboard' 
          : '/dashboard';
      navigate(targetPath);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/phone-login', { phone: digits });
      await handleAuthSuccess(data);
    } catch (err) {
      const classified = classifyAuthError(err);
      setError(classified.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({
        email: emailData.email,
        password: emailData.password
      });
      await handleAuthSuccess(data);
    } catch (err) {
      const classified = classifyAuthError(err);
      setError(classified.message);
    } finally {
      setLoading(false);
    }
  };

  const webGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    prompt: 'select_account',
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        const { data } = await api.post('/auth/google', {
          accessToken: tokenResponse.access_token
        });
        await handleAuthSuccess(data);
      } catch (err) {
        const classified = classifyAuthError(err);
        setError(classified.message);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.warn('Google login popup error:', err);
      const classified = classifyAuthError(err);
      setError(classified.message || 'Google authentication was cancelled or blocked.');
    }
  });

  const handleNativeGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const webClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '232674695663-poi562drcj2t6s6usrh84vbbnrn7maib.apps.googleusercontent.com').trim();
      try {
        await SocialLogin.initialize({ google: { webClientId } });
      } catch (initErr) { /* ignore */ }

      const res = await SocialLogin.login({
        provider: 'google',
        options: { scopes: ['email', 'profile'] }
      });

      const idToken = res.result?.idToken || res.result?.token || res.result?.id_token;
      const accessToken = res.result?.accessToken || res.result?.access_token;

      if (!idToken && !accessToken) {
        throw new Error('No Google credentials returned from native account selector.');
      }

      const { data } = await api.post('/auth/google', {
        idToken,
        accessToken
      });

      await handleAuthSuccess(data);
    } catch (err) {
      const classified = classifyAuthError(err);
      setError(classified.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogleLogin = () => {
    setError('');
    if (isNative) {
      handleNativeGoogleLogin();
    } else {
      webGoogleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center sm:p-4">
      {/* Mobile view full stretchable container matching App Login Page */}
      <div className="relative w-full min-h-screen sm:min-h-0 sm:max-w-md bg-white sm:rounded-[2.5rem] shadow-2xl border-0 sm:border border-slate-200 p-6 sm:p-8 text-slate-900 text-left flex flex-col justify-between">
        
        <div>
          {/* Top Bar: Back to Home (Web Only) & Skip Button */}
          <div className="flex justify-between items-center mb-4">
            {!isNative ? (
              <button 
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all cursor-pointer bg-white shadow-2xs"
              >
                <ArrowLeft size={14} /> Back to Home
              </button>
            ) : <div />}
            
            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer bg-white ml-auto"
            >
              Skip
            </button>
          </div>

          {/* Brand Icon Header */}
          <div className="flex justify-start mb-5">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm overflow-hidden p-1.5">
              <img src={fixvoLogo} alt="Fixvo" className="w-full h-full object-cover scale-110" />
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {authMode === 'phone' ? 'Enter your phone number' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium leading-relaxed">
              {authMode === 'phone' 
                ? "We'll send you a text with a verification code. Standard tariff may apply." 
                : 'Sign in to access your saved addresses, bookings, and rewards.'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl mb-4 text-xs font-bold border border-rose-200 flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Phone Input Mode */}
          {authMode === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex border border-slate-300 rounded-2xl overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
                <div className="flex items-center gap-1.5 px-3.5 py-3.5 bg-slate-50/50 border-r border-slate-200 text-sm font-bold text-slate-800 shrink-0">
                  <span>+91</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </div>
                <input 
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Phone number"
                  className="w-full px-4 py-3.5 text-base font-bold text-slate-900 outline-none bg-white placeholder:text-slate-300 tracking-wider"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#E8EEFD] hover:bg-blue-600 hover:text-white text-[#3B66D6] font-bold text-sm sm:text-base rounded-2xl transition-all shadow-none flex items-center justify-center gap-2 cursor-pointer border-none outline-none active:scale-98"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Continue'}
              </button>
            </form>
          )}

          {/* Email Input Mode */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block ml-1 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  name="email" 
                  value={emailData.email} 
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition-all" 
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block ml-1 mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  name="password" 
                  value={emailData.password} 
                  onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition-all" 
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none outline-none mt-2 active:scale-98"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
              </button>
            </form>
          )}

          {/* OR Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative px-3 bg-white text-[11px] font-bold uppercase text-slate-400 tracking-widest">
              OR
            </span>
          </div>

          {/* Continue with Google button */}
          <button
            type="button"
            onClick={triggerGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl text-slate-800 font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin text-blue-600" size={18} />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Bottom Navigation Links */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
          {authMode === 'phone' ? (
            <div className="flex items-center justify-between">
              <Link 
                to="/signup" 
                className="text-blue-600 hover:underline cursor-pointer font-bold text-xs"
              >
                New user? Create Account
              </Link>
              <button 
                type="button" 
                onClick={() => { setAuthMode('email'); setError(''); }} 
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer border-none bg-transparent font-bold text-xs"
              >
                Email Login
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => { setAuthMode('phone'); setError(''); }} 
                className="text-blue-600 hover:underline cursor-pointer border-none bg-transparent font-bold text-xs"
              >
                ← Back to Phone Login
              </button>
            </div>
          )}

          {/* Footer Notice */}
          <p className="mt-4 text-center text-[10px] text-slate-400 font-medium leading-relaxed">
            By continuing, you agree to our <a href="/terms" target="_blank" className="text-slate-600 underline">Terms of Use</a> and <a href="/privacy" target="_blank" className="text-slate-600 underline">Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;


