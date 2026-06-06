import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

import { login } from '../services/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await login({
        email: formData.email,
        password: formData.password
      });

      let role = data.role || 'user';
      const queryParams = new URLSearchParams(document.location.search);
      const redirectPath = queryParams.get('redirect');
      if (redirectPath && role === 'user') {
         navigate(redirectPath);
      } else {
         navigate(role === 'admin' ? '/admin-dashboard' : role === 'technician' ? '/technician-dashboard' : '/dashboard');
      }
      window.location.reload();
    } catch (err) {
      if (err.status === 403) {
         setError('Your email is not verified. Please complete sign up verification.');
      } else {
         setError(err.response?.data?.message || err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-4 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '7s' }}></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/0 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '10s' }}></div>
      
      <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 border border-white/50 p-8 sm:p-12 animate-in zoom-in-95 duration-500">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Wrench className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 font-medium mt-2">Sign in to manage your repair requests</p>
        </div>
        
        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-bold border border-rose-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 text-xs text-center border border-rose-300">!</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                type="email"
                name="email"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-blue-500 rounded-2xl focus:ring-4 focus:ring-blue-50 transition-all font-medium text-slate-800 outline-none"
                placeholder="hello@fixvo.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">Forgot password?</a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-blue-500 rounded-2xl focus:ring-4 focus:ring-blue-50 transition-all font-medium text-slate-800 outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-2 rounded-2xl text-white font-bold text-lg shadow-xl outline-none transition-all duration-300 flex items-center justify-center gap-2 group ${
              loading ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-indigo-500/30 transform hover:-translate-y-1'
            }`}
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={22} /> Authenticating...</>
            ) : (
              <>Sign In <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20}/></>
            )}
          </button>
        </form>
        

        <p className="mt-10 text-center text-slate-500 font-medium">
          New to Fixvo?{' '}
          <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
