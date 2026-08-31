import api from './api';
import Cookies from 'js-cookie';

export interface User {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  isApproved: boolean;
  isAdmin: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
}

const TOKEN_NAME = 'token';

export const authService = {
  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    const { token, user } = response.data;
    
    // Set cookie with 7 days expiration (secure flag only if https to work on http localhost)
    const isSecure = window.location.protocol === 'https:';
    Cookies.set(TOKEN_NAME, token, { expires: 7, secure: isSecure, sameSite: 'Lax' });
    try {
      localStorage.setItem(TOKEN_NAME, token);
    } catch (_) {}
    
    return { token, user };
  },

  logout: () => {
    Cookies.remove(TOKEN_NAME);
    try {
      localStorage.removeItem(TOKEN_NAME);
    } catch (_) {}
  },

  getToken: () => {
    return Cookies.get(TOKEN_NAME) || localStorage.getItem(TOKEN_NAME);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }
};
