import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, User, Phone, Briefcase, MapPin, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { register } from '../services/auth';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    skills: '',
    location: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        skills: formData.skills,
        location: formData.location
      });
      
      let role = data.role || 'user';
      navigate(role === 'admin' ? '/admin-dashboard' : role === 'technician' ? '/technician-dashboard' : '/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative min-h-[90vh] flex items-center justify-center p-4 overflow-hidden mb-12">
      {/* Background Orbs */}
      <div className="absolute top-10 right-20 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-400/20 to-cyan-400/0 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '12s' }}></div>
      
      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-300/30 border border-white p-8 sm:p-12 animate-in slide-in-from-bottom-8 duration-700">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Create an Account</h2>
        <p className="text-slate-500 font-medium mb-8">Join thousands of others upgrading their tech instantly.</p>
        
        {error && (
           <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-bold border border-rose-100 flex items-center gap-2 mb-8">
             <span className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 text-xs border border-rose-300">!</span>
             {error}
           </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input type="text" name="name" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="John Doe" value={formData.name} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input type="text" name="phone" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input type="email" name="email" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="hello@quickrepair.com" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input type="password" name="password" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="••••••••" value={formData.password} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Account Type</label>
            <div className="relative">
              <select name="role" className="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all cursor-pointer appearance-none" value={formData.role} onChange={handleChange}>
                <option value="user">🛠️ Customer (I need a repair)</option>
                <option value="technician">💼 Technician (I can fix things)</option>
                <option value="admin">🔒 Administrator</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {formData.role === 'technician' && (
            <div className="p-6 bg-indigo-50/50 rounded-3xl space-y-5 border border-indigo-100/50 animate-in fade-in slide-in-from-top-4">
              <h4 className="font-extrabold text-indigo-900 border-b border-indigo-100 pb-2">Technician Onboarding</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Primary Skills</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                    <input type="text" name="skills" placeholder="Mobile Repair, Laptops..." className="w-full pl-11 pr-4 py-3 bg-white border border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium outline-none" value={formData.skills} onChange={handleChange} required={formData.role === 'technician'} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Service Area</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                    <input type="text" name="location" placeholder="e.g. San Francisco, CA" className="w-full pl-11 pr-4 py-3 bg-white border border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium outline-none" value={formData.location} onChange={handleChange} required={formData.role === 'technician'} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full py-4 mt-6 rounded-2xl text-white font-bold text-lg shadow-xl outline-none transition-all duration-300 flex items-center justify-center gap-2 group ${loading ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-indigo-500/30 transform hover:-translate-y-1'}`}>
            {loading ? <><Loader2 className="animate-spin" size={22} /> Setting things up...</> : <>Complete Registration <ArrowRight className="group-hover:translate-x-1" size={20}/></>}
          </button>
        </form>
        
        <p className="mt-8 text-center text-slate-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors">
            Sign In instantly
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
