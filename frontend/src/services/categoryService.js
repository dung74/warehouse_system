import api from "./api";

export const categoryService = {
    getAll: async () => {
        const response = await api.get('/categories/');
        return response.data;

    },
    create: async categoryData => {
        const response = await api.post('/categories/', categoryData);
        return response.data;
    },
    delete: async categoryId => {
        const response = await api.delete(`/categories/${categoryId}/`);
        return response.data;
    }
}