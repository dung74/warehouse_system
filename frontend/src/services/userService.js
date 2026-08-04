import api from './api';

export const userService = {
    getAll: async () => (await api.get('/users/')).data,
    create: async (userData) => (await api.post('/users/', userData)).data,
    changePassword: async (passwordData) => (await api.post('/users/change-password', passwordData)).data,
    getUserDetail: async (userId) => (await api.get(`/users/${userId}`)).data,
};