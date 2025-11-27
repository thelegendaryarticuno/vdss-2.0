import axiosClient from './axiosClient';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  unit?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const productApi = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  }) => {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<{ success: boolean; data: Product }> => {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  },
};
