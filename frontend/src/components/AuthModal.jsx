import React, { useState } from 'react';
import { Mail, Lock, User, Phone, X, Loader2, ArrowRight } from 'lucide-react';
import { login, register } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ onClose, onSuccess }) => {
  const { loginUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (isSignUp) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Please enter a valid phone number (at least 10 digits).');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      const hasLower = /[a-z]/.test(formData.password);
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
      if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        setError('Password must include uppercase, lowercase, number, and a special character.');
        return;
      }
    }

    setLoading(true);
    try {
      let data;
      if (isSignUp) {
        data = await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'user'
        });
      } else {
        data = await login({
          email: formData.email,
          password: formData.password
        });
      }

      if (data.token) {
        await loginUser(data.token);
        onSuccess();
      } else {
        throw new Error('Authentication succeeded but no token was returned.');
      }
    } catch (err) {
      if (err.status === 403) {
        setError('Your email is not verified. Please verify your email.');
      } else {
        setError(err.response?.data?.message || err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/80 backdrop-blur-md transition-all duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#161D2E]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 p-8 sm:p-10 animate-in zoom-in-95 duration-200 text-white z-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all outline-none"
        >
          <X size={18} />
        </button>

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome back'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            {isSignUp ? 'Join Fixvo to book instant repairs' : 'Sign in to access your bookings'}
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-rose-500/10 text-rose-400 p-3.5 rounded-xl mb-5 text-xs font-bold border border-rose-500/20 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 text-[10px] border border-rose-500/30">!</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-[#0B0F19]/50 border border-white/10 focus:border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-[#0B0F19]/50 border border-white/10 focus:border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white outline-none"
                    placeholder="9515980170"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-[#0B0F19]/50 border border-white/10 focus:border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white outline-none"
                placeholder="hello@fixvo.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-[#0B0F19]/50 border border-white/10 focus:border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-semibold text-white outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 mt-2 rounded-xl text-white font-extrabold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group border-none cursor-pointer outline-none ${
              loading ? 'bg-slate-700 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/20 transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> Authenticating...</>
            ) : (
              <>
                {isSignUp ? 'Complete Registration' : 'Sign In'}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
              </>
            )}
          </button>
        </form>

        {/* Tab switch links */}
        <p className="mt-8 text-center text-xs text-slate-400 font-semibold">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-all bg-transparent border-none cursor-pointer ml-1 outline-none"
          >
            {isSignUp ? 'Sign In instantly' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
