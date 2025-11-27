import axiosClient from './axiosClient';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  salesRepId: string;
  quoteId?: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  customer?: any;
  items?: any[];
}

export const orderApi = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    salesRepId?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await axiosClient.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<{ success: boolean; data: Order }> => {
    const response = await axiosClient.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: {
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
    }>;
    quoteId?: string;
  }) => {
    const response = await axiosClient.post('/orders', data);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const response = await axiosClient.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};
