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
  isNewUser?: boolean; // Added optional isNewUser
  email?: string; // Added optional email
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
  pincode: string; // Reverted back to pincode
  isDefault?: boolean;
}

export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

// Updated to match the actual API structure { products: [], pagination: {} }
export interface PaginationInfo {
  currentPage: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean; // Keep hasMore if potentially used elsewhere or if API might add it
}

export interface PaginatedResponse<T> {
  products: T[];
  pagination: PaginationInfo;
  // total: number;
  // page: number;
  // limit: number;
  // hasMore: boolean;
}

export interface RatingCount {
  rating: number;
  count: number;
}

export interface ProductRatingResponse {
  averageRating: number;
  totalReviews: number;
  ratingCounts: RatingCount[];
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  orderId: number | null;
  rating: number;
  review: string;
  title: string;
  verifiedPurchase: boolean;
  status: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
}

// Define OrderItem based on usage in app/orders/[id].tsx
export interface OrderItem {
  id: number;
  quantity: number;
  price: number; // Price per item at the time of order
  productId: number;
  product?: { // Optional product details
    name?: string;
    imageUrl?: string;
    image_url?: string; // Handle potential inconsistency
  };
}

export interface ReviewUser {
  id: number;
  username: string;
  name: string;
  profileImage: string | null;
}

export interface CreateReviewPayload {
  productId: number;
  rating: number;
  review: string;
  title: string;
}

export interface WalletTransaction {
  id: number;
  userId: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: number | null;
  createdAt: string;
}

export interface WalletSettings {
  id: number;
  firstPurchaseCoins: number;
  coinToCurrencyRatio: string; // Keep as string as per API response
  minOrderValue: string;
  maxRedeemableCoins: number;
  coinExpiryDays: number;
  maxUsagePercentage: string;
  minCartValue: string;
  applicableCategories: string; // Could be parsed if needed
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
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
  subtitle?: string; // Added from sample
  description?: string; // Keep existing, mark as optional if not always present
  url: string; // Added from sample (image URL)
  imageUrl?: string; // Keep existing, mark as optional or remove if 'url' is the correct one
  alt?: string; // Added from sample
  buttonText?: string; // Added from sample
  category?: string; // Added from sample, optional
  badgeText?: string; // Added from sample, optional
  productId?: number | null; // Added from sample, optional and nullable
  position?: number; // Added from sample, optional
  link?: string; // Keep existing, mark as optional if not always present
}

export interface RequestOTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number; // Added optional expiresIn
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  username?: string; // Added for display
  phone?: string;
  email?: string;
  address?: string; // Added for editing
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentId?: string | null; // Allow null
  orderId?: string | null; // Allow null
  shippingDetails: { // Changed from string to object
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string; // Reverted back to pincode
    notes?: string;
  };
  items: OrderItem[]; // Changed from CartItem[]
  createdAt: string; // Keep createdAt if available
  date?: string; // Add date field if sometimes used
  // Add fields based on component usage and API sample
  totalAmount?: number; // Subtotal before discounts
  discountAmount?: number;
  walletDiscount?: number; // From API sample
  walletCoinsUsed?: number;
  finalAmount?: number; // Total after discounts/coins
  // Fields from API sample (might overlap or be redundant, include for completeness)
  shippingStatus?: string | null;
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  trackingDetails?: any | null; // Use 'any' or define specific type if known
  courierName?: string | null;
  awbCode?: string | null;
  estimatedDeliveryDate?: string | null;
  addressId?: number | null; // From API sample
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
  walletDiscount?: number; // Added for wallet usage
  walletCoinsUsed?: number; // Added for wallet usage
  items?: {
    productId: number;
    quantity: number;
  }[];
}
