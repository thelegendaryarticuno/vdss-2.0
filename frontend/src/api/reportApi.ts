import axiosClient from './axiosClient';

export const reportApi = {
  getSalesSummary: async (params?: {
    from?: string;
    to?: string;
    groupBy?: 'customer' | 'product' | 'region';
  }) => {
    const response = await axiosClient.get('/reports/sales/summary', { params });
    return response.data;
  },

  getCustomerSalesHistory: async (customerId: string, months?: number) => {
    const response = await axiosClient.get(`/reports/sales/customer/${customerId}`, {
      params: { months },
    });
    return response.data;
  },
};
