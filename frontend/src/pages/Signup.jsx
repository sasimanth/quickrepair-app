import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, User, Phone, Briefcase, MapPin, ArrowRight, Loader2, X, Check, Search } from 'lucide-react';
import { register } from '../services/auth';
import { globalServices } from '../data/services';

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
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'skills') {
      // Multi-select handled by checkbox
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const toggleService = (serviceId) => {
    setFormData(prev => {
      const currentSkills = prev.skills;
      if (currentSkills.includes(serviceId)) {
        return { ...prev, skills: currentSkills.filter(s => s !== serviceId) };
      } else {
        return { ...prev, skills: [...currentSkills, serviceId] };
      }
    });
  };

  const filteredServices = globalServices.filter(service =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const selectedServices = globalServices.filter(s => formData.skills.includes(s.id));

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
              <input type="email" name="email" required className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="hello@fixvo.com" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input type="password" name="password" required autoComplete="new-password" className="w-full pl-11 pr-4 py-3.5 bg-white/80 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-slate-800 outline-none" placeholder="••••••••" value={formData.password} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Account Type</label>
            <div className="relative">
              <select name="role" className="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700 outline-none transition-all cursor-pointer appearance-none" value={formData.role} onChange={handleChange}>
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
                
                {/* Services Grid Multi-Select */}
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest ml-1 block">
                    Services You Offer
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {globalServices.map((service) => {
                      const isSelected = formData.skills.includes(service.id);
                      const Icon = service.icon || Wrench;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={`relative overflow-hidden p-4 rounded-2xl text-left border-2 transition-all duration-300 transform active:scale-95 flex flex-col justify-between h-28 cursor-pointer select-none ${
                            isSelected
                              ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-100/50 shadow-md shadow-indigo-100'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className={`p-2 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <Icon size={16} />
                            </div>
                            
                            {/* Animated checkmark */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 scale-100 opacity-100 rotate-0' 
                                : 'border-slate-200 scale-75 opacity-0 rotate-45'
                            }`}>
                              <Check size={12} className="text-white" />
                            </div>
                          </div>
                          
                          <span className={`text-xs font-black leading-tight tracking-tight mt-auto ${isSelected ? 'text-indigo-950' : 'text-slate-700'}`}>
                            {service.name}
                          </span>
                          
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-500/5 blur-xl pointer-events-none rounded-2xl"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Searchable Service Area Selector */}
                <div className="space-y-2 relative">
                  <label className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest ml-1 block">
                    Service Area
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-left text-sm font-bold text-slate-700 flex items-center justify-between hover:border-indigo-300 transition-all relative cursor-pointer outline-none"
                  >
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <span>{formData.location || 'Select your service area'}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showAreaDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAreaDropdown && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 bg-slate-50/50 border-b border-slate-100 relative">
                        <input
                          type="text"
                          placeholder="Search service area..."
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
                        />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                        {['Madanapalle', 'Kadiri', 'Rayachoty', 'Galiveedu']
                          .filter(area => area.toLowerCase().includes(areaSearch.toLowerCase()))
                          .map((area) => {
                            const isSelected = formData.location === area;
                            return (
                              <button
                                key={area}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, location: area }));
                                  setShowAreaDropdown(false);
                                  setAreaSearch('');
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-indigo-50 text-indigo-600' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <span>{area}</span>
                                {isSelected && <Check size={14} className="text-indigo-600" />}
                              </button>
                            );
                          })}
                        {['Madanapalle', 'Kadiri', 'Rayachoty', 'Galiveedu'].filter(area => area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                          <p className="p-3 text-xs text-slate-400 italic text-center">No service areas found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Availability Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Availability Status</label>
                  <div className="relative group">
                    <select name="availability" className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium outline-none cursor-pointer" value={formData.availability} onChange={handleChange}>
                      <option value="available">🟢 Available (Receive alerts immediately)</option>
                      <option value="offline">⚪ Offline (Unavailable for bookings)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

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
