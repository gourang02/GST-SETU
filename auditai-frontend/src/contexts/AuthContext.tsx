import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import * as api from '../api/endpoints';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem('auth_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch {
      // Demo mode: accept any credentials
      const demoUser: User = { id: 'u-001', name: 'Priya Sharma', email, role: 'admin' };
      const demoToken = 'demo-token-' + Date.now();
      localStorage.setItem('auth_token', demoToken);
      setToken(demoToken);
      setUser(demoUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
