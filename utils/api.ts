import type { 
  APIResponse, 
  CartItem,
  Category, 
  FeaturedHeroProduct, 
  PaginatedResponse, 
  Product,
  RequestOTPResponse,
  VerifyOTPResponse,
  User,
  Order
} from '@/types/api';

const API_BASE_URL = 'https://lelehaat.com';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important: This enables cookie handling
  });

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text(); // Try to get error body as text
    } catch (e) {
      // Ignore if reading body fails
    }
    console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  // Handle potential empty responses for non-GET requests
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return {} as T; // Return an empty object or handle as appropriate
  }

  const data = await response.json();
  return data;
}

export const api = {
  auth: {
    requestOtp: (email: string) =>
      fetchApi<RequestOTPResponse>('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    verifyOtp: (email: string, otp: string) =>
      fetchApi<VerifyOTPResponse>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),
    register: (userData: Omit<User, 'id' | 'approved' | 'rejected' | 'isCoAdmin' | 'permissions'>) =>
      fetchApi<APIResponse<User>>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getCurrentUser: () =>
      fetchApi<User>('/api/user'),
  },
  home: {
    // Update the return type to expect a direct array
    getFeaturedProducts: () => fetchApi<FeaturedHeroProduct[]>('/api/featured-hero-products'),
    // Update the return type to expect a direct array
    getCategories: () => fetchApi<Category[]>('/api/categories'),
  },
  cart: {
    getItems: () => 
      fetchApi<CartItem[]>('/api/cart'),
    addItem: (productId: number, quantity: number = 1) =>
      fetchApi<CartItem>('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      }),
    updateQuantity: (id: number, quantity: number) =>
      fetchApi<CartItem>(`/api/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    removeItem: (id: number) => // Use fetchApi helper
      fetchApi<void>(`/api/cart/${id}`, {
        method: 'DELETE',
      }),
  },
  products: { // Ensure products object is correctly defined
    getById: (id: string) => fetchApi<Product>(`/api/products/${id}`),
    // Add function to get products by category
    getByCategory: (categoryName: string, page = 1, limit = 16) =>
      fetchApi<PaginatedResponse<Product>>(
        `/api/products?category=${encodeURIComponent(categoryName)}&page=${page}&limit=${limit}`
      ),
    // Add function to get all products with pagination
    getAll: (page = 1, limit = 16) =>
      fetchApi<PaginatedResponse<Product>>(`/api/products?page=${page}&limit=${limit}`),
    search: (query: string) => 
      fetchApi<PaginatedResponse<Product>>(`/api/search?q=${encodeURIComponent(query)}`),
  },
  orders: {
    getOrders: () => fetchApi<Order[]>('/api/orders'),
    getOrderById: (id: number) => fetchApi<Order>(`/api/orders/${id}`),
  },
};
