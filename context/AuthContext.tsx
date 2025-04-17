import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { User, VerifyOTPResponse } from '@/types/api';
import { api } from '@/utils/api';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (response: VerifyOTPResponse) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const userData = await api.auth.getCurrentUser();
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Treat any error as unauthenticated
      console.debug('Not authenticated:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check auth status when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAuthStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Login function that sets the user from verify OTP response
  const login = async (response: VerifyOTPResponse) => {
    try {
      if (!response.user) {
        throw new Error('No user data in response');
      }
      setUser(response.user);
    } catch (error) {
      console.error('Failed to process login:', error);
      throw error;
    }
  };

  // Logout function - will clear the cookie by server
  const logout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  // Don't render children until the initial auth check is complete
  if (isLoading) {
    return null; // Or return a loading component if preferred
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
