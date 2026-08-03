import api from "./api";

export const productService = {
    getAll: async (params = {}) => {
        const response = await api.get('/products/', { params });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/products/', data);
        return response.data;
    },
    update: async (productId, data) => {
        const response = await api.put(`/products/${productId}/`, data);
        return response.data;   
    },
    delete: async (productId) => {
        const response = await api.delete(`/products/${productId}/`);
        return response.data;
    },
    restore: async (productId) => {
        const response = await api.patch(`/products/${productId}/restore`);
        return response.data;
    }
};