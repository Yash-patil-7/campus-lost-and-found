import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch, getAuthToken, setAuthToken, removeAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await apiFetch<User>('/auth/me');
      setUser(userData);
    } catch {
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
