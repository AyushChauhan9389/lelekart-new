import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { User, VerifyOTPResponse, CartItem, WishlistItem } from '@/types/api';
import { api } from '@/utils/api';
import { router } from 'expo-router';
import { storage } from '@/utils/storage';

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

  // Login function that sets the user and merges local data
  const login = async (response: VerifyOTPResponse) => {
    try {
      if (!response.user) {
        throw new Error('No user data in response');
      }

      // Set user first to enable API calls
      setUser(response.user);

      // Fetch current server cart and wishlist
      const [serverCart, serverWishlist] = await Promise.all([
        api.cart.getItems(),
        api.wishlist.getItems(),
      ]);

      // Merge local cart with server cart
      const mergedCart = await storage.mergeWithServer.mergeCart(serverCart);
      
      // Update server with merged cart items
      await Promise.all(mergedCart.map(async (item) => {
        if (item.id === 0) {
          // New item from local storage
          await api.cart.addItem(item.product.id, item.quantity);
        } else {
          // Existing item with updated quantity
          await api.cart.updateQuantity(item.id, item.quantity);
        }
      }));

      // Merge local wishlist with server wishlist
      const mergedWishlist = await storage.mergeWithServer.mergeWishlist(serverWishlist);
      
      // Update server with merged wishlist items
      await Promise.all(mergedWishlist.map(async (item) => {
        if (item.id === 0) {
          // New item from local storage
          await api.wishlist.addItem(item.productId);
        }
      }));

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
