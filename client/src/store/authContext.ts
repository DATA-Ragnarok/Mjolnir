import { createContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
