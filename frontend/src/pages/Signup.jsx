import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, User, Phone, Briefcase, MapPin, ArrowRight, Loader2, X, Check, Search } from 'lucide-react';
import { register } from '../services/auth';
import { globalServices } from '../data/services';
import SearchableServiceSelector from '../components/SearchableServiceSelector';
import SearchableAreaSelector from '../components/SearchableAreaSelector';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    skills: [],
    location: '',
    availability: 'available',
    adminSecret: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTechTerms, setAgreeTechTerms] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
       return setError('Please enter a valid email address.');
    }
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
       return setError('Please enter a valid phone number (at least 10 digits).');
    }
    if (formData.password.length < 6) {
       return setError('Password must be at least 6 characters long.');
    }

    if (formData.role === 'technician') {
      if (formData.skills.length === 0) {
        return setError('Please select at least one service.');
      }
      if (!formData.location) {
        return setError('Please select a service area.');
      }
    }

    if (!agreeTerms || !agreePrivacy) {
      return setError('You must agree to the Terms & Conditions and Privacy Policy.');
    }
    if (formData.role === 'technician' && !agreeTechTerms) {
      return setError('You must agree to the Technician Service Agreement.');
    }

    setLoading(true);
    try {
      const data = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        skills: formData.role === 'technician' ? formData.skills : '',
        location: formData.location,
        availability: formData.role === 'technician' ? formData.availability : 'available',
        adminSecret: formData.role === 'admin' ? formData.adminSecret : ''
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
      setError(err.response?.data?.message || err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center p-4 overflow-hidden mb-12">
      {/* Background Orbs */}
      <div className="absolute top-10 right-20 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-400/20 to-cyan-400/0 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '12s' }}></div>
      
      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-300/30 border border-white p-8 sm:p-12 animate-in slide-in-from-bottom-8 duration-700 max-h-[95vh] overflow-y-auto">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Create an Account</h2>
        <p className="text-slate-500 font-medium mb-8">Join thousands of others upgrading their tech instantly.</p>
        
        {error && (
           <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-bold border border-rose-100 flex items-center gap-2 mb-8">
             <span className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 text-xs border border-rose-300">!</span>
             {error}
           </div>
        )}

        <form onSubmit={handleSignupSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="signup-name" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input id="signup-name" type="text" name="name" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="John Doe" value={formData.name} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="signup-phone" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input id="signup-phone" type="text" name="phone" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="signup-email" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input id="signup-email" type="email" name="email" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="hello@fixvo.com" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="signup-password" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input id="signup-password" type="password" name="password" required autoComplete="new-password" className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="••••••••" value={formData.password} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label htmlFor="signup-role" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Account Type</label>
            <div className="relative">
              <select id="signup-role" name="role" className="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all cursor-pointer appearance-none" value={formData.role} onChange={handleChange}>
                <option value="user">🛠️ Customer (I need a repair)</option>
                <option value="technician">💼 Technician (I can fix things)</option>
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
                
                {/* Services Searchable Dropdown Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest ml-1 block">
                    Services You Offer
                  </label>
                  <SearchableServiceSelector
                    value={formData.skills}
                    onChange={(skills) => setFormData(prev => ({ ...prev, skills }))}
                    multiSelect={true}
                    theme="light"
                    placeholder="Search and select services..."
                  />
                </div>

                {/* Searchable Service Area Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest ml-1 block">
                    Service Area
                  </label>
                  <SearchableAreaSelector
                    value={formData.location}
                    onChange={(location) => setFormData(prev => ({ ...prev, location }))}
                    theme="light"
                    placeholder="Search and select city..."
                  />
                </div>

                {/* Availability Status */}
                <div className="space-y-1">
                  <label htmlFor="signup-availability" className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Availability Status</label>
                  <div className="relative group">
                    <select id="signup-availability" name="availability" className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium outline-none cursor-pointer" value={formData.availability} onChange={handleChange}>
                      <option value="available">🟢 Available (Receive alerts immediately)</option>
                      <option value="offline">⚪ Offline (Unavailable for bookings)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal Compliance Checkboxes */}
          <div className="space-y-3 pt-2 text-slate-600 font-semibold text-sm">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Terms & Conditions
                </a>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>
                I agree to the{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>

            {formData.role === 'technician' && (
              <label className="flex items-start gap-3 cursor-pointer select-none animate-in fade-in duration-300">
                <input
                  type="checkbox"
                  checked={agreeTechTerms}
                  onChange={(e) => setAgreeTechTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span>
                  I agree to the{' '}
                  <a href="/technician-terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">
                    Technician Service Agreement
                  </a>
                </span>
              </label>
            )}
          </div>

          <button type="submit" disabled={loading} className={`w-full py-4 mt-6 rounded-2xl text-white font-bold text-lg shadow-xl outline-none transition-all duration-300 flex items-center justify-center gap-2 group ${loading ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-indigo-500/30 transform hover:-translate-y-1'}`}>
            {loading ? <><Loader2 className="animate-spin" size={22} /> Creating Account...</> : <>Complete Registration <ArrowRight className="group-hover:translate-x-1" size={20}/></>}
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
