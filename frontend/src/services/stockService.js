import api from './api';

export const stockService = {
    getAll: async (warehouse_id = null) => {
        const url = warehouse_id ? `/stocks?warehouse_id=${warehouse_id}` : '/stocks';
        return (await api.get(url)).data;
    }
};

