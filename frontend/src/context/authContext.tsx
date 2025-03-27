import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';

// User definition
type User = {
  id: string;
  name: string;
  email: string;
} | null;

// Auth context definition
interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth context provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth context provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getUserData();
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await authService.login(email, password);
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
      });
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await authService.register(name, email, password);
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
      });
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Context
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}