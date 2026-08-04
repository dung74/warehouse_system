import api from './api';

export const warehouseService = {
    getAll: async (params = {}) => {
        const response = await api.get('/warehouses/', { params });
        return response.data;
    },
    create: async (warehouseData) => (await api.post('/warehouses/', warehouseData)).data,
    getDetail: async (warehouseId) => (await api.get(`/warehouses/${warehouseId}`)).data,
    update: async (warehouseId, warehouseData) => (await api.put(`/warehouses/${warehouseId}`, warehouseData)).data,
    delete: async (warehouseId) => (await api.delete(`/warehouses/${warehouseId}`)).data,
};