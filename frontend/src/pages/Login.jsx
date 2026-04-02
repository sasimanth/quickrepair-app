import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { insforge } from '../services/insforge';

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
      const { data, error: loginError } = await insforge.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (loginError) throw loginError;

      let role = data.user.user_metadata?.role || data.user.app_metadata?.role || 'user';
      if (data.user.email?.includes('+admin') || data.user.email?.startsWith('admin')) role = 'admin';
      if (data.user.email?.includes('+tech') || data.user.email?.startsWith('tech')) role = 'technician';
      navigate(role === 'admin' ? '/admin-dashboard' : role === 'technician' ? '/technician-dashboard' : '/dashboard');
      window.location.reload();
    } catch (err) {
      if (err.status === 403) {
         setError('Your email is not verified. Please complete sign up verification.');
      } else {
         setError(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      await insforge.auth.signInWithOAuth({
        provider: provider,
        redirectTo: window.location.origin
      });
    } catch (err) {
      setError(`Failed to login with ${provider}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-medium transition-colors mb-4 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className="relative flex items-center py-5">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or continue with</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleOAuthLogin('google')}
          className="flex justify-center items-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 mr-2" alt="Google" />
          <span className="text-sm font-medium text-gray-700">Google</span>
        </button>
        <button 
          onClick={() => handleOAuthLogin('github')}
          className="flex justify-center items-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.svgrepo.com/show/512317/github-142.svg" className="h-5 w-5 mr-2" alt="GitHub" />
          <span className="text-sm font-medium text-gray-700">GitHub</span>
        </button>
      </div>

      <p className="mt-8 text-center text-gray-600">
        Don't have an account?{' '}
        <Link to="/signup" className="text-blue-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
