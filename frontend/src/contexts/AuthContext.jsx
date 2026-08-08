import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { logout as authLogout } from '../services/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return { token, user: parsed.user || parsed };
      } catch (e) {}
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const u = parsed.user || parsed;
        if (u.isEmailVerified === undefined) u.isEmailVerified = true;
        if (u.isPhoneVerified === undefined) u.isPhoneVerified = true;
        return u;
      } catch (e) {}
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

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
        if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
        if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
        setUser(userObj);
        setSession({ token, user: userObj });
        localStorage.setItem('user', JSON.stringify(userObj));
      } catch (err) {
        console.warn('Background /auth/me check failed, keeping existing session:', err.message);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            const userObj = parsed.user || parsed;
            if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
            if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
            setUser(userObj);
            setSession({ token, user: userObj });
          } catch (e) {}
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
      if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
      if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
      setUser(userObj);
      setSession({ token, user: userObj });
      localStorage.setItem('user', JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      console.warn('Backend /auth/me call failed during loginUser, using fallback:', err.message);
      const userObj = fallbackUser || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.user || JSON.parse(localStorage.getItem('user')) : null);
      if (userObj) {
        if (userObj.isEmailVerified === undefined) userObj.isEmailVerified = true;
        if (userObj.isPhoneVerified === undefined) userObj.isPhoneVerified = true;
        setUser(userObj);
        setSession({ token, user: userObj });
        localStorage.setItem('user', JSON.stringify(userObj));
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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
