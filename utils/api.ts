import type { APIResponse, Category, FeaturedHeroProduct, PaginatedResponse, Product } from '@/types/api'; // Add PaginatedResponse and Product

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
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export const api = {
  auth: {
    requestOtp: (email: string) =>
      fetchApi('/api/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    verifyOtp: (email: string, otp: string) =>
      fetchApi('/api/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),
    register: (userData: any) =>
      fetchApi('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
  },
  home: {
    // Update the return type to expect a direct array
    getFeaturedProducts: () => fetchApi<FeaturedHeroProduct[]>('/api/featured-hero-products'),
    // Update the return type to expect a direct array
    getCategories: () => fetchApi<Category[]>('/api/categories'),
  },
  products: {
    getById: (id: string) => fetchApi(`/api/products/${id}`),
    // Add function to get products by category
    getByCategory: (categoryName: string, page = 1, limit = 16) =>
      fetchApi<PaginatedResponse<Product>>(
        `/api/products?category=${encodeURIComponent(categoryName)}&page=${page}&limit=${limit}`
      ),
    // Add function to get all products with pagination
    getAll: (page = 1, limit = 16) =>
      fetchApi<PaginatedResponse<Product>>(`/api/products?page=${page}&limit=${limit}`),
    search: (query: string) => fetchApi(`/api/search?q=${encodeURIComponent(query)}`),
  },
};
