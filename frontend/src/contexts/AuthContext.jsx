import { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../services/insforge';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    const url = import.meta.env.VITE_INSFORGE_URL;
    const key = import.meta.env.VITE_INSFORGE_ANON_KEY;
    
    // Check if variables are missing or still using the default placeholder text
    if (!url || !key || url.includes('YOUR_INSFORGE') || key.includes('YOUR_INSFORGE')) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    // Get active user safely
    insforge.auth.getCurrentUser().then(({ data, error }) => {
      if (error) {
        console.error('Session error:', error.message);
      }
      setUser(data?.user || null);
      setSession(data?.user ? { user: data.user } : null);
      setLoading(false);
    }).catch(err => {
      console.error('Unexpected AuthContext error:', err.message);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await insforge.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md border border-red-200 max-w-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">InsForge Not Configured</h2>
          <p className="text-gray-700 mb-4">
            The application is showing a blank screen because the InsForge credentials are missing.
          </p>
          <div className="bg-gray-100 p-4 rounded text-left mb-6 overflow-x-auto text-sm">
            <p><strong>1.</strong> Open <code>frontend/.env</code></p>
            <p><strong>2.</strong> Add <code>VITE_INSFORGE_URL</code> and <code>VITE_INSFORGE_ANON_KEY</code></p>
            <p><strong>3.</strong> Restart your frontend terminal</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
