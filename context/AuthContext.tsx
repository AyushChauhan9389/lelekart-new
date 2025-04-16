import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Assuming AsyncStorage for persistence
import type { User } from '@/types/api'; // Assuming User type exists

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>; // Example login function
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until checked

  // Check initial auth status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token'); // Assuming token is stored too
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load auth status:', error);
        setUser(null); // Ensure user is null on error
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Placeholder login function
  const login = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', token); // Store token
      setUser(userData);
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  };

  // Placeholder logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token'); // Remove token
      setUser(null);
    } catch (error) {
      console.error('Failed to remove auth data:', error);
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
