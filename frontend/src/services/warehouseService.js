import api from './api';

export const warehouseService = {
    getAll: async () => (await api.get('/warehouses')).data,
    create: async (payload) => (await api.post('/warehouses', payload)).data
};