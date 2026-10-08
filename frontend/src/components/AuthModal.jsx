import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, X, Loader2, ArrowRight, ChevronDown, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { login, register } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';
import api from '../services/api';
import { classifyAuthError } from '../utils/errorClassifier';

const AuthModal = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { loginUser, setUser } = useAuth();
  const [authMode, setAuthMode] = useState('phone'); // 'phone', 'email', 'signup'
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user'
  });
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Pre-initialize native SocialLogin on Android/iOS
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web';
    if (isNative) {
      const webClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '232674695663-poi562drcj2t6s6usrh84vbbnrn7maib.apps.googleusercontent.com').trim();
      SocialLogin.initialize({
        google: { webClientId }
      }).catch(err => console.warn('SocialLogin init warning:', err));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuthSuccess = async (data) => {
    const userObj = data.user || data;
    if (data.token) {
      await loginUser(data.token);
    } else {
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
    }
    if (onSuccess) onSuccess();
    else if (onClose) onClose();
    else navigate('/dashboard');
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
      let data;
      if (authMode === 'signup') {
        if (!agreeTerms) {
          setError('Please accept Terms of Use & Privacy Policy to register.');
          setLoading(false);
          return;
        }
        data = await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || phone,
          password: formData.password,
          role: formData.role || 'user'
        });
      } else {
        data = await login({
          email: formData.email,
          password: formData.password
        });
      }

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
    const isNative = Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web';
    if (isNative) {
      handleNativeGoogleLogin();
    } else {
      webGoogleLogin();
    }
  };

  const handleSkipToDashboard = () => {
    if (onClose) onClose();
    navigate('/dashboard');
  };

  const handleBackToHome = () => {
    if (onClose) onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md transition-all duration-300">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full min-h-screen sm:min-h-0 sm:max-w-md bg-white sm:rounded-[2.5rem] shadow-2xl border-0 sm:border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-200 text-slate-900 z-10 text-left flex flex-col justify-between">
        
        <div>
          {/* Top Bar: Back to Home (Top Left) & Skip to Dashboard (Top Right) */}
          <div className="flex justify-between items-center mb-4">
            <button 
              type="button"
              onClick={handleBackToHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-extrabold text-xs transition-all cursor-pointer bg-white shadow-2xs"
            >
              <ArrowLeft size={14} /> Back to Home
            </button>

            <button 
              type="button"
              onClick={handleSkipToDashboard}
              className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition-all cursor-pointer bg-white"
            >
              Skip
            </button>
          </div>

          {/* Brand Icon Header */}
          <div className="flex justify-start mb-5">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm overflow-hidden p-1">
              <img src={fixvoLogo} alt="Fixvo" className="w-full h-full object-cover scale-110" />
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {authMode === 'phone' ? 'Enter your phone number' : authMode === 'signup' ? 'Create new account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium leading-relaxed">
              {authMode === 'phone' 
                ? "We'll send you a text with a verification code. Standard tariff may apply." 
                : authMode === 'signup' 
                  ? 'Join Fixvo to book instant doorstep repairs and track service visits.' 
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
              <div className="flex border-2 border-blue-600 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 transition-all bg-white">
                <div className="flex items-center gap-1 px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-sm font-extrabold text-slate-800 shrink-0">
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
                  className="w-full px-4 py-3 text-base font-bold text-slate-900 outline-none bg-white placeholder:text-slate-300 tracking-wide"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#DCE4F7] hover:bg-blue-600 hover:text-white text-blue-900 font-extrabold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none outline-none active:scale-98"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Continue'}
              </button>
            </form>
          )}

          {/* Full Restored Signup Registration Form & Email Form */}
          {(authMode === 'email' || authMode === 'signup') && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block ml-1 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-blue-600 outline-none" 
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block ml-1 mb-1">Mobile Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-blue-600 outline-none" 
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block ml-1 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-blue-600 outline-none" 
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block ml-1 mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-blue-600 outline-none" 
                  placeholder="••••••••"
                />
              </div>

              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block ml-1 mb-1">I am registering as</label>
                    <select 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-blue-600 outline-none cursor-pointer"
                    >
                      <option value="user">Customer (I need doorstep repairs)</option>
                      <option value="technician">Technician (I want to earn as a fixer)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs text-slate-600 font-semibold">
                    <input 
                      type="checkbox" 
                      checked={agreeTerms} 
                      onChange={(e) => setAgreeTerms(e.target.checked)} 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>I agree to <a href="#terms" className="text-blue-600 underline">Terms of Use</a> & <a href="#privacy" className="text-blue-600 underline">Privacy Policy</a></span>
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none outline-none mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : authMode === 'signup' ? 'Complete Registration' : 'Sign In'}
              </button>
            </form>
          )}

          {/* OR Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative px-3 bg-white text-[11px] font-black uppercase text-slate-400 tracking-widest">
              OR
            </span>
          </div>

          {/* Continue with Google button */}
          <button
            type="button"
            onClick={triggerGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl text-slate-800 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer"
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

        {/* Bottom Navigation & Account Switch Toggles */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
          {authMode === 'phone' ? (
            <div className="flex items-center justify-between">
              <button 
                type="button" 
                onClick={() => { setAuthMode('signup'); setError(''); }} 
                className="text-blue-600 hover:underline cursor-pointer border-none bg-transparent font-black"
              >
                New user? Create Account
              </button>
              <button 
                type="button" 
                onClick={() => { setAuthMode('email'); setError(''); }} 
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer border-none bg-transparent font-bold"
              >
                Email Login
              </button>
            </div>
          ) : authMode === 'signup' ? (
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => { setAuthMode('phone'); setError(''); }} 
                className="text-blue-600 hover:underline cursor-pointer border-none bg-transparent font-black"
              >
                Already have an account? Sign In
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => { setAuthMode('phone'); setError(''); }} 
                className="text-blue-600 hover:underline cursor-pointer border-none bg-transparent font-black"
              >
                ← Back to Phone Login
              </button>
            </div>
          )}

          {/* Footer Notice */}
          <p className="mt-4 text-center text-[10px] text-slate-400 font-medium leading-relaxed">
            By continuing, you agree to our <a href="#terms" className="text-slate-600 underline">Terms of Use</a> and <a href="#privacy" className="text-slate-600 underline">Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
