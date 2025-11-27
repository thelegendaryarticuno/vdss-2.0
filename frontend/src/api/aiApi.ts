import axiosClient from './axiosClient';

export interface SalesForecastData {
  history: Array<{ period: string; totalSales: number }>;
  forecast: Array<{ period: string; predictedSales: number }>;
}

export interface ProductRecommendation {
  productId: string;
  sku: string;
  name: string;
  category: string | null;
  unitPrice: number;
  reason: string;
}

export const aiApi = {
  getSalesForecast: async (params: {
    customerId: string;
    months?: number;
    forecastMonths?: number;
  }): Promise<{ success: boolean; data: SalesForecastData }> => {
    const response = await axiosClient.get('/ai/sales-forecast', { params });
    return response.data;
  },

  getProductRecommendations: async (params: {
    customerId: string;
    limit?: number;
  }): Promise<{ success: boolean; data: ProductRecommendation[] }> => {
    const response = await axiosClient.get('/ai/recommendations', { params });
    return response.data;
  },
};
