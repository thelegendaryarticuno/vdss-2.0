import axiosClient from './axiosClient';

export interface QuoteItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  salesRepId: string;
  status: string;
  validUntil?: string;
  customer?: any;
  items?: any[];
  total?: number;
}

export const quoteApi = {
  getQuotes: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    salesRepId?: string;
  }) => {
    const response = await axiosClient.get('/quotes', { params });
    return response.data;
  },

  getQuoteById: async (id: string): Promise<{ success: boolean; data: Quote }> => {
    const response = await axiosClient.get(`/quotes/${id}`);
    return response.data;
  },

  createQuote: async (data: {
    customerId: string;
    items: QuoteItem[];
    validUntil?: string;
  }) => {
    const response = await axiosClient.post('/quotes', data);
    return response.data;
  },

  updateQuote: async (id: string, data: {
    items?: QuoteItem[];
    status?: string;
  }) => {
    const response = await axiosClient.put(`/quotes/${id}`, data);
    return response.data;
  },

  sendQuote: async (id: string) => {
    const response = await axiosClient.post(`/quotes/${id}/send`);
    return response.data;
  },

  acceptQuote: async (id: string) => {
    const response = await axiosClient.post(`/quotes/${id}/accept`);
    return response.data;
  },
};
