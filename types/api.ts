export interface Product {
  id: number;
  name: string;
  description: string;
  specifications?: string;
  sku: string;
  mrp: number;
  purchasePrice: number | null;
  price: number;
  category?: string;
  categoryId?: number | null;
  subcategoryId?: number | null;
  color?: string;
  size?: string;
  imageUrl?: string;
  image_url?: string;
  images?: string | string[];
  sellerId?: number;
  stock?: number;
  gstRate?: string;
  approved?: boolean;
  rejected?: boolean;
  deleted?: boolean;
  isDraft?: boolean;
  createdAt?: string;
  // Additional fields used in UI
  rating?: number;
  reviewCount?: number | string;
  availableSizes?: string[];
  availableColors?: string[];
}

export interface CartItem {
  id: number;
  userId: number;
  quantity: number;
  product: Product;
}

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  dateAdded: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface VerifyOTPResponse {
  token: string;
  user: User;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
  images: string;
  createdAt: string;
  gstDetails: {
    gstRate: number;
    basePrice: number;
    gstAmount: number;
    priceWithGst: number;
  };
}

export interface StoredProduct extends Product {
  variants?: ProductVariant[];
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

export interface Address {
  id?: number;
  userId?: number;
  addressName?: string;
  fullName: string;
  phone: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  parentId?: number | null;
  displayOrder?: number;
  gstRate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturedHeroProduct {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

export interface RequestOTPResponse {
  success: boolean;
  message: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentId?: string;
  orderId?: string;
  shippingDetails: string;
  items: CartItem[];
  createdAt: string;
}

export interface Wallet {
  id: number;
  userId: number;
  balance: number;
  coins: number;
}

export interface PaymentResponse {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  orderId?: string;
}

export interface CreateOrderRequest {
  userId: number;
  total: number;
  status: string;
  paymentMethod: 'cod' | 'razorpay';
  paymentId?: string | null;
  orderId?: string | null;
  shippingDetails: string;
  addressId?: number;
  items?: {
    productId: number;
    quantity: number;
  }[];
}
