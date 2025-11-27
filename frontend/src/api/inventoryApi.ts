import axiosClient from './axiosClient';

export const inventoryApi = {
  getInventory: async () => {
    const response = await axiosClient.get('/inventory');
    return response.data;
  },

  getProductInventory: async (productId: string) => {
    const response = await axiosClient.get(`/inventory/${productId}`);
    return response.data;
  },

  syncInventory: async () => {
    const response = await axiosClient.post('/inventory/sync');
    return response.data;
  },
};
