import api from './api';

export const userService = {
    // getAll: async () => (await api.get('/users/')).data,
    getAll: async (params = {}) => {
        const response = await api.get('/users/', { params });
        return response.data;
    },
    create: async (userData) => (await api.post('/users/', userData)).data,
    changePassword: async (passwordData) => (await api.post('/users/change-password', passwordData)).data,
    getUserDetail: async (userId) => (await api.get(`/users/${userId}`)).data,
    deleteUser: async (userId) => (await api.delete(`/users/${userId}`)).data,
    updateUser: async (userId, userData) => (await api.put(`/users/${userId}`, userData)).data,
};