import api from "./api";

export const productService = {
    getAll: async () => {
        const response = await api.get('/products/');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/products/', data);
        return response.data;
    },
    delete: async (productId) => {
        const response = await api.delete(`/products/${productId}/`);
        return response.data;
    }
};