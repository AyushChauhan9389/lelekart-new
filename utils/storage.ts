import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, WishlistItem, Product } from '@/types/api';

const CART_STORAGE_KEY = '@app_cart';
const WISHLIST_STORAGE_KEY = '@app_wishlist';

// CartItem structure for local storage (simplified without userId)
interface StoredProduct extends Product {
  variants?: any[];
  gstDetails?: {
    gstRate: number;
    basePrice: number;
    gstAmount: number;
    priceWithGst: number;
  };
  sellerName?: string;
  sellerUsername?: string;
  categoryGstRate?: string;
}

interface LocalCartItem {
  quantity: number;
  product: StoredProduct;
}

interface LocalWishlistItem {
  productId: number;
  product: StoredProduct;
  dateAdded: string;
}

export const storage = {
  cart: {
    async getItems(): Promise<LocalCartItem[]> {
      try {
        const items = await AsyncStorage.getItem(CART_STORAGE_KEY);
        return items ? JSON.parse(items) : [];
      } catch (error) {
        console.error('Failed to get cart from storage:', error);
        return [];
      }
    },

    async addItem(product: StoredProduct, quantity: number = 1): Promise<void> {
      try {
        const items = await this.getItems();
        const existingItem = items.find(item => item.product.id === product.id);

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          items.push({ product, quantity });
        }

        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Failed to add item to cart storage:', error);
      }
    },

    async updateQuantity(productId: number, quantity: number): Promise<void> {
      try {
        const items = await this.getItems();
        const item = items.find(item => item.product.id === productId);
        
        if (item) {
          item.quantity = quantity;
          await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
      } catch (error) {
        console.error('Failed to update quantity in cart storage:', error);
      }
    },

    async removeItem(productId: number): Promise<void> {
      try {
        const items = await this.getItems();
        const filteredItems = items.filter(item => item.product.id !== productId);
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filteredItems));
      } catch (error) {
        console.error('Failed to remove item from cart storage:', error);
      }
    },

    async clear(): Promise<void> {
      try {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear cart storage:', error);
      }
    }
  },

  wishlist: {
    async getItems(): Promise<LocalWishlistItem[]> {
      try {
        const items = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
        return items ? JSON.parse(items) : [];
      } catch (error) {
        console.error('Failed to get wishlist from storage:', error);
        return [];
      }
    },

    async addItem(product: StoredProduct): Promise<void> {
      try {
        const items = await this.getItems();
        if (!items.some(item => item.productId === product.id)) {
          items.push({
            productId: product.id,
            product,
            dateAdded: new Date().toISOString()
          });
          await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
        }
      } catch (error) {
        console.error('Failed to add item to wishlist storage:', error);
      }
    },

    async removeItem(productId: number): Promise<void> {
      try {
        const items = await this.getItems();
        const filteredItems = items.filter(item => item.productId !== productId);
        await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(filteredItems));
      } catch (error) {
        console.error('Failed to remove item from wishlist storage:', error);
      }
    },

    async clear(): Promise<void> {
      try {
        await AsyncStorage.removeItem(WISHLIST_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear wishlist storage:', error);
      }
    }
  },

  // Helper function to merge local and server data
  mergeWithServer: {
    async mergeCart(serverItems: CartItem[]): Promise<CartItem[]> {
      try {
        const localItems = await storage.cart.getItems();
        
        // Create a map of server items by product ID
        const serverItemMap = new Map(serverItems.map(item => [item.product.id, item]));
        
        // Merge local items with server items
        for (const localItem of localItems) {
          const serverItem = serverItemMap.get(localItem.product.id);
          
          if (serverItem) {
            // If item exists in both, use higher quantity
            serverItem.quantity = Math.max(serverItem.quantity, localItem.quantity);
          } else {
            // If item only exists locally, add it to server items
            serverItems.push({
              id: 0, // Will be assigned by server
              userId: 0, // Will be assigned by server
              quantity: localItem.quantity,
              product: localItem.product
            });
          }
        }

        // Clear local cart after successful merge
        await storage.cart.clear();
        
        return serverItems;
      } catch (error) {
        console.error('Failed to merge cart:', error);
        return serverItems;
      }
    },

    async mergeWishlist(serverItems: WishlistItem[]): Promise<WishlistItem[]> {
      try {
        const localItems = await storage.wishlist.getItems();
        
        // Create a set of server product IDs
        const serverProductIds = new Set(serverItems.map(item => item.productId));
        
        // Add local items that don't exist in server
        for (const localItem of localItems) {
          if (!serverProductIds.has(localItem.productId)) {
            serverItems.push({
              id: 0, // Will be assigned by server
              userId: 0, // Will be assigned by server
              productId: localItem.productId,
              product: localItem.product,
              dateAdded: localItem.dateAdded
            });
          }
        }

        // Clear local wishlist after successful merge
        await storage.wishlist.clear();
        
        return serverItems;
      } catch (error) {
        console.error('Failed to merge wishlist:', error);
        return serverItems;
      }
    }
  }
};
