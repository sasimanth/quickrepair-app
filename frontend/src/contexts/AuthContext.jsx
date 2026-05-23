import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { logout as authLogout } from '../services/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        setSession({ token, user: data.user });
      } catch (err) {
        console.error('Failed to authenticate:', err.response?.data?.message || err.message);
        authLogout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const logout = () => {
    authLogout();
    setUser(null);
    setSession(null);
    window.location.reload();
  };


  return (
    <AuthContext.Provider value={{ session, user, setUser, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
