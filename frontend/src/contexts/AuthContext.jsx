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
        const userObj = data.user || data;
        setUser(userObj);
        setSession({ token, user: userObj });
      } catch (err) {
        console.error('Failed to authenticate via API, checking fallback session:', err.response?.data?.message || err.message);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            const userObj = parsed.user || parsed;
            if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
            if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
            setUser(userObj);
            setSession({ token, user: userObj });
          } catch (e) {
            authLogout();
          }
        } else {
          authLogout();
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const loginUser = async (token, fallbackUser = null) => {
    if (token) localStorage.setItem('token', token);
    try {
      const { data } = await api.get('/auth/me');
      const userObj = data.user || data;
      setUser(userObj);
      setSession({ token, user: userObj });
      return userObj;
    } catch (err) {
      console.warn('Backend /auth/me call failed during loginUser, using fallback:', err.message);
      const userObj = fallbackUser || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.user || JSON.parse(localStorage.getItem('user')) : null);
      if (userObj) {
        if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
        if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
        setUser(userObj);
        setSession({ token, user: userObj });
        return userObj;
      }
    }
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
    setSession(null);
    window.location.reload();
  };


  return (
    <AuthContext.Provider value={{ session, user, setUser, logout, loading, loginUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
