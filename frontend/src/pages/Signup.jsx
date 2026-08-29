import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, User, Phone, Briefcase, MapPin, ArrowRight, Loader2, X, Check, Search, RefreshCw } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import CanvasCaptcha from '../components/CanvasCaptcha';
import { register } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { globalServices } from '../data/services';
import SearchableServiceSelector from '../components/SearchableServiceSelector';
import SearchableAreaSelector from '../components/SearchableAreaSelector';

const Signup = () => {
  const { setUser } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        const { data } = await api.post('/auth/google', {
          accessToken: tokenResponse.access_token,
          idToken: tokenResponse.id_token
        });

        const userObj = data.user || data;
        if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
        if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);

        const targetPath = userObj.role === 'admin' 
          ? '/admin-dashboard' 
          : userObj.role === 'technician' 
            ? '/technician-dashboard' 
            : '/dashboard';

        navigate(targetPath);
      } catch (err) {
        console.error('Google Sign-Up backend error:', err);
        setError(err.response?.data?.message || 'Unable to complete Google registration. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.warn('Google Sign-Up error:', errorResponse);
      setGoogleLoading(false);
      setError('Google registration was cancelled or encountered an error. Please try again.');
    }
  });

  // Password Complexity Verification State
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });

  // CAPTCHA Challenge Verification States
  const [captchaText, setCaptchaText] = useState('');
  const [captchaSolution, setCaptchaSolution] = useState('');

  const generateCaptchaText = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing letters
    let text = '';
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  };

  const handleRefreshCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    setCaptchaSolution('');
  };

  // Generate CAPTCHA code on mount
  useEffect(() => {
    setCaptchaText(generateCaptchaText());
  }, []);

  const checkPasswordStrength = (pwd) => {
    setPasswordStrength({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      specialChar: /[^A-Za-z0-9]/.test(pwd)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') {
      checkPasswordStrength(value);
    }
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

    // Verify password meets all complexity rules
    const isStrongPassword = Object.values(passwordStrength).every(Boolean);
    if (!isStrongPassword) {
      return setError('Password must meet all complexity requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character).');
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

    // Verify visual CAPTCHA solution
    if (!captchaSolution) {
      return setError('Please enter the visual CAPTCHA verification code.');
    }

    setLoading(true);
    try {
      // Validate CAPTCHA server-side first
      await api.post('/auth/captcha-verify', {
        userSolution: captchaSolution,
        captchaText
      });
    } catch (captchaErr) {
      setLoading(false);
      setError('CAPTCHA verification failed. Please check the security code.');
      handleRefreshCaptcha();
      return;
    }
 
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
      
      const userObj = data.user || data;
      if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
      if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
      setUser(userObj);

      let role = data.role || userObj.role || 'user';
      const queryParams = new URLSearchParams(document.location.search);
      const redirectPath = queryParams.get('redirect');
      if (redirectPath && role === 'user') {
         navigate(redirectPath);
      } else {
         navigate(role === 'admin' ? '/admin-dashboard' : role === 'technician' ? '/technician-dashboard' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register.');
      handleRefreshCaptcha();
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

            {/* Real-time Password Strength Check List */}
            {formData.password && (
              <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold animate-in fade-in duration-300">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${passwordStrength.length ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {passwordStrength.length ? '✓' : '✗'}
                  </span>
                  <span className={passwordStrength.length ? 'text-emerald-600' : ''}>8+ Characters</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${passwordStrength.uppercase ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {passwordStrength.uppercase ? '✓' : '✗'}
                  </span>
                  <span className={passwordStrength.uppercase ? 'text-emerald-600' : ''}>Uppercase Letter</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${passwordStrength.lowercase ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {passwordStrength.lowercase ? '✓' : '✗'}
                  </span>
                  <span className={passwordStrength.lowercase ? 'text-emerald-600' : ''}>Lowercase Letter</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${passwordStrength.number ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {passwordStrength.number ? '✓' : '✗'}
                  </span>
                  <span className={passwordStrength.number ? 'text-emerald-600' : ''}>At least 1 number</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 col-span-1 sm:col-span-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${passwordStrength.specialChar ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {passwordStrength.specialChar ? '✓' : '✗'}
                  </span>
                  <span className={passwordStrength.specialChar ? 'text-emerald-600' : ''}>At least 1 special char (!@#$ etc)</span>
                </div>
              </div>
            )}
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

          {/* CAPTCHA Challenge Widget */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
            <label className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest block">
              Security Verification Challenge
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <CanvasCaptcha captchaText={captchaText} onRefresh={handleRefreshCaptcha} />
              <input
                type="text"
                maxLength={5}
                value={captchaSolution}
                onChange={(e) => setCaptchaSolution(e.target.value.toUpperCase())}
                placeholder="Enter CAPTCHA code"
                className="bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-center font-mono text-lg font-bold outline-none flex-1 tracking-widest"
              />
            </div>
          </div>

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
                  <a href="/technician-agreement" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">
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
        
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative bg-white/90 px-4 text-xs uppercase font-extrabold text-slate-400">OR</div>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');
            googleLogin();
          }}
          disabled={loading || googleLoading}
          className="w-full py-3.5 bg-white border-2 border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer outline-none hover:border-slate-300 transform hover:-translate-y-0.5"
        >
          {googleLoading ? (
            <><Loader2 className="animate-spin text-blue-600" size={20} /><span>Signing up with Google...</span></>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

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
