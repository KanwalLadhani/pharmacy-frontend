import React, { createContext, useContext, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('medistore_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check token expiry
        if (decoded.exp * 1000 > Date.now()) {
          return { token, username: decoded.sub, role: decoded.role };
        }
      } catch {
        /* invalid token */
      }
      localStorage.removeItem('medistore_token');
    }
    return null;
  });

  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, role } = response.data;
    localStorage.setItem('medistore_token', token);
    const decoded = jwtDecode(token);
    const userData = { token, username: decoded.sub, role };
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('medistore_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
