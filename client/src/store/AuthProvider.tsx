import React, { useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/authService';
import { AuthContext } from './authContext';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Authentication initialization failed', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (idToken: string) => {
    setLoading(true);
    try {
      const { user: userData } = await authService.loginWithGoogle(idToken);
      setUser(userData);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
