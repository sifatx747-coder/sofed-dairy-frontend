'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (phone, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { phone, password } });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api('/auth/register', { method: 'POST', body: payload });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';
  const isStaff = isAdmin || isEmployee; // can run admin-side daily operations

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, login, register, logout, isAdmin, isEmployee, isStaff }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
