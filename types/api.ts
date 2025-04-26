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

export interface StoredProduct extends Product {
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
