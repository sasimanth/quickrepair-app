import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, ArrowRight, ShieldCheck, Loader2, Phone } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa6';
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
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSkip = () => {
    onClose();
    navigate('/dashboard');
  };

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      // Store user mobile session fallback
      const stored = localStorage.getItem('user');
      if (!stored) {
        localStorage.setItem('user', JSON.stringify({ phone: mobileNumber, name: `User (${mobileNumber.slice(-4)})` }));
      }
      setIsSubmitting(false);
      onClose();
      navigate('/dashboard');
    }, 800);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      if (loginWithGoogle) {
        await loginWithGoogle();
      }
      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error("Google Auth Error:", err);
      // Fallback redirect to dashboard
      onClose();
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/20 bg-slate-900 text-white p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.5)] z-10"
        >
          {/* Phase 1: Splash / Loading Screen */}
          {phase === 'loading' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-blue-500/30 blur-2xl animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 p-0.5 shadow-2xl overflow-hidden flex items-center justify-center">
                  <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Fix<span className="text-blue-500">vo</span> App</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Fast. Trusted. Done.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                <Loader2 size={18} className="animate-spin" />
                <span>Launching Mobile Experience...</span>
              </div>
            </div>
          ) : (
            /* Phase 2: Login Form with Skip */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header with Skip at Top Right */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 p-1 flex items-center justify-center overflow-hidden">
                    <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Welcome to Fixvo</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Log in or continue as guest</p>
                  </div>
                </div>

                {/* SKIP OPTION AT TOP RIGHT CORNER */}
                <button
                  onClick={handleSkip}
                  className="px-3.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 hover:text-white rounded-full text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Skip</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Mobile Number Login Form */}
              <form onSubmit={handleMobileSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-blue-400" /> Enter Mobile Number
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-950 border border-slate-800 p-2 focus-within:border-blue-500 transition-all">
                    <span className="px-2.5 py-1 text-xs font-extrabold text-slate-400 border-r border-slate-800">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="Enter 10-digit mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Get OTP & Continue'}
                </button>
              </form>

              {/* Social Login Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-800"></div>
                <span className="absolute bg-slate-900 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Or continue with
                </span>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <FaGoogle size={14} className="text-rose-500" />
                <span>Continue with Google</span>
              </button>

              {/* Footer Notice */}
              <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>100% Safe & Verified Fixvo Platform</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OpenAppModal;
