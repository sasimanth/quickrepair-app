import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { insforge } from '../services/insforge';

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
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signupError } = await insforge.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
            skills: formData.skills,
            location: formData.location
          }
        }
      });
      
      if (signupError) throw signupError;

      if (data?.requireEmailVerification) {
        setRequiresVerification(true);
      } else if (data?.session || data?.user) {
        let role = data.user.user_metadata?.role || data.user.app_metadata?.role || 'user';
        if (data.user.email?.includes('+admin') || data.user.email?.startsWith('admin')) role = 'admin';
        if (data.user.email?.includes('+tech') || data.user.email?.startsWith('tech')) role = 'technician';
        navigate(role === 'admin' ? '/admin-dashboard' : role === 'technician' ? '/technician-dashboard' : '/dashboard');
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: verifyError } = await insforge.auth.verifyEmail({
        email: formData.email,
        otp: otpCode
      });

      if (verifyError) throw verifyError;

      let role = data.user.user_metadata?.role || data.user.app_metadata?.role || 'user';
      if (data.user.email?.includes('+admin') || data.user.email?.startsWith('admin')) role = 'admin';
      if (data.user.email?.includes('+tech') || data.user.email?.startsWith('tech')) role = 'technician';
      navigate(role === 'admin' ? '/admin-dashboard' : role === 'technician' ? '/technician-dashboard' : '/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  if (requiresVerification) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-md border border-gray-100 mb-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Verify your email</h2>
        <p className="text-center text-gray-600 mb-6">We sent a 6-digit code to <span className="font-semibold">{formData.email}</span>.</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-2xl font-mono" 
              value={otpCode} 
              onChange={(e) => setOtpCode(e.target.value)} 
              maxLength={6} 
              placeholder="000000"
            />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 mt-4 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? 'Verifying...' : 'Verify & Complete'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-xl shadow-md border border-gray-100 mb-10">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create an Account</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="text" name="phone" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.phone} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input type="email" name="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.email} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" name="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.password} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">I want to register as a:</label>
          <select name="role" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" value={formData.role} onChange={handleChange}>
            <option value="user">Customer (Need a repair)</option>
            <option value="technician">Technician (Provide repairs)</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {formData.role === 'technician' && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-4 border border-blue-100">
            <h4 className="font-semibold text-blue-800">Technician Details</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input type="text" name="skills" placeholder="e.g. Mobile Repair, Laptops, MacBooks" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.skills} onChange={handleChange} required={formData.role === 'technician'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location/City Service Area</label>
              <input type="text" name="location" placeholder="e.g. New York, Downtown" className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.location} onChange={handleChange} required={formData.role === 'technician'} />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className={`w-full py-3 mt-4 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <p className="mt-6 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Signup;
