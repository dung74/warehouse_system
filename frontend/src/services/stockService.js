import api from './api';

export const stockService = {
    getAll: async (params) => {
        return (await api.get('/stocks/', { params })).data;
    }
};

