import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Mail, Phone, CheckCircle, AlertCircle, RefreshCw, Lock } from 'lucide-react';

const VerifyAccount = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // 1. Process email verification token if present in URL query
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const email = query.get('email') || (user && user.email);

    if (token && email) {
      const verifyEmailLink = async () => {
        setEmailLoading(true);
        try {
          const { data } = await api.post('/auth/verify-email', { email, token });
          setEmailSuccessMsg(data.message || 'Email verified successfully!');
          const meRes = await api.get('/auth/me');
          if (meRes.data) {
            setUser(meRes.data.user || meRes.data);
          }
        } catch (err) {
          setEmailError(err.response?.data?.message || 'Failed to verify email. The link may have expired.');
        } finally {
          setEmailLoading(false);
        }
      };
      verifyEmailLink();
    }
  }, [location.search, user, setUser]);

  // 2. Redirect once both email and phone are verified
  useEffect(() => {
    if (user && user.isEmailVerified && user.isPhoneVerified) {
      const timer = setTimeout(() => {
        if (user.role === 'technician') {
          navigate('/technician-dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Login Required</h2>
          <p className="text-slate-500 text-sm mb-6">Please log in to your Fixvo account to access account verification.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);

    try {
      await api.post('/auth/verify-otp', {
        phone: user.phone,
        otp
      });
      const meRes = await api.get('/auth/me');
      if (meRes.data) {
        setUser(meRes.data.user || meRes.data);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCodes = async () => {
    if (cooldown > 0) return;
    setResendLoading(true);
    setResendMessage('');
    try {
      const { data } = await api.post('/auth/resend-verification', {
        email: user.email
      });
      setResendMessage(data.message || 'Verification code resent successfully to your phone and email.');
      setCooldown(60); // 60s cooldown
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Failed to resend verification requests.');
    } finally {
      setResendLoading(false);
    }
  };

  const isFullyVerified = user.isEmailVerified && user.isPhoneVerified;

  const isResendFailed = typeof resendMessage === 'string' && resendMessage.toLowerCase().includes('failed');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        
        {isFullyVerified ? (
          <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Account Fully Verified!</h1>
            <p className="text-emerald-700 font-semibold text-sm mb-6">Your Fixvo account is active. Redirecting to your dashboard...</p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 inline-flex items-center gap-3 text-slate-600 text-xs font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Redirecting now...</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1.5">Account Verification</h1>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto font-medium">
                To keep your Fixvo account secure and prevent unauthorized access, please confirm your mobile number and email.
              </p>
            </div>

            {resendMessage && (
              <div className={`p-3.5 rounded-2xl border text-xs text-center mb-6 font-bold flex items-center justify-center gap-2 ${
                isResendFailed 
                  ? 'bg-rose-50 border-rose-200 text-rose-700' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {isResendFailed ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                <span>{typeof resendMessage === 'string' ? resendMessage : JSON.stringify(resendMessage)}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* EMAIL VERIFICATION SECTION */}
              <div className={`border rounded-2xl p-5 transition-all ${
                user.isEmailVerified 
                  ? 'bg-emerald-50/50 border-emerald-200' 
                  : 'bg-slate-50/60 border-slate-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border ${
                    user.isEmailVerified 
                      ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
                      : 'bg-blue-50 border-blue-100 text-blue-600'
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">Email Address</h3>
                      {user.isEmailVerified ? (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs break-all mb-2 font-medium">{user.email}</p>
                    
                    {user.isEmailVerified ? (
                      <p className="text-emerald-600 text-xs font-semibold">Your email has been confirmed.</p>
                    ) : (
                      <div>
                        {emailLoading ? (
                          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold py-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Checking verification link...
                          </div>
                        ) : emailSuccessMsg ? (
                          <p className="text-emerald-600 text-xs font-semibold">{emailSuccessMsg}</p>
                        ) : emailError ? (
                          <p className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {emailError}
                          </p>
                        ) : (
                          <p className="text-slate-500 text-xs">
                            Verification email sent. Please check your inbox and tap the link to confirm.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PHONE/SMS OTP VERIFICATION SECTION */}
              <div className={`border rounded-2xl p-5 transition-all ${
                user.isPhoneVerified 
                  ? 'bg-emerald-50/50 border-emerald-200' 
                  : 'bg-slate-50/60 border-slate-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border ${
                    user.isPhoneVerified 
                      ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
                      : 'bg-blue-50 border-blue-100 text-blue-600'
                  }`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">Mobile SMS OTP</h3>
                      {user.isPhoneVerified ? (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs mb-3 font-medium">{user.phone}</p>

                    {user.isPhoneVerified ? (
                      <p className="text-emerald-600 text-xs font-semibold">Mobile number confirmed.</p>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <p className="text-slate-500 text-xs">
                          Enter the 6-digit OTP sent to your phone SMS.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="6-digit OTP"
                            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-center font-mono text-base tracking-[0.3em] text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white flex-1"
                          />
                          <button
                            type="submit"
                            disabled={otpLoading || otp.length !== 6}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-xl text-xs transition duration-200 cursor-pointer"
                          >
                            {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Verify Code'}
                          </button>
                        </div>
                        {otpError && (
                          <p className="text-rose-600 text-xs font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {otpError}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION RESEND SECTION */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleResendCodes}
                disabled={resendLoading || cooldown > 0}
                className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold transition bg-transparent border-0 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyAccount;
