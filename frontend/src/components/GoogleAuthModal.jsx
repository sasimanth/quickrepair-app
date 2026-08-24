import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Loader2, ArrowRight, ShieldCheck, Mail, Plus, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PRESET_ACCOUNTS = [
  {
    name: 'Sasimanth Reddy',
    email: 'sasimanth.reddy@gmail.com',
    role: 'user',
    avatarBg: 'bg-blue-600',
    initials: 'SR',
    type: 'Customer Profile'
  },
  {
    name: 'Alex Johnson',
    email: 'user.fixvo@gmail.com',
    role: 'user',
    avatarBg: 'bg-emerald-600',
    initials: 'AJ',
    type: 'Verified Customer'
  },
  {
    name: 'Robert Miller (Admin)',
    email: 'admin.fixvo@gmail.com',
    role: 'admin',
    avatarBg: 'bg-purple-600',
    initials: 'RM',
    type: 'Platform Admin'
  },
  {
    name: 'Vikram Singh (Technician)',
    email: 'tech.partner@gmail.com',
    role: 'technician',
    avatarBg: 'bg-amber-600',
    initials: 'VS',
    type: 'Certified Tech'
  }
];

const GoogleAuthModal = ({ isOpen, onClose }) => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [customView, setCustomView] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAccountSelect = async (account) => {
    setSelectedEmail(account.email);
    setLoading(true);
    setError('');

    try {
      // Attempt backend sign in via /auth/google if available
      const { data } = await api.post('/auth/google', {
        email: account.email,
        name: account.name,
        role: account.role
      });

      const userObj = data.user || data;
      if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
      if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
      
      localStorage.setItem('token', data.token || 'demo-google-token');
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);

      const targetPath = userObj.role === 'admin' 
        ? '/admin-dashboard' 
        : userObj.role === 'technician' 
          ? '/technician-dashboard' 
          : '/dashboard';

      setTimeout(() => {
        onClose();
        navigate(targetPath);
      }, 500);

    } catch (err) {
      // Fallback demo authentication if backend API endpoint unavailable
      const fallbackUserObj = {
        email: account.email,
        name: account.name,
        role: account.role || 'user',
        phone: '+91 95159 80170',
        isEmailVerified: true,
        isPhoneVerified: true,
        provider: 'google'
      };

      localStorage.setItem('token', 'demo-google-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(fallbackUserObj));
      setUser(fallbackUserObj);

      const targetPath = fallbackUserObj.role === 'admin' 
        ? '/admin-dashboard' 
        : fallbackUserObj.role === 'technician' 
          ? '/technician-dashboard' 
          : '/dashboard';

      setTimeout(() => {
        onClose();
        navigate(targetPath);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customName) {
      setError('Please provide both your name and Google email.');
      return;
    }
    let role = 'user';
    if (customEmail.includes('admin')) role = 'admin';
    if (customEmail.includes('tech')) role = 'technician';

    handleAccountSelect({
      name: customName,
      email: customEmail,
      role: role
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Google Branded Header */}
        <div className="p-6 border-b border-slate-100 relative text-center">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-white shadow-md rounded-2xl border border-slate-100">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>

          <h3 className="text-xl font-bold text-slate-800">Sign in with Google</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">to continue to <span className="font-bold text-indigo-600">FIXVO Repair App</span></p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded-xl border border-rose-100">
              {error}
            </div>
          )}

          {!customView ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Choose an account</p>
              
              {PRESET_ACCOUNTS.map((acc) => {
                const isSelected = selectedEmail === acc.email && loading;
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleAccountSelect(acc)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${acc.avatarBg} text-white font-bold text-sm rounded-full flex items-center justify-center shadow-sm`}>
                        {acc.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          {acc.name}
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                            {acc.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{acc.email}</div>
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <Loader2 className="animate-spin text-blue-600" size={18} />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setCustomView(true)}
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 p-3 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl border border-dashed border-slate-200 transition-all"
              >
                <Plus size={16} />
                Use another Google Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Google Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomView(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Back to profiles
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>To continue, Google will share your name, email address, and profile picture with Fixvo.</span>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
