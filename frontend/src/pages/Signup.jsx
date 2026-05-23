import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, User, Phone, Briefcase, MapPin, ArrowRight, Loader2, X, Check } from 'lucide-react';
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
      const search = document.location.search;
      navigate(role === 'admin' ? `/admin-dashboard${search}` : role === 'technician' ? `/technician-dashboard${search}` : `/dashboard${search}`);
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
                
                {/* Services Multi-Select */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Services You Offer</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                      className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-left text-sm font-medium text-slate-700 flex items-center justify-between hover:border-indigo-300 transition-colors"
                    >
                      <span>
                        {formData.skills.length === 0
                          ? 'Select services...'
                          : `${formData.skills.length} service${formData.skills.length !== 1 ? 's' : ''} selected`}
                      </span>
                      <Briefcase size={16} className="text-indigo-400" />
                    </button>

                    {showServiceDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-indigo-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                        <div className="sticky top-0 p-3 bg-indigo-50 border-b border-indigo-100">
                          <input
                            type="text"
                            placeholder="Search services..."
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
                          />
                        </div>
                        <div className="p-2 space-y-1">
                          {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                              <label key={service.id} className="flex items-center gap-3 p-2.5 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors group">
                                <input
                                  type="checkbox"
                                  checked={formData.skills.includes(service.id)}
                                  onChange={() => toggleService(service.id)}
                                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                                />
                                <span className="text-sm font-medium text-slate-700 flex-1">{service.name}</span>
                                {formData.skills.includes(service.id) && (
                                  <Check size={16} className="text-emerald-500" />
                                )}
                              </label>
                            ))
                          ) : (
                            <p className="px-3 py-2 text-sm text-slate-500 italic">No services found</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Services Display */}
                  {selectedServices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedServices.map(service => (
                        <div
                          key={service.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-sm"
                        >
                          <span>{service.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleService(service.id)}
                            className="hover:text-indigo-200 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Service Area */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Service Area</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 z-10" size={18} />
                    <select name="location" className="w-full pl-11 pr-4 py-3 bg-white border border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium outline-none appearance-none cursor-pointer" value={formData.location} onChange={handleChange} required={formData.role === 'technician'}>
                      <option value="" disabled>Select your service area</option>
                      <option value="Madanapalle">📍 Madanapalle</option>
                      <option value="Kadiri">📍 Kadiri</option>
                      <option value="Rayachoty">📍 Rayachoty</option>
                      <option value="Galiveedu">📍 Galiveedu</option>
                    </select>
                  </div>
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
