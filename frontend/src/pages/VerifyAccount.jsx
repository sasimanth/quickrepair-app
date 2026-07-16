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

  // 1. Process email verification token if present in the URL query
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
          // Refresh user session state
          const meRes = await api.get('/auth/me');
          setUser(meRes.data.user);
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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black mb-2">Access Restrained</h2>
          <p className="text-slate-400 mb-6">Please log in first to access the verification center.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition duration-200"
          >
            Go to Login
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
      const { data } = await api.post('/auth/verify-otp', {
        phone: user.phone,
        otp
      });
      // Refresh user session state
      const meRes = await api.get('/auth/me');
      setUser(meRes.data.user);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCodes = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const { data } = await api.post('/auth/resend-verification', {
        email: user.email
      });
      setResendMessage(data.message || 'Verification links and SMS codes resent successfully!');
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Failed to resend verification requests.');
    } finally {
      setResendLoading(false);
    }
  };

  const isFullyVerified = user.isEmailVerified && user.isPhoneVerified;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6">
      <div className="max-w-xl w-full bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {isFullyVerified ? (
          <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]" />
            <h1 className="text-3xl font-black tracking-tight mb-3">Verification Successful!</h1>
            <p className="text-emerald-300 font-semibold mb-6">Your Fixvo account is now active and secure.</p>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 inline-flex items-center gap-3 text-slate-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Redirecting you to your secure dashboard...</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Verify Your Account</h1>
              <p className="text-slate-400 text-sm">
                To prevent fraud and maintain marketplace security, please verify your email and mobile number.
              </p>
            </div>

            {resendMessage && (
              <div className={`p-4 rounded-xl border text-sm text-center mb-6 font-semibold flex items-center justify-center gap-2 ${
                resendMessage.toLowerCase().includes('failed') 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                {resendMessage.toLowerCase().includes('failed') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {resendMessage}
              </div>
            )}

            <div className="space-y-6">
              {/* EMAIL VERIFICATION SECTION */}
              <div className={`border rounded-2xl p-6 transition-all duration-300 ${
                user.isEmailVerified 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-700'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border ${
                    user.isEmailVerified 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-700/30 border-slate-600/30 text-indigo-400'
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-lg">Email Address</h3>
                      {user.isEmailVerified ? (
                        <span className="text-[10px] sm:text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-0.5 uppercase tracking-wider animate-pulse">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs break-all mb-3">{user.email}</p>
                    
                    {user.isEmailVerified ? (
                      <p className="text-emerald-400/90 text-xs font-semibold">Your email has been confirmed.</p>
                    ) : (
                      <div>
                        {emailLoading ? (
                          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold py-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Checking verification token link...
                          </div>
                        ) : emailSuccessMsg ? (
                          <p className="text-emerald-400 text-xs font-semibold">{emailSuccessMsg}</p>
                        ) : emailError ? (
                          <p className="text-rose-400 text-xs font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {emailError}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-xs">
                            A verification link has been sent to your inbox. Please click the link to confirm.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PHONE/SMS OTP VERIFICATION SECTION */}
              <div className={`border rounded-2xl p-6 transition-all duration-300 ${
                user.isPhoneVerified 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-700'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border ${
                    user.isPhoneVerified 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-700/30 border-slate-600/30 text-indigo-400'
                  }`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-lg">Mobile Number</h3>
                      {user.isPhoneVerified ? (
                        <span className="text-[10px] sm:text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-0.5 uppercase tracking-wider animate-pulse">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mb-3">{user.phone}</p>

                    {user.isPhoneVerified ? (
                      <p className="text-emerald-400/90 text-xs font-semibold">Mobile number is verified.</p>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <p className="text-slate-400 text-xs">
                          Please enter the 6-digit verification code sent to your phone.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit OTP"
                            className="bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] focus:outline-none focus:border-indigo-500 flex-1"
                          />
                          <button
                            type="submit"
                            disabled={otpLoading || otp.length !== 6}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition duration-200"
                          >
                            {otpLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Verify Code'}
                          </button>
                        </div>
                        {otpError && (
                          <p className="text-rose-400 text-xs font-semibold flex items-center gap-1">
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
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleResendCodes}
                disabled={resendLoading}
                className="group flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition duration-150 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${resendLoading ? 'animate-spin' : ''}`} />
                Resend Verification Code & Email
              </button>

              <button
                onClick={() => {
                  const { logout } = useAuth();
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                className="text-slate-500 hover:text-slate-400 text-xs underline font-semibold transition"
              >
                Log out & use different account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyAccount;
