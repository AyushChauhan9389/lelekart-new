export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  name: string;
  phone: string;
  address: string;
  approved: boolean;
  rejected: boolean;
  isCoAdmin: boolean;
  permissions: Record<string, any>;
}

export interface RequestOTPResponse {
  message: string;
  email: string;
  expiresIn: number;
}

export interface VerifyOTPResponse {
  user: User;
  isNewUser: boolean;
  message: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  specifications: string | null;
  sku: string;
  mrp: number;
  purchasePrice: number;
  price: number;
  category: string;
  color: string;
  size: string;
  image_url: string; // Changed from imageUrl to match list API
  imageUrl?: string; // Keep optional for single product API? Or handle mapping later. Let's start with image_url.
  images: string;
  sellerId: number;
  stock: number;
  approved: boolean;
  rejected: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  products?: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface APIResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Category {
  id: number;
  name: string;
  image: string;
  displayOrder: number;
}

export interface FeaturedHeroProduct {
  id: number;
  title: string;
  subtitle: string;
  url: string; // Image URL for the banner
  alt: string;
  buttonText: string;
  category: string; // Optional category link
  badgeText: string; // e.g., "HOT DEAL"
  productId: number | null; // Optional product link
  position: number;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  dateAdded: string;
}
