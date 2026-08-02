import api from './api';

export const transactionService = {
    getAll: async (params) => (await api.get('/transactions', { params })).data,
    create: async (transaction) => (await api.post('/transactions', transaction)).data
};

