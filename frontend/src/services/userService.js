import api from './api';

export const userService = {
    getAll: async () => (await api.get('/users/')).data,
    create: async (userData) => (await api.post('/users/', userData)).data,
};