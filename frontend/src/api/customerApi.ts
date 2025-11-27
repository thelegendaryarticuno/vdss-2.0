import axiosClient from './axiosClient';

export interface Customer {
  id: string;
  code?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  segment?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends Customer {
  orders: any[];
  stats: {
    totalSales: number;
    totalOrders: number;
    lastOrderDate: string | null;
  };
}

export const customerApi = {
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    region?: string;
  }) => {
    const response = await axiosClient.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id: string): Promise<{ success: boolean; data: CustomerDetail }> => {
    const response = await axiosClient.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: Partial<Customer>) => {
    const response = await axiosClient.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<Customer>) => {
    const response = await axiosClient.put(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const response = await axiosClient.delete(`/customers/${id}`);
    return response.data;
  },
};
