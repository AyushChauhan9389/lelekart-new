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
  Order,
  WishlistItem,
  Address,
  Wallet,
  WalletTransaction, // Added
  WalletSettings, // Added
  PaymentResponse,
  PaymentVerificationResponse,
  NotificationPreferences,
  UserProfile,
  StoredProduct,
  ProductRatingResponse,
  Review,
  CreateReviewPayload
} from '@/types/api';

const API_BASE_URL = 'https://lelekart.in';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  console.log('[fetchApi] Sending Request Headers:', finalHeaders);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: finalHeaders,
    credentials: 'include',
  });

  const responseHeaders: { [key: string]: string } = {};
  response.headers.forEach((value: string, key: string) => {
    responseHeaders[key] = value;
  });
  console.log('Response Headers:', responseHeaders);

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch (e) {
      // Ignore if reading body fails
    }
    console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return {} as T;
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
    register: (userData: {
      username: string;
      email: string;
      role: 'buyer';
      name: string;
      phone: string;
      address: string;
    }) =>
      fetchApi<{
        user: User;
        message: string;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getCurrentUser: () =>
      fetchApi<User>('/api/user'),
    logout: () =>
      fetchApi<void>('/api/auth/logout', {
        method: 'POST',
      }),
    updateProfile: (data: UserProfile) =>
      fetchApi<User>('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getNotificationPreferences: () =>
      fetchApi<NotificationPreferences>('/api/user/notification-preferences'),
    updateNotificationPreferences: (prefs: NotificationPreferences) =>
      fetchApi<NotificationPreferences>('/api/user/notification-preferences', {
        method: 'POST',
        body: JSON.stringify(prefs),
      }),
  },
  home: {
    getFeaturedProducts: () => fetchApi<FeaturedHeroProduct[]>('/api/featured-hero-products'),
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
    removeItem: (id: number) =>
      fetchApi<void>(`/api/cart/${id}`, {
        method: 'DELETE',
      }),
  },
  products: {
    getById: (id: string) => fetchApi<StoredProduct>(`/api/products/${id}?variants=true`),
    getByCategory: (categoryName: string, page = 1, limit = 16) =>
      fetchApi<PaginatedResponse<Product>>( // Keep this type for now, handle response structure in component
        `/api/products?category=${encodeURIComponent(categoryName)}&page=${page}&limit=${limit}`
      ),
    getAll: (page = 1, limit = 16) =>
      fetchApi<PaginatedResponse<Product>>(`/api/products?page=${page}&limit=${limit}`), // Keep this type for now
    search: (query: string, limit: number = 6) =>
      fetchApi<PaginatedResponse<Product>>(`/api/lelekart-search?q=${encodeURIComponent(query)}&limit=${limit}`),
    getRating: (productId: string) =>
      fetchApi<ProductRatingResponse>(`/api/products/${productId}/rating`),
    getReviews: (productId: string) =>
      fetchApi<Review[]>(`/api/products/${productId}/reviews`),
    createReview: (productId: string, data: CreateReviewPayload) =>
      fetchApi<Review>(`/api/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  orders: {
    getOrders: async () => {
        const endpoint = '/api/orders';
        console.log(`[api.orders.getOrders] Requesting endpoint: ${endpoint}`);
        const response = await fetchApi<Order[]>(endpoint);
        console.log('[api.orders.getOrders] Response:', response);
        return {
            orders: response || [],
            total: response?.length || 0
        };
    },
    getOrderById: (id: number | string) =>
      fetchApi<Order>(`/api/orders/${id}`),
    cancelOrder: (id: number | string) => // Add cancelOrder function
      fetchApi<Order>(`/api/orders/${id}/cancel`, {
        method: 'POST',
      }),
    create: (data: {
      userId: number;
      total: number;
      status: string;
      paymentMethod: string;
      paymentId?: string | null;
      orderId?: string | null;
      shippingDetails: string;
    }) =>
      fetchApi<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getTracking: (id: number | string) =>
      fetchApi<{
        trackingId: string;
        courier: string;
        courierUrl: string;
        status: string;
        statusTimeline: {
          status: string;
          timestamp: string;
          description: string;
        }[];
        estimatedDelivery: string;
        currentLocation: string;
        lastUpdated: string;
      }>(`/api/orders/${id}/tracking`),
    getInvoicePdf: (id: number | string) =>
      fetch(`${API_BASE_URL}/api/orders/${id}/invoice`),
  },
  wishlist: {
    getItems: () => fetchApi<WishlistItem[]>('/api/wishlist'),
    addItem: (productId: number) =>
      fetchApi<WishlistItem>('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
    removeItem: (productId: number) =>
      fetchApi<void>(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      }),
    checkItem: (productId: number) =>
      fetchApi<{ inWishlist: boolean }>(`/api/wishlist/check/${productId}`),
  },
  addresses: {
    getAll: () =>
      fetchApi<Address[]>('/api/addresses'),
    add: (address: Omit<Address, 'id' | 'userId'>) =>
      fetchApi<Address>('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(address),
      }),
    update: (id: number, address: Partial<Address>) =>
      fetchApi<Address>(`/api/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(address),
      }),
    delete: (id: number) =>
      fetchApi<void>(`/api/addresses/${id}`, {
        method: 'DELETE',
      }),
    setDefault: (id: number) =>
      fetchApi<Address>(`/api/addresses/${id}/default`, {
        method: 'POST',
      }),
  },
  wallet: {
    getDetails: () =>
      fetchApi<Wallet>('/api/wallet'), // Existing getDetails
    getTransactions: () =>
      fetchApi<{ transactions: WalletTransaction[]; total: number }>('/api/wallet/transactions'),
    getSettings: () =>
      fetchApi<WalletSettings>('/api/wallet/settings'),
    validateRedemption: (amount: number, coinsToUse: number, categories: string[]) =>
      fetchApi<{
        valid: boolean;
        coinsApplicable: number;
        discount: number;
        finalAmount: number;
        message: string;
      }>('/api/wallet/validate-redemption', {
        method: 'POST',
        body: JSON.stringify({ amount, coinsToUse, categories }),
      }),
    redeem: (amount: number, referenceType: 'ORDER', referenceId: string, description: string) =>
      fetchApi<void>('/api/wallet/redeem', { // Expecting no content (204) or ignoring response body
        method: 'POST',
        body: JSON.stringify({ amount, referenceType, referenceId, description }),
      }),
  },
  payment: {
    createOrder: (amount: number) =>
      fetchApi<PaymentResponse>('/api/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
        }),
      }),
    verifyPayment: (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) =>
      fetchApi<PaymentVerificationResponse>('/api/verify-payment', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        }),
      }),
  },
};
