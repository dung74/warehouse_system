import api from './api';

export const transactionService = {
    getAll: async () => (await api.get('/transactions')).data,
    create: async (transaction) => (await api.post('/transactions', transaction)).data
};

