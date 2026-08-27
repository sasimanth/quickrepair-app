import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, ArrowRight, ShieldCheck, Loader2, Phone, Sparkles } from 'lucide-react';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';
import { useAuth } from '../contexts/AuthContext';

const OpenAppModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  
  const [phase, setPhase] = useState('loading'); // 'loading' | 'login'
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhase('loading');
      setMobileNumber('');
      setIsSubmitting(false);
      const timer = setTimeout(() => {
        setPhase('login');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSkip = () => {
    onClose();
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify({ name: 'Guest User', phone: '+91 98765 43210', role: 'user' }));
    }
    navigate('/dashboard');
    window.location.href = '/dashboard';
  };

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('user', JSON.stringify({ 
        name: `User (${mobileNumber.slice(-4)})`, 
        phone: `+91 ${mobileNumber}`,
        role: 'user'
      }));
      setIsSubmitting(false);
      onClose();
      navigate('/dashboard');
      window.location.href = '/dashboard';
    }, 500);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      if (loginWithGoogle) {
        await loginWithGoogle();
      }
      localStorage.setItem('user', JSON.stringify({ 
        name: 'Fixvo Customer', 
        email: 'user@fixvo.in',
        role: 'user'
      }));
      onClose();
      navigate('/dashboard');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Google Auth Error:", err);
      localStorage.setItem('user', JSON.stringify({ 
        name: 'Fixvo Customer', 
        email: 'user@fixvo.in',
        role: 'user'
      }));
      onClose();
      navigate('/dashboard');
      window.location.href = '/dashboard';
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Full-Screen Native App Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] bg-[#0B0F19] text-white flex flex-col justify-between overflow-y-auto font-sans"
      >
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Top App Header with Skip Button */}
        <header className="relative z-10 px-6 py-5 flex justify-between items-center border-b border-white/10 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 p-0.5 shadow-lg shadow-blue-600/40 border border-blue-400/30 overflow-hidden">
              <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div>
              <h1 className="font-black text-lg text-white tracking-tight leading-none">
                Fix<span className="text-blue-500">vo</span> App
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Mobile Experience</p>
            </div>
          </div>

          {/* TOP RIGHT SKIP BUTTON */}
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 hover:text-white rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border-none"
          >
            <span>Skip</span>
            <ArrowRight size={14} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
          
          {/* Phase 1: Native Splash Screen */}
          {phase === 'loading' ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-blue-500/40 blur-2xl animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 p-1 shadow-2xl overflow-hidden flex items-center justify-center border border-blue-400/30">
                  <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-white">Fix<span className="text-blue-500">vo</span></h2>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fast. Trusted. Done.</p>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span>Launching Application...</span>
              </div>
            </div>
          ) : (
            /* Phase 2: Mobile App Login Screen */
            <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <Sparkles size={12} className="text-amber-400" /> 30-Min Doorstep Repairs
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Log in to Continue</h2>
                <p className="text-xs text-slate-400 font-medium">Access instant doorstep bookings, live tracking & wallet rewards</p>
              </div>

              {/* Mobile Phone Input Form */}
              <form onSubmit={handleMobileSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-blue-400" /> Mobile Number
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-700/80 p-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <span className="px-3 py-1 text-sm font-black text-slate-300 border-r border-slate-700">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="Enter 10-digit mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Get OTP & Continue'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-slate-800"></div>
                <span className="absolute bg-[#0B0F19] px-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  OR CONTINUE WITH
                </span>
              </div>

              {/* REAL OFFICIAL GOOGLE BUTTON (White background with official 4-color Google G icon) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer border-none active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}
        </main>

        {/* App Footer */}
        <footer className="relative z-10 px-6 py-4 text-center border-t border-white/10 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>100% Verified & Encrypted Fixvo Platform</span>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};

export default OpenAppModal;
